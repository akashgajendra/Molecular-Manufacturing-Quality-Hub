#!/bin/bash
# Script to wait for Kafka and create topics

# Set the bootstrap server address from the environment variable
BROKER_LIST=$KAFKA_BROKER_LISTENER

echo "Waiting for Kafka broker ($BROKER_LIST) to become available..."

# Loop until Kafka is ready (can list topics)
for i in {1..60}; do
    /usr/bin/kafka-topics --list --bootstrap-server $BROKER_LIST > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "Kafka broker is ready after $i seconds."
        break
    fi
    echo "Waiting for Kafka... ($i/60)"
    sleep 1
done

if [ $i -eq 60 ]; then
    echo "Error: Kafka broker did not become ready within 60 seconds."
    exit 1
fi

echo "Creating application topics..."

# Create the necessary topics
/usr/bin/kafka-topics --create --if-not-exists --topic topic-peptide-jobs --partitions 1 --replication-factor 1 --bootstrap-server $BROKER_LIST
/usr/bin/kafka-topics --create --if-not-exists --topic topic-colony-jobs --partitions 1 --replication-factor 1 --bootstrap-server $BROKER_LIST
/usr/bin/kafka-topics --create --if-not-exists --topic topic-crispr-jobs --partitions 1 --replication-factor 1 --bootstrap-server $BROKER_LIST

echo "All required QC topics created successfully!"