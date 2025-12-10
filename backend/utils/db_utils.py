from sqlAchemy.orm import Session
from backend.api.database import JobModel, ResultModel
import datetime

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
            output_data=result_model.model_dump()
        )
        db.add(result)
        db.commit()
