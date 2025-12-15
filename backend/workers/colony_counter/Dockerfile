# backend/workers/colony_counter/Dockerfile

# Use a lean Python base image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy requirements and install dependencies first for faster rebuilds
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application code
COPY consumer.py .
COPY colony_analysis.py .

# CRITICAL: Copy the trained model file (must exist in the context)
# COPY colony_counter.pt .