import os
import json
import logging
from confluent_kafka import Consumer, KafkaException
from minio import Minio
from minio.error import S3Error
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from backend.utils.db_utils import update_job_status, update_job_result

# --- Internal Module Imports (We'll assume you copy over the models/db files) ---
# NOTE: In a real microservice setup, these modules would be packaged or shared.
# For local development, ensure you have copies or symbolic links for these files
# or include them in the worker's Docker build context.

# For simplicity, we define placeholders for the required imports from the API:
from crispr_genomics import run_crispr_analysis # Placeholder for the core analysis function

# --- Configuration ---
load_dotenv()
KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC = "topic-crispr-jobs"
CONSUMER_GROUP = "crispr-genomics-workers"

# MinIO Config
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD")
MINIO_BUCKET = os.getenv("MINIO_BUCKET_NAME", "raw-data-bucket")

# DB Config (Use the internal service name 'postgres')
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/quality_hub_db")

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('crispr-genomics-worker')

# --- Initialization Functions ---
def init_db_session():
    """Initializes the SQLAlchemy engine and session."""
    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        return Session()
    except Exception as e:
        logger.error(f"Failed to initialize database session: {e}")
        return None

def init_kafka_consumer():
    """Initializes the Kafka Consumer."""
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

    logger.info(f"CRISPR Genomics Worker started, listening on topic: {KAFKA_TOPIC}")

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

            # 1. Parse Message
            message_data = json.loads(msg.value().decode('utf-8'))
            job_id = message_data['job_id']
            gRNA_sequence = message_data['parameters']['guide_rna_sequence']
            genome_id = message_data['parameters']['genome_id']
            
            db_session = init_db_session()
            if not db_session: 
                logger.error("Database session initialization failed. Skipping job processing.")
                continue # Skip if DB is down

            logger.info(f"Processing job_id: {job_id}")
            
            try:
                # 2. Update DB Status (PROCESSING)
                update_job_status(db_session, job_id, "PROCESSING")

                # 4. Run Analysis (CORE SCIENTIFIC LOGIC)
                # This function is where the heavy work happens
                result_model = run_crispr_genomics(db_session, job_id, gRNA_sequence, genome_id)

                # 5. Update DB Status (COMPLETED/FAILED)
                # The result_model contains the final qc_status (PASS/FAIL)
                update_job_result(db_session, job_id, result_model)
                
                # 6. Clean up
                consumer.commit(msg)
                logger.info(f"Job {job_id} COMPLETED with status: {result_model.qc_status}")

            except Exception as e:
                logger.error(f"Job {job_id} FAILED during processing: {e}")
                update_job_status(db_session, job_id, "FAILED", error_message=str(e))
                consumer.commit(msg) # Commit message to avoid reprocessing infinite failures

            finally:
                db_session.close()

        except KafkaException as e:
            logger.error(f"Kafka consumer error: {e}")
            
        except KeyboardInterrupt:
            break

    consumer.close()
    logger.info("CRISPR Genomics Worker stopped.")

if __name__ == "__main__":
    start_worker()