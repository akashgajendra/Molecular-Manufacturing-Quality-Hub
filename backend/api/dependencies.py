import os
from minio import Minio
from minio.error import S3Error
from confluent_kafka import Producer
from fastapi import HTTPException, status
from dotenv import load_dotenv

# Load environment variables (MinIO and Kafka credentials/endpoints)
# Since you run Docker from 'backend/' and your .env is in 'backend/', 
# the paths should be relative to where the API runs (or we rely on Docker environment injection).
# We load it here for local testing outside of Docker.
load_dotenv() 

# --- MinIO (S3) Configuration ---
# Uses the internal Docker service name ('minio_storage') and port ('9000') for connection
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio_storage:9000") 
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD")
MINIO_BUCKET = os.getenv("MINIO_BUCKET_NAME", "quality-hub-dev")
RAW_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio_storage:9000").strip().rstrip('/')

# --- Kafka Configuration ---
# Uses the internal Docker service name ('kafka') and port ('9092')
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")

# 1. Get the raw value and strip all whitespace/slashes immediately

def get_minio_client() -> Minio:
    try:
        # CLEANUP: Minio library needs ONLY "host:port", no http://
        # We strip the protocol specifically after stripping whitespace
        clean_url = RAW_ENDPOINT.replace("http://", "").replace("https://", "")
        
        print(f"DEBUG: Connecting to MinIO at: {clean_url}")
        
        client = Minio(
            clean_url,
            access_key=os.getenv("MINIO_ROOT_USER"),
            secret_key=os.getenv("MINIO_ROOT_PASSWORD"),
            secure=False # Use False because Docker internal traffic is unencrypted
        )
        
        # Ensure bucket exists
        bucket = os.getenv("MINIO_BUCKET_NAME", "quality-hub-dev")
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
        
        client._bucket_name = bucket
        return client
    except Exception as e:
        print(f"General MinIO error: {e}")
        raise HTTPException(status_code=500, detail="MinIO configuration failed.")


def get_kafka_producer() -> Producer:
    """FastAPI Dependency for getting a Kafka Producer instance."""
    try:
        producer = Producer({'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS})
        return producer
    except Exception as e:
        print(f"Kafka Error during connection: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not connect to Kafka messaging system."
        )

# Map topics for easy use in submission routes
KAFKA_TOPIC_MAP = {
    "peptide_qc": "topic-peptide-jobs",
    "colony_counter": "topic-colony-jobs",
    "crispr_genomics": "topic-crispr-jobs",
}