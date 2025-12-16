# backend/workers/colony_counter/Dockerfile

# Use a lean Python base image
FROM python:3.11-slim
RUN apt-get update && \ 
    apt-get install -y \
        # Dependencies for libGL/OpenGL (Previously fixed issue)
        libgl1 \
        # Dependency for libgthread-2.0.so.0 (Current issue)
        libglib2.0-0 \
        # Other common dependencies for OpenCV in headless containers
        libsm6 \
        libxext6 && \
    rm -rf /var/lib/apt/lists/*
# Set the working directory inside the container
WORKDIR /app

# Copy requirements and install dependencies first for faster rebuilds
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application code
COPY consumer.py .
COPY colony_counter.py .

# CRITICAL: Copy the trained model file (must exist in the context)
# COPY colony_counter.pt .