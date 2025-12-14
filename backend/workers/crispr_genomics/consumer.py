import os
import json
import logging
from confluent_kafka import Consumer, KafkaException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from db_utils import update_job_status, update_job_result

# --- Internal Module Imports (We'll assume you copy over the models/db files) ---
# NOTE: In a real microservice setup, these modules would be packaged or shared.
# For local development, ensure you have copies or symbolic links for these files
# or include them in the worker's Docker build context.

# For simplicity, we define placeholders for the required imports from the API:
from crispr_analysis import run_crispr_genomics # Placeholder for the core analysis function

# --- Configuration ---
load_dotenv()
KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC = "topic-crispr-jobs"
CONSUMER_GROUP = "crispr-genomics-workers"

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

# --- Core Processing Loop ---

def start_worker():
    """Main function to start the Kafka consumer worker."""
    consumer = init_kafka_consumer()

    logger.info(f"CRISPR Genomics Worker started, listening on topic: {KAFKA_TOPIC}")

    while True:
        # Outer try/except handles Kafka connection and termination
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
            
            # Check for tombstone/empty message value
            if msg.value() is None:
                logger.warning(f"Received message with None value (potential tombstone). Skipping offset: {msg.offset()}")
                consumer.commit(msg)
                continue

            # --- Inner try/except block for handling bad message content ---
            job_id = None # Define job_id before inner try block for error reporting
            db_session = None
            
            try:
                # 1. Parse Message
                message_data = json.loads(msg.value().decode('utf-8'))
                job_id = message_data['job_id']
                
                # These lines are the crash point for bad payloads:
                gRNA_sequence = message_data['gRNA_sequence']
                genome_id = message_data.get('genome_id', 'sacCer3')

                db_session = init_db_session()
                if not db_session: 
                    logger.error("Database session initialization failed. Skipping job processing.")
                    # Do NOT commit if DB failed, worker should retry on restart.
                    continue 

                logger.info(f"Processing job_id: {job_id}")
                
                # 2. Update DB Status (PROCESSING)
                update_job_status(db_session, job_id, "PROCESSING")

                # 3. Run Analysis (CORE SCIENTIFIC LOGIC)
                result_model = run_crispr_genomics(job_id, gRNA_sequence, genome_id) 

                # 4. Update DB Status (COMPLETED/FAILED)
                update_job_result(db_session, job_id, result_model)
                
                # 5. Clean up
                consumer.commit(msg)
                logger.info(f"Job {job_id} COMPLETED with status: {result_model.qc_status}")

            # --- CATCH PARSING AND PAYLOAD ERRORS ---
            except (KeyError, json.JSONDecodeError) as e:
                error_message = f"Invalid payload structure or JSON format: {e}. Message: {msg.value().decode('utf-8')}"
                logger.error(f"Job FAILED (Parsing Error). {error_message}")
                
                # Best Effort: Try to update DB if job_id was successfully extracted
                if db_session and job_id:
                    update_job_status(db_session, job_id, "FAILED")

                # CRITICAL: Commit the offset to move past the bad message and stop the restart loop
                consumer.commit(msg) 
            
            # --- CATCH GENERAL JOB PROCESSING ERRORS (e.g., Bowtie2 failure, DB errors) ---
            except Exception as e:
                error_message = str(e)
                logger.error(f"Job {job_id} FAILED during processing: {e}")
                
                if db_session and job_id:
                    update_job_status(db_session, job_id, "FAILED")
                
                consumer.commit(msg) # Commit message to avoid reprocessing infinite failures

            finally:
                if db_session:
                    db_session.close()

        except KafkaException as e:
            logger.error(f"Kafka consumer error: {e}")
            # Consider adding a sleep or re-initialization logic here for transient connection issues
            
        except KeyboardInterrupt:
            break

    consumer.close()
    logger.info("CRISPR Genomics Worker stopped.")

if __name__ == "__main__":
    start_worker()