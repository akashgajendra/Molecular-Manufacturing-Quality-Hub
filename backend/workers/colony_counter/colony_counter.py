# backend/workers/colony_counter/colony_analysis.py

import os
import cv2
from ultralytics import YOLO
from minio import Minio 
from models import ResultModel, FileModel # Assuming these are accessible

# Configuration
MINIO_BUCKET = os.getenv("MINIO_BUCKET_NAME", "quality-hub-dev")

# --- Load Model Globally ---
# The model is loaded ONLY ONCE when the worker container starts.
try:
    YOLO_MODEL = YOLO("colony_counter.pt")
    print("SUCCESS: YOLO model loaded for Colony Counter.")
except Exception as e:
    print(f"ERROR: Failed to load YOLO model at startup: {e}")
    YOLO_MODEL = None

def run_colony_counter(db_session, job_id: str, local_image_path: str, analysis_params: dict, minio_client: Minio):
    """Performs colony counting and generates an annotated output image."""
    # Initialize local_output_path for clean-up in case of error
    local_output_path = ""
    
    if not YOLO_MODEL:
        raise RuntimeError("YOLO model is unavailable. Cannot process job.")
        
    try:
        # 1. Run Object Detection Inference
        min_conf = analysis_params.get("min_confidence", 0.5) 
        
        # Runs the CNN on the image
        results = YOLO_MODEL(local_image_path, conf=min_conf, verbose=False)
        result = results[0] # Get the result for the single image
        
        # 2. Extract Count
        colony_count = len(result.boxes)
        
        # 3. Generate Annotated Image
        # result.plot() uses OpenCV to draw bounding boxes directly onto the image
        annotated_image = result.plot()
        
        # 4. Save Annotated Image Locally
        output_filename = f"results_{job_id}_annotated.jpg"
        local_output_path = f"/tmp/{output_filename}"
        cv2.imwrite(local_output_path, annotated_image)
        
        # 5. Upload Annotated Image back to MinIO
        output_object_key = f"results/colony_counter/{output_filename}"
        minio_client.fput_object(
            bucket_name=MINIO_BUCKET,
            object_name=output_object_key,
            file_path=local_output_path,
            content_type="image/jpeg"
        )
        s3_output_uri = f"s3://{MINIO_BUCKET}/{output_object_key}"

        # 6. Prepare Database Result and QC Logic
        output_file_record = FileModel(
            job_id=job_id,
            s3_uri=s3_output_uri,
            filename=output_filename,
            content_type="image/jpeg"
        )
        db_session.add(output_file_record)
        
        output_data_payload = {
            "colony_count": colony_count,
            "detected_locations": result.boxes.xyxy.tolist(),
            "confidence_scores": result.boxes.conf.tolist(),
            "output_image_uri": s3_output_uri
        }

        # Revised QC logic: Check if the model detected anything
        qc_status = "PASS_DETECTED" if colony_count > 0 else "PASS_NO_DETECTIONS"
        
        return ResultModel(
            job_id=job_id,
            qc_status=qc_status,
            output_data=output_data_payload
        )

    except Exception as e:
        # Clean up local file if possible
        if os.path.exists(local_output_path):
            os.remove(local_output_path)
        raise RuntimeError(f"Colony Counter Analysis Failed: {e}")