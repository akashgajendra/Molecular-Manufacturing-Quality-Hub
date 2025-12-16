import os
import cv2
import json
import logging
import shutil # Needed for cleaning up YOLO run directories
from ultralytics import YOLO
from minio import Minio 
from minio.error import S3Error
from sqlalchemy.orm import Session # Correct import for type hinting

# IMPORTANT: You MUST ensure your FileModel and ResultModel are imported from where they are defined.
# I will assume they are in a file named 'db_models'
from db_utils import FileModel, ResultModel 

# --- Configuration ---
MINIO_BUCKET = os.getenv("MINIO_BUCKET_NAME", "quality-hub-dev")
logger = logging.getLogger('colony-analysis')

# --- Load Model Globally ---
# The model is loaded ONLY ONCE when the worker container starts.
try:
    # Use a writable directory for YOLO config/runs inside Docker
    os.environ['YOLO_CONFIG_DIR'] = '/tmp/Ultralytics' 
    MODEL = YOLO("colony_counter.pt")
    logger.info("SUCCESS: YOLO model loaded for Colony Counter.")
except Exception as e:
    logger.error(f"FATAL: Failed to load YOLO model at startup: {e}")
    MODEL = None

def run_colony_counter(
    db_session: Session, 
    job_id: str, 
    input_file_path: str, 
    analysis_params: dict, 
    minio_client: Minio
) -> ResultModel:
    """
    Performs colony counting, uploads the annotated output image, 
    saves the FileModel record, and returns the ResultModel instance.
    """
    # Initialize local output directory for clean-up
    output_dir = "" 
    
    if MODEL is None:
        raise RuntimeError("YOLO model is unavailable. Cannot process job.")
        
    try:
        min_conf = analysis_params.get("min_confidence", 0.5) 
        
        # 1. Run YOLO Inference
        # We use job_id as the run name to ensure a predictable path for the output file
        results = MODEL.predict(
            source=input_file_path, 
            conf=min_conf, 
            save=True, 
            name=job_id, 
            exist_ok=True,
            verbose=False
        )
        
        # 2. Extract Count
        result = results[0] 
        colony_count = len(result.boxes)
        
        # 3. Define Local Output Path and S3 URI
        input_filename = os.path.basename(input_file_path)
        # The output path is runs/detect/job_id/filename.jpg
        output_dir = MODEL.predictor.save_dir 
        local_output_path = os.path.join(output_dir, input_filename)
        
        output_filename = f"{job_id}_annotated.jpg"
        output_object_key = f"output/{job_id}/{output_filename}"
        s3_output_uri = f"s3://{MINIO_BUCKET}/{output_object_key}"

        # 4. Upload Annotated Image to MinIO
        logger.info(f"Uploading output image from {local_output_path} to {output_object_key}")
        
        minio_client.fput_object(
            bucket_name=MINIO_BUCKET,
            object_name=output_object_key,
            file_path=local_output_path,
            content_type="image/jpeg"
        )

        # 5. Create and Save FileModel Record (FIXED: Using Model Constructor)
        file_record = FileModel(
            job_id=job_id,
            s3_uri=s3_output_uri,
            filename=output_filename,
            content_type="image/jpeg"
        )
        db_session.add(file_record) # This is now the correct object type

        # 6. Prepare Final ResultModel and Return It (FIXED: Using Model Constructor)
        qc_status = "PASS" if colony_count > 0 else "FAIL" 
        
        final_output_data = {
            "colony_count": colony_count,
            "min_confidence_used": min_conf,
            "output_s3_uri": s3_output_uri 
        }

        result_model_instance = ResultModel(
            job_id=job_id,
            qc_status=qc_status,
            output_data=final_output_data 
        )
        
        return result_model_instance # Return the ResultModel instance

    except Exception as e:
        logger.error(f"Colony Counter Analysis Error for job {job_id}: {e}")
        # Clean up local files/directories on failure
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)
        
        # Re-raise the exception so consumer.py can catch and update job status to FAILED
        raise RuntimeError(f"Colony Counter Analysis Failed: {e}")

    finally:
        # Clean up local YOLO run directory after successful completion
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)