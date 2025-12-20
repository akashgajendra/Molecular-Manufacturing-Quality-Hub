import json
import random
import string
from uuid import uuid4
from fastapi import FastAPI, File, Response, UploadFile, Depends, HTTPException, Form, status
from sqlalchemy.orm import Session
from minio import Minio
from confluent_kafka import Producer

# --- Internal Imports ---
from database import get_db, JobModel, ParameterModel, FileModel, UserModel, create_tables
from models import PeptideJobSubmission, ColonyJobSubmission, CRISPRJobSubmission, JobStatus
from auth import get_current_user, get_password_hash, authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from dependencies import get_minio_client, get_kafka_producer, KAFKA_TOPIC_MAP

# --- Setup ---
create_tables() 
app = FastAPI(title="Molecular Manufacturing Quality Hub API")

# --- Helper for Pretty IDs (Guaranteed Unique via DB Primary Key) ---
def format_display_id(db_id: int):
    """Converts database primary key to ANL-00001 format (5 digits)"""
    return f"ANL-{db_id:05d}"

# ====================================================================
# === AUTHENTICATION ENDPOINTS ===
# ====================================================================

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: dict, db: Session = Depends(get_db)):
    """Registers a new lab node."""
    existing_user = db.query(UserModel).filter(UserModel.username == user_data['username']).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Node ID already registered.")
    
    new_user = UserModel(
        username=user_data['username'],
        password_hash=get_password_hash(user_data['password']),
        organization=user_data.get('organization'),
        firstName=user_data.get('firstName'),
        lastName=user_data.get('lastName'),
        email=user_data.get('email')
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
    
    response.set_cookie(
        key="helix_token",
        value=access_token,
        httponly=True,
        secure=False,  # Set to True in production
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {"message": "Uplink Established", "user": user.username}

@app.post("/api/auth/logout")
async def logout(response: Response):
    """Terminates the secure session."""
    response.delete_cookie("helix_token")
    return {"message": "Uplink Terminated"}

@app.get("/api/auth/me")
async def get_me(current_user: UserModel = Depends(get_current_user)):
    return {"username": current_user.username, "org": current_user.organization}

# ====================================================================
# === 1. PEPTIDE QC JOB SUBMISSION ===
# ====================================================================

@app.post("/api/submit/peptide", status_code=status.HTTP_202_ACCEPTED)
async def submit_peptide_qc_job(
    sequence: str = Form(...),
    mzml_file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
    minio_client: Minio = Depends(get_minio_client),
    kafka_producer: Producer = Depends(get_kafka_producer)
):
    service_type = "peptide_qc"
    job_uuid = str(uuid4()) 
    
    # 1. Create DB Record to lock in a UNIQUE ID
    db_job = JobModel(job_id=job_uuid, user_id=current_user.id, service_type=service_type, status=JobStatus.PENDING)
    db.add(db_job)
    db.flush() # Secure the auto-increment 'id' from the DB
    
    display_id = format_display_id(db_job.id)
    db_job.display_id = display_id
    
    # 2. Storage Upload
    file_key = f"{current_user.id}/{job_uuid}/{mzml_file.filename}"
    s3_uri = f"s3://{minio_client._bucket_name}/{file_key}"
    
    try:
        minio_client.put_object(bucket_name=minio_client._bucket_name, object_name=file_key, data=mzml_file.file, length=mzml_file.size, content_type=mzml_file.content_type)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="MinIO Storage Failure")

    # 3. Commit Records
    job_params = PeptideJobSubmission(sequence=sequence, purity_threshold=100.0)
    db.add_all([
        FileModel(job_id=job_uuid, s3_uri=s3_uri, filename=mzml_file.filename, content_type=mzml_file.content_type),
        ParameterModel(job_id=job_uuid, payload=job_params.model_dump())
    ])
    db.commit()

    # 4. Async Dispatch
    try:
        kafka_message = {"job_id": job_uuid, "display_id": display_id, "user_id": current_user.id, "service_type": service_type, "s3_uri": s3_uri, "parameters": job_params.model_dump()}
        kafka_producer.produce(KAFKA_TOPIC_MAP[service_type], key=job_uuid, value=json.dumps(kafka_message))
        kafka_producer.flush()
    except Exception:
        db_job.status = "FAILED"
        db.commit() 
        return {"job_id": display_id, "status": "FAILED"}

    return {"job_id": display_id, "status": JobStatus.PENDING}

# ====================================================================
# === 2. COLONY COUNTER JOB SUBMISSION ===
# ====================================================================

@app.post("/api/submit/colony", status_code=status.HTTP_202_ACCEPTED)
async def submit_colony_counter_job(
    colony_image: UploadFile = File(...),
    min_diameter_mm: float = Form(default=0.5),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
    minio_client: Minio = Depends(get_minio_client),
    kafka_producer: Producer = Depends(get_kafka_producer)
):
    service_type = "colony_counter"
    job_uuid = str(uuid4())
    
    db_job = JobModel(job_id=job_uuid, user_id=current_user.id, service_type=service_type, status=JobStatus.PENDING)
    db.add(db_job)
    db.flush()
    
    display_id = format_display_id(db_job.id)
    db_job.display_id = display_id
    
    file_key = f"{current_user.id}/{job_uuid}/{colony_image.filename}"
    s3_uri = f"s3://{minio_client._bucket_name}/{file_key}"
    
    try:
        minio_client.put_object(bucket_name=minio_client._bucket_name, object_name=file_key, data=colony_image.file, length=colony_image.size, content_type=colony_image.content_type)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="MinIO Storage Failure")

    job_params = ColonyJobSubmission(min_diameter_mm=min_diameter_mm)
    db.add_all([
        FileModel(job_id=job_uuid, s3_uri=s3_uri, filename=colony_image.filename, content_type=colony_image.content_type),
        ParameterModel(job_id=job_uuid, payload=job_params.model_dump())
    ])
    db.commit()

    try:
        kafka_message = {"job_id": job_uuid, "display_id": display_id, "user_id": current_user.id, "service_type": service_type, "s3_uri": s3_uri, "parameters": job_params.model_dump()}
        kafka_producer.produce(KAFKA_TOPIC_MAP[service_type], key=job_uuid, value=json.dumps(kafka_message))
        kafka_producer.flush()
    except Exception:
        db_job.status = "FAILED"
        db.commit()
        return {"job_id": display_id, "status": "FAILED"}

    return {"job_id": display_id, "status": JobStatus.PENDING}

