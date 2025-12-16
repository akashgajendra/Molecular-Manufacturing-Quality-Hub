import os
import json
import logging
from confluent_kafka import Consumer, KafkaException
from minio import Minio
from minio.error import S3Error
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
# Removed: from dotenv import load_dotenv 
from db_utils import update_job_status, update_job_result
from colony_counter import run_colony_counter 

# --- Configuration ---
KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC = "topic-colony-jobs"
CONSUMER_GROUP = "colony-counter-workers"

# MinIO Config
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD")
MINIO_BUCKET = os.getenv("MINIO_BUCKET_NAME", "quality-hub-dev")

# DB Config (Use the internal service name 'postgres')
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/quality_hub_db")

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('colony-counter-worker')

# --- Global DB Initialization (Performance Fix) ---
try:
    ENGINE = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=ENGINE, autocommit=False, autoflush=False)
    logger.info("Database Engine initialized successfully for pooling.")
except Exception as e:
    logger.critical(f"FATAL: Failed to initialize database engine: {e}")
    ENGINE = None
    SessionLocal = None


def init_minio_client():
    """Initializes the MinIO client."""
    # ... (same as before) ...
    try:
        client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=False)
        return client
    except Exception as e:
        logger.error(f"Failed to initialize MinIO client: {e}")
        return None

def init_kafka_consumer():
    """Initializes the Kafka Consumer."""
    # ... (same as before) ...
    conf = {
        'bootstrap.servers': KAFKA_BROKER,
        'group.id': CONSUMER_GROUP,
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': False
    }
    consumer = Consumer(conf)
    consumer.subscribe([KAFKA_TOPIC])
    return consumer

# --- Core Processing Loop ---

def start_worker():
    """Main function to start the Kafka consumer worker."""
    consumer = init_kafka_consumer()
    minio_client = init_minio_client()
    
    if not minio_client or not SessionLocal:
        logger.critical("Critical client (MinIO/DB) failed to initialize. Worker cannot proceed.")
        return

    logger.info(f"Colony Counter Worker started, listening on topic: {KAFKA_TOPIC}")

    while True:
        try:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().fatal():
                    logger.error(f"Fatal Kafka error: {msg.error()}")
                    break
                continue

            # 1. Parse Message and Get Session
            message_data = json.loads(msg.value().decode('utf-8'))
            job_id = message_data['job_id']
            s3_uri = message_data['s3_uri']
            
            # Use the global session factory
            db_session = SessionLocal() 

            logger.info(f"Processing job_id: {job_id}")
            
            try:
                # 2. Update DB Status (PROCESSING)
                update_job_status(db_session, job_id, "PROCESSING")
                # db_session is now in a transaction state after the first commit in update_job_status

                # 3. Download File from MinIO (RETAINED)
                _, object_key = s3_uri.split(f"s3://{MINIO_BUCKET}/")
                file_extension = object_key.split('.')[-1]
                input_file_path = f"/tmp/{job_id}_input.{file_extension}"
                
                logger.info(f"Downloading {object_key} to {input_file_path}")
                minio_client.fget_object(MINIO_BUCKET, object_key, input_file_path)

                # 4. Run Analysis
                result_model = run_colony_counter(
                    db_session, 
                    job_id, 
                    input_file_path, 
                    message_data, 
                    minio_client
                ) 
                
                # 5. Update DB Status (COMPLETED) - Includes file and result insertion/commit
                update_job_result(db_session, job_id, result_model)
                
                # 6. Clean up
                os.remove(input_file_path)
                
                consumer.commit(msg)
                logger.info(f"Job {job_id} COMPLETED with status: {result_model.qc_status}")

            except Exception as e:
                logger.error(f"Job {job_id} FAILED during processing: {e}")
                
                # --- ROBUSTNESS FIX ---
                # 1. Rollback the session to clear the previous failed transaction state.
                db_session.rollback()
                # 2. Update status (this will begin a new transaction)
                update_job_status(db_session, job_id, "FAILED")
                
                consumer.commit(msg) # Commit the Kafka message so it isn't reprocessed endlessly

            finally:
                # Always close the session
                if db_session:
                    db_session.close()

        except KafkaException as e:
            logger.error(f"Kafka consumer error: {e}")
            
        except KeyboardInterrupt:
            break

    consumer.close()
    logger.info("Colony Counter Worker stopped.")

if __name__ == "__main__":
    start_worker()