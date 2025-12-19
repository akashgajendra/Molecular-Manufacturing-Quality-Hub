import json
from uuid import uuid4
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Form, status
from sqlalchemy.orm import Session
from minio import Minio
from confluent_kafka import Producer

# --- Internal Imports ---
from database import get_db, JobModel, ParameterModel, FileModel, UserModel, create_tables
from models import PeptideJobSubmission, ColonyJobSubmission, CRISPRJobSubmission, JobStatus
from auth import get_current_user # Assumes get_current_user is defined here
from dependencies import get_minio_client, get_kafka_producer, KAFKA_TOPIC_MAP
from auth import get_password_hash, authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
# --- Setup ---
# Initialize DB tables (will only create if they don't exist)
create_tables() 
app = FastAPI(title="Molecular Manufacturing Quality Hub API")

# --- PLACEHOLDER AUTHENTICATION ROUTES ---
# NOTE: The actual login/register logic and token generation are assumed 
# to be implemented in './auth.py' and referenced here.

# Example:
# @app.post("/api/auth/register", response_model=Token)
# def register_user(...):
#     # ... implementation ...
#     pass

# @app.post("/api/auth/login", response_model=Token)
# def login_user(...):
#     # ... implementation ...
#     pass


@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: dict, db: Session = Depends(get_db)):
    """Registers a new lab node."""
    existing_user = db.query(UserModel).filter(UserModel.username == user_data['username']).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Node ID already registered.")
    
    new_user = UserModel(
        username=user_data['username'],
        password_hash=get_password_hash(user_data['password']),
        organization=user_data.get('organization', 'Independent Lab')
    )
    db.add(new_user)
    db.commit()
    return {"status": "Node Initialized"}

