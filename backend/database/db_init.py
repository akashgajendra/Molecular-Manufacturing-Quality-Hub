from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer, func, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB, BOOLEAN
import os

# --- CRITICAL FIXES APPLIED ---
# 1. Removed 'load_dotenv()' because Docker Compose now supplies the environment variables.
# 2. Removed the 'localhost' fallback URL.
# 3. Uses os.environ.get("DATABASE_URL") which will now correctly pull 
#    'postgresql://user:password@postgres:5432/quality_hub_db' from the environment.
# ------------------------------

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    # This should only happen if Docker Compose fails to pass the variable.
    raise ValueError("DATABASE_URL environment variable is not set. Check your .env file and docker-compose.yml 'env_file' directive.")

# --- 1. Database Engine and Session ---
# This line will now connect to the 'postgres' service successfully.
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. Core Identity Table ---
class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firstName = Column(String, unique=True, index=True, nullable=False)
    lastName = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    organization = Column(String)

    jobs = relationship("JobModel", back_populates="submitter")

# --- 3. Jobs Table (Workflow Status) ---
class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(String, unique=True, primary_key=False, nullable=False) # PK is the UUID string
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    display_id = Column(String, unique=True, index=True, nullable=True)
    service_type = Column(String, index=True, nullable=False) # e.g., 'peptide_qc'
    status = Column(String, default="PENDING", nullable=False)
    
    submitted_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)

    submitter = relationship("UserModel", back_populates="jobs")
    files = relationship("FileModel", uselist=False, back_populates="job")
    parameters = relationship("ParameterModel", uselist=False, back_populates="job")
    results = relationship("ResultModel", uselist=False, back_populates="job")
    notifications = relationship("NotificationModel", back_populates="job")


