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
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    organization = Column(String)

    jobs = relationship("JobModel", back_populates="submitter")

# --- 3. Jobs Table (Workflow Status) ---
class JobModel(Base):
    __tablename__ = "jobs"

    job_id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    service_type = Column(String, index=True, nullable=False)
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
    job_id = Column(String, ForeignKey("jobs.job_id"), unique=True, nullable=False)
    
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
        
if __name__ == "__main__":
    print("Initializing database schema...")
    create_tables()
    print("Database tables created successfully!")