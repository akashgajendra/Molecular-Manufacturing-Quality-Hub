from sqlalchemy import create_engine, Column, String, DateTime, Integer, ForeignKey, func, Text
from sqlalchemy.orm import Session, declarative_base, sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB, BOOLEAN
import datetime

SQLALCHEMY_DATABASE_URL = "postgresql://user:password@postgres:5432/db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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
    
    s3_uri = Column(String, nullable=False) # The full path in MinIO/S3
    filename = Column(String, nullable=False)
    content_type = Column(String)

    job = relationship("JobModel", back_populates="files")

# --- 5. Parameters Table (Job Input Configuration) ---
class ParameterModel(Base):
    __tablename__ = "parameters"

    # Use job_id as the primary key and foreign key to enforce 1-to-1 relationship
    job_id = Column(String, ForeignKey("jobs.job_id"), primary_key=True)
    
    # Stores the raw Pydantic submission model as JSON
    # JSONB is highly flexible and indexed in PostgreSQL
    payload = Column(JSONB, nullable=False)

    job = relationship("JobModel", back_populates="parameters")

# --- 6. Results Table (Worker Output) ---
class ResultModel(Base):
    __tablename__ = "results"

    job_id = Column(String, ForeignKey("jobs.job_id"), primary_key=True)
    
    qc_status = Column(String, nullable=True) # Final PASS/FAIL or Score
    
    # Stores the worker's Pydantic result model as JSON (e.g., scores, counts, etc.)
    output_data = Column(JSONB, nullable=False)

    job = relationship("JobModel", back_populates="results")

# --- 7. Notifications Table (User Alerts) ---
class NotificationModel(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.job_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Redundant FK, but useful for quick queries
    
    message = Column(Text, nullable=False) # e.g., "Peptide QC job 123 is COMPLETE."
    type = Column(String, default="status")
    is_read = Column(BOOLEAN, default=False)
    created_at = Column(DateTime, default=func.now())

    job = relationship("JobModel", back_populates="notifications")

def update_job_status(db: Session, job_id: str, status: str):
    job = db.query(JobModel).filter(JobModel.job_id == job_id).first()
    if job:
        job.status = status
        db.commit()

def update_job_result(db: Session, job_id: str, result_model):
    job = db.query(JobModel).filter(JobModel.job_id == job_id).first()
    if job:
        job.status = "COMPLETED"
        job.completed_at = datetime.datetime.now()
        result = ResultModel(
            job_id=job_id,
            qc_status = result_model.qc_status,
            output_data=result_model.output_data
        )
        db.add(result)
        db.commit()