# --- 4. Files Table (MinIO/S3 Storage) ---
class FileModel(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.job_id"), unique=False, nullable=False)
    
    s3_uri = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    content_type = Column(String)

    job = relationship("JobModel", back_populates="files")

# --- 5. Parameters Table (Job Input Configuration) ---
class ParameterModel(Base):
    __tablename__ = "parameters"

    job_id = Column(String, ForeignKey("jobs.job_id"), primary_key=True)
    
    payload = Column(JSONB, nullable=False)

    job = relationship("JobModel", back_populates="parameters")

# --- 6. Results Table (Worker Output) ---
class ResultModel(Base):
    __tablename__ = "results"

    job_id = Column(String, ForeignKey("jobs.job_id"), primary_key=True)
    
    qc_status = Column(String, nullable=True)
    
    output_data = Column(JSONB, nullable=False)

    job = relationship("JobModel", back_populates="results")

# --- 7. Notifications Table (User Alerts) ---
class NotificationModel(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.job_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    message = Column(Text, nullable=False)
    type = Column(String, default="status")
    is_read = Column(BOOLEAN, default=False)
    created_at = Column(DateTime, default=func.now())

    job = relationship("JobModel", back_populates="notifications")

# Function to create tables on startup (used in development)
def create_tables():
    """Creates all defined tables in the connected database."""
    Base.metadata.create_all(bind=engine)


# Dependency to get a new database session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# New function to insert default user and job records for testing
def create_default_records(db_session):
    """Inserts a default user and test jobs if they don't already exist."""
    default_user_id = 1
    
    # --- 1. Insert Default User (ID 1) ---
    existing_user = db_session.query(UserModel).filter(UserModel.id == default_user_id).first()
    if not existing_user:
        default_user = UserModel(
            id=default_user_id,
            firstName="Dev",
            lastName="Tester",
            username="test_user",
            password_hash="dev_test_hash", 
            organization="DevTeam",
            email="dev@test.com"
        )
        db_session.add(default_user)
        print(f"-> Inserted default user (ID: {default_user_id}).")
    else:
        print(f"-> Default user (ID: {default_user_id}) already exists.")

    # --- 2. Insert Default Job (ID '1') for CRISPR Worker Test ---
    default_job_id_crispr = '1'
    existing_job_crispr = db_session.query(JobModel).filter(JobModel.job_id == default_job_id_crispr).first()
    
    if not existing_job_crispr:
        default_job_crispr = JobModel(
            job_id=default_job_id_crispr,
            user_id=default_user_id,
            service_type="crispr_genomics",
            status="PENDING" 
        )
        db_session.add(default_job_crispr)
        print(f"-> Inserted default job (ID: {default_job_id_crispr}) for CRISPR testing.")
    else:
        print(f"-> Default job (ID: {default_job_id_crispr}) already exists.")

    # --- 3. Insert Default Job (ID '2') for Peptide QC Worker Test ---
    default_job_id_peptide = '2'
    
    existing_job_peptide = db_session.query(JobModel).filter(JobModel.job_id == default_job_id_peptide).first()
    
    if not existing_job_peptide:
        # A. Create the Job Record
        default_job_peptide = JobModel(
            job_id=default_job_id_peptide,
            user_id=default_user_id,
            service_type="peptide_qc",
            status="PENDING"
        )
        db_session.add(default_job_peptide)

        # B. Create the File Record (simulating the upload step)
        default_file = FileModel(
            job_id=default_job_id_peptide,
            s3_uri="s3://quality-hub-dev/test-data/peptide_qc/input_peptide.fasta",
            filename="input_peptide.fasta",
            content_type="application/octet-stream"
        )
        db_session.add(default_file)

        # C. Create the Parameter Record (simulating the JSON payload)
        default_params = ParameterModel(
            job_id=default_job_id_peptide,
            payload={
                "min_purity_percent": 95.0,
                "target_peptide": "AVLFGWTRN"
            }
        )
        db_session.add(default_params)
        
        print(f"-> Inserted default job (ID: {default_job_id_peptide}), File, and Parameters for Peptide QC testing.")
    else:
        print(f"-> Default job (ID: {default_job_id_peptide}) already exists.")

    # --- 4. Insert Default Job (ID '3') for Colony Counter Worker Test ---
    default_job_id_colony = '3'
    existing_job_colony = db_session.query(JobModel).filter(JobModel.job_id == default_job_id_colony).first()
    
    if not existing_job_colony:
        # A. Create the Job Record
        default_job_colony = JobModel(
            job_id=default_job_id_colony,
            user_id=default_user_id,
            service_type="colony_counter", # Match the service type to the worker
            status="PENDING"
        )
        db_session.add(default_job_colony)

        # B. Create the File Record (simulating the image upload step) - CORRECTED PATH
        default_file_colony = FileModel(
            job_id=default_job_id_colony,
            s3_uri="s3://quality-hub-dev/test/colony_counter/356.jpg", # Uses the corrected path
            filename="356.jpg",
            content_type="image/jpeg"
        )
        db_session.add(default_file_colony)

        # C. Create the Parameter Record (simulating the JSON payload)
        default_params_colony = ParameterModel(
            job_id=default_job_id_colony,
            payload={
                "min_confidence": 0.5, # The confidence level for YOLO detection
                "analysis_note": "Initial deployment test."
            }
        )
        db_session.add(default_params_colony)
        
        print(f"-> Inserted default job (ID: {default_job_id_colony}), File, and Parameters for Colony Counter testing.")
    else:
        print(f"-> Default job (ID: {default_job_id_colony}) already exists.")

    db_session.commit()

# Function to create tables on startup (used in development)
def create_tables():
    """Creates all defined tables in the connected database."""
    Base.metadata.create_all(bind=engine)

# --- MAIN EXECUTION BLOCK ---
if __name__ == "__main__":
    print("Initializing database schema...")
    
    # 1. Create all tables
    create_tables()
    print("Database tables created successfully!")
    
    # 2. Insert default records using a new session
    db = SessionLocal()
    try:
        print("Inserting default records for testing...")
        create_default_records(db)
        print("Default records insertion complete.")
    except Exception as e:
        db.rollback()
        print(f"Error during default record insertion: {e}")
    finally:
        db.close()
        
    print("Database initialization process finished.")