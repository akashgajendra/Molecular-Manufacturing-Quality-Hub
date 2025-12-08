from sqlalchemy import create_engine, Column, String, Float, DateTime, Integer, func, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB, BOOLEAN # Import JSONB for flexibility
import os
from dotenv import load_dotenv

# Load environment variables (for local testing)
load_dotenv() 

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/db")

# 1. Database Engine and Session
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. Core Identity Table ---
class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    organization = Column(String)

    # Relationship to Jobs
    jobs = relationship("JobModel", back_populates="submitter")

# --- 3. Jobs Table (Workflow Status) ---
class JobModel(Base):
    __tablename__ = "jobs"

    job_id = Column(String, primary_key=True, index=True) # PK is the UUID string
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    service_type = Column(String, index=True, nullable=False) # e.g., 'peptide_qc'
    status = Column(String, default="PENDING", nullable=False)
    
    submitted_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    submitter = relationship("UserModel", back_populates="jobs")
    files = relationship("FileModel", uselist=False, back_populates="job")
    parameters = relationship("ParameterModel", uselist=False, back_populates="job")
    results = relationship("ResultModel", uselist=False, back_populates="job")
    notifications = relationship("NotificationModel", back_populates="job")

# --- 4. Files Table (MinIO/S3 Storage) ---
class FileModel(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.job_id"), unique=True, nullable=False)
    
    s3_uri = Column(String, nullable=False) # The full path in MinIO/S3
    filename = Column(String, nullable=False)
    content_type = Column(String)

    # Relationship
    job = relationship("JobModel", back_populates="files")

# --- 5. Parameters Table (Job Input Configuration) ---
class ParameterModel(Base):
    __tablename__ = "parameters"

    # Use job_id as the primary key and foreign key to enforce 1-to-1 relationship
    job_id = Column(String, ForeignKey("jobs.job_id"), primary_key=True)
    
    # Stores the raw Pydantic submission model as JSON
    # JSONB is highly flexible and indexed in PostgreSQL
    payload = Column(JSONB, nullable=False)

    # Relationship
    job = relationship("JobModel", back_populates="parameters")

# --- 6. Results Table (Worker Output) ---
class ResultModel(Base):
    __tablename__ = "results"

    job_id = Column(String, ForeignKey("jobs.job_id"), primary_key=True)
    
    qc_status = Column(String, nullable=True) # Final PASS/FAIL or Score
    
    # Stores the worker's Pydantic result model as JSON (e.g., scores, counts, etc.)
    output_data = Column(JSONB, nullable=False)

    # Relationship
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

    # Relationship
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