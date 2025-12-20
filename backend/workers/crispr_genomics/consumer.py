import os
import json
import logging
from confluent_kafka import Consumer, KafkaException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from db_utils import update_job_status, update_job_result

# --- Internal Module Imports ---
# These must be present in your Docker build context
from crispr_analysis import run_crispr_genomics 

# --- Configuration ---
load_dotenv()
KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC = "topic-crispr-jobs"
CONSUMER_GROUP = "crispr-genomics-workers"

# DB Config
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
                logger.warning(f"Kafka consumer warning: {msg.error()}")
                continue
            
            if msg.value() is None:
                logger.warning(f"Received tombstone message. Skipping offset: {msg.offset()}")
                consumer.commit(msg)
                continue

            job_id = None 
            db_session = None
            
            try:
                # 1. Parse Message
                message_data = json.loads(msg.value().decode('utf-8'))
                job_id = message_data.get('job_id')
                
                # Aligning with actual API payload structure:
                parameters = message_data.get('parameters', {})
                guide_rna_sequence = parameters.get('guide_rna_sequence')

                if not guide_rna_sequence:
                    raise KeyError("Field 'guide_rna_sequence' missing from parameters object")

                db_session = init_db_session()
                if not db_session: 
                    logger.error("Database connection failed. Worker will retry on next poll.")
                    continue 

                logger.info(f"Processing job_id: {job_id} | Sequence: {guide_rna_sequence}")
                
                # 2. Update DB Status (PROCESSING)
                update_job_status(db_session, job_id, "PROCESSING")

                # 3. Run Analysis (CORE SCIENTIFIC LOGIC)
                # Ensure run_crispr_genomics is updated to accept this variable name if necessary
                result_model = run_crispr_genomics(job_id, guide_rna_sequence) 

                # 4. Update DB Status (COMPLETED/FAILED)
                update_job_result(db_session, job_id, result_model)
                
                # 5. Clean up
                consumer.commit(msg)
                logger.info(f"Job {job_id} SUCCESSFULLY COMPLETED")

            except (KeyError, json.JSONDecodeError) as e:
                error_message = f"Payload Error: {e}. Raw: {msg.value().decode('utf-8')}"
                logger.error(f"Job FAILED (Parsing). {error_message}")
                
                if db_session and job_id:
                    update_job_status(db_session, job_id, "FAILED")

                consumer.commit(msg) 
            
            except Exception as e:
                logger.error(f"Job {job_id} FAILED during scientific analysis: {e}")
                if db_session and job_id:
                    update_job_status(db_session, job_id, "FAILED")
                consumer.commit(msg)

            finally:
                if db_session:
                    db_session.close()

        except KafkaException as e:
            logger.error(f"Kafka connection error: {e}")
            
        except KeyboardInterrupt:
            break

    consumer.close()
    logger.info("CRISPR Genomics Worker stopped.")

if __name__ == "__main__":
    start_worker()