@app.post("/api/auth/login")
async def login(response: Response, credentials: dict, db: Session = Depends(get_db)):
    """Verifies credentials and sets an HttpOnly cookie."""
    user = authenticate_user(db, credentials['username'], credentials['password'])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Security Key or Node ID"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    # Set the JWT in a secure, HttpOnly cookie
    response.set_cookie(
        key="helix_token",
        value=access_token,
        httponly=True,   # Prevents XSS theft
        secure=False,    # Set to True in production (HTTPS)
        samesite="lax",  # CSRF Protection
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {"message": "Uplink Established", "user": user.username}

@app.post("/api/auth/logout")
async def logout(response: Response):
    """Terminates the secure session."""
    response.delete_cookie("helix_token")
    return {"message": "Uplink Terminated"}

# --- PROTECTED SAMPLE ROUTE ---
@app.get("/api/auth/me")
async def get_me(current_user: UserModel = Depends(get_current_user)):
    return {"username": current_user.username, "org": current_user.organization}

# ====================================================================
# === 1. PEPTIDE QC JOB SUBMISSION ENDPOINT (Requires File Upload) ===
# ====================================================================

@app.post("/api/submit/peptide", status_code=status.HTTP_202_ACCEPTED)
async def submit_peptide_qc_job(
    # Input Data
    sequence: str = Form(..., description="Amino acid sequence (e.g., 'ACDEF')."),
    # Note: Purity threshold removed from input as logic now uses presence (True/False)
    mzml_file: UploadFile = File(..., description="The raw mass spectrometry data file (.mzML)."),
    
    # Dependencies (Protected route)
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
    minio_client: Minio = Depends(get_minio_client),
    kafka_producer: Producer = Depends(get_kafka_producer)
):
    """Submits a Peptide QC job, stores the file, logs the job, and queues it on Kafka."""
    
    service_type = "peptide_qc"
    # Note: The PeptideJobSubmission model is used here mainly for input validation structure
    job_params = PeptideJobSubmission(sequence=sequence, purity_threshold=100.0) 
    
    if not mzml_file.filename or not mzml_file.filename.lower().endswith('.mzml'):
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a valid .mzML file.")

    job_id = str(uuid4())
    
    # --- 1. File Handling and Storage (MinIO) ---
    file_key = f"{current_user.id}/{job_id}/{mzml_file.filename}"
    s3_uri = f"s3://{minio_client._bucket_name}/{file_key}"
    
    try:
        minio_client.put_object(
            bucket_name=minio_client._bucket_name,
            object_name=file_key,
            data=mzml_file.file, 
            length=mzml_file.size,
            content_type=mzml_file.content_type
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"File upload to MinIO failed: {e}")

    # --- 2. Database Logging (PostgreSQL Transaction) ---
    db_job = JobModel(job_id=job_id, user_id=current_user.id, service_type=service_type, status=JobStatus.PENDING)
    db_file = FileModel(job_id=job_id, s3_uri=s3_uri, filename=mzml_file.filename, content_type=mzml_file.content_type)
    db_params = ParameterModel(job_id=job_id, payload=job_params.model_dump())

    db.add_all([db_job, db_file, db_params])
    # db.commit() moved after Kafka message attempt for safety

    # --- 3. Kafka Queuing (Final Step) ---
    kafka_message = {
        "job_id": job_id, "user_id": current_user.id, "service_type": service_type,
        "s3_uri": s3_uri, "parameters": job_params.model_dump()
    }
    
    try:
        topic = KAFKA_TOPIC_MAP[service_type]
        kafka_producer.produce(topic, key=job_id.encode('utf-8'), value=json.dumps(kafka_message).encode('utf-8'))
        kafka_producer.flush() 
        db.commit() # Commit only if Kafka message succeeded
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Messaging system failure. Job log reverted.")

    return {"job_id": job_id, "status": JobStatus.PENDING, "message": "Peptide QC job submitted and queued."}


# ====================================================================
# === 2. COLONY COUNTER JOB SUBMISSION ENDPOINT (Requires File Upload) ===
# ====================================================================

@app.post("/api/submit/colony", status_code=status.HTTP_202_ACCEPTED)
async def submit_colony_counter_job(
    min_diameter_mm: float = Form(default=0.5, description="Min colony diameter to count."),
    colony_image: UploadFile = File(..., description="Image file (PNG/JPG) of the colonies."),
    
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
    minio_client: Minio = Depends(get_minio_client),
    kafka_producer: Producer = Depends(get_kafka_producer)
):
    service_type = "colony_counter"
    job_params = ColonyJobSubmission(min_diameter_mm=min_diameter_mm)
    job_id = str(uuid4())
    
    # --- 1. File Handling and Storage (MinIO) ---
    file_key = f"{current_user.id}/{job_id}/{colony_image.filename}"
    s3_uri = f"s3://{minio_client._bucket_name}/{file_key}"
    
    try:
        minio_client.put_object(
            bucket_name=minio_client._bucket_name, object_name=file_key, data=colony_image.file,
            length=colony_image.size, content_type=colony_image.content_type
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="File upload to MinIO failed.")

    # --- 2. Database Logging (PostgreSQL Transaction) ---
    db_job = JobModel(job_id=job_id, user_id=current_user.id, service_type=service_type, status=JobStatus.PENDING)
    db_file = FileModel(job_id=job_id, s3_uri=s3_uri, filename=colony_image.filename, content_type=colony_image.content_type)
    db_params = ParameterModel(job_id=job_id, payload=job_params.model_dump())

    db.add_all([db_job, db_file, db_params])
    # db.commit() moved after Kafka message attempt

    # --- 3. Kafka Queuing (Final Step) ---
    kafka_message = {"job_id": job_id, "user_id": current_user.id, "service_type": service_type,
                     "s3_uri": s3_uri, "parameters": job_params.model_dump()}
    try:
        topic = KAFKA_TOPIC_MAP[service_type]
        kafka_producer.produce(topic, key=job_id.encode('utf-8'), value=json.dumps(kafka_message).encode('utf-8'))
        kafka_producer.flush() 
        db.commit() # Commit only if Kafka message succeeded
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Messaging system failure. Job aborted.")

    return {"job_id": job_id, "status": JobStatus.PENDING, "message": "Colony counter job submitted and queued."}


# ====================================================================
# === 3. CRISPR GENOMICS JOB SUBMISSION ENDPOINT (No File Upload) ===
# ====================================================================

@app.post("/api/submit/crispr", status_code=status.HTTP_202_ACCEPTED)
async def submit_crispr_job(
    guide_rna_sequence: str = Form(..., description="The gRNA sequence to check."),
    genome_id: str = Form(..., description="Reference genome ID (e.g., 'GRCh38')."),
    
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
    kafka_producer: Producer = Depends(get_kafka_producer)
):
    service_type = "crispr_genomics"
    job_params = CRISPRJobSubmission(guide_rna_sequence=guide_rna_sequence, genome_id=genome_id)
    job_id = str(uuid4())
    
    # --- 1. Database Logging (PostgreSQL Transaction) ---
    db_job = JobModel(job_id=job_id, user_id=current_user.id, service_type=service_type, status=JobStatus.PENDING)
    # FileModel is skipped as there is no large file upload
    db_params = ParameterModel(job_id=job_id, payload=job_params.model_dump())

    db.add_all([db_job, db_params])
    # db.commit() moved after Kafka message attempt

    # --- 2. Kafka Queuing (Final Step) ---
    kafka_message = {"job_id": job_id, "user_id": current_user.id, "service_type": service_type,
                     "s3_uri": None, "parameters": job_params.model_dump()}
    try:
        topic = KAFKA_TOPIC_MAP[service_type]
        kafka_producer.produce(topic, key=job_id.encode('utf-8'), value=json.dumps(kafka_message).encode('utf-8'))
        kafka_producer.flush() 
        db.commit() # Commit only if Kafka message succeeded
    except Exception:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Messaging system failure. Job aborted.")

    return {"job_id": job_id, "status": JobStatus.PENDING, "message": "CRISPR job submitted and queued (No file upload required)."}