# ====================================================================
# === 3. CRISPR GENOMICS JOB SUBMISSION ===
# ====================================================================

@app.post("/api/submit/crispr", status_code=status.HTTP_202_ACCEPTED)
async def submit_crispr_job(
    guide_rna_sequence: str = Form(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
    kafka_producer: Producer = Depends(get_kafka_producer)
):
    service_type = "crispr_genomics"
    job_uuid = str(uuid4())
    
    db_job = JobModel(job_id=job_uuid, user_id=current_user.id, service_type=service_type, status=JobStatus.PENDING)
    db.add(db_job)
    db.flush()
    
    display_id = format_display_id(db_job.id)
    db_job.display_id = display_id
    
    job_params = CRISPRJobSubmission(guide_rna_sequence=guide_rna_sequence)
    db.add(ParameterModel(job_id=job_uuid, payload=job_params.model_dump()))
    db.commit()

    try:
        kafka_message = {"job_id": job_uuid, "display_id": display_id, "user_id": current_user.id, "service_type": service_type, "s3_uri": None, "parameters": job_params.model_dump()}
        kafka_producer.produce(KAFKA_TOPIC_MAP[service_type], key=job_uuid, value=json.dumps(kafka_message))
        kafka_producer.flush()
    except Exception:
        db_job.status = "FAILED"
        db.commit()
        return {"job_id": display_id, "status": "FAILED"}

    return {"job_id": display_id, "status": JobStatus.PENDING}