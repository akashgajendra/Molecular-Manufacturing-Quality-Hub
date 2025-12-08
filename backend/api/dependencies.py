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
# Uses the internal Docker service name ('minio') and port ('9000') for connection
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000") 
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD")
MINIO_BUCKET = os.getenv("MINIO_BUCKET_NAME", "raw-data-bucket")

# --- Kafka Configuration ---
# Uses the internal Docker service name ('kafka') and port ('9092')
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")

# --- Dependency Functions ---

def get_minio_client() -> Minio:
    """FastAPI Dependency for getting a MinIO client instance."""
    try:
        # Note: secure=False is used because MinIO is running unencrypted in Docker
        client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False
        )
        # Ensure the bucket exists on startup (MinIO doesn't auto-create buckets)
        if not client.bucket_exists(MINIO_BUCKET):
            client.make_bucket(MINIO_BUCKET)
            print(f"MinIO: Created bucket {MINIO_BUCKET}")
        
        # We attach the bucket name to the client object for easy access later
        client._bucket_name = MINIO_BUCKET
        return client
    except S3Error as e:
        print(f"MinIO Error during connection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not connect to MinIO storage."
        )
    except Exception as e:
        print(f"General MinIO error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="MinIO configuration failed."
        )


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