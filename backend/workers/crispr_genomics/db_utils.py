from sqlalchemy import create_engine, Column, String, DateTime, Integer, ForeignKey, func
from sqlalchemy.orm import Session, declarative_base, sessionmaker, relationship
from sqlalchemy.dialects.postgresql import JSONB
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

class JobModel(Base):
    __tablename__ = "jobs"
    job_id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_type = Column(String, index=True, nullable=False)
    status = Column(String, default="PENDING", nullable=False)
    submitted_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
    submitter = relationship("UserModel", back_populates="jobs")

class ResultModel(Base):
    __tablename__ = "results"
    job_id = Column(String, ForeignKey("jobs.job_id"), primary_key=True)
    qc_status = Column(String, nullable=True)
    output_data = Column(JSONB, nullable=False)


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
            output_data=result_model()
        )
        db.add(result)
        db.commit()