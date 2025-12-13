# --- STAGE 1: Builder ---
# Use a modern, supported Python version to fix apt-get 404s
FROM python:3.11-slim AS builder

ENV PYTHONUNBUFFERED=1

# Install system dependencies required for OpenCV and building packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    pkg-config \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt


# --- STAGE 2: Runtime ---
# CRITICAL: This must also match the supported version (NOT buster)
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

# Install only the necessary OpenCV runtime libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libsm6 \
    libxext6 \
    libxrender1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
# Copy the application code
COPY . .

# Run the consumer
CMD ["python", "consumer.py"]