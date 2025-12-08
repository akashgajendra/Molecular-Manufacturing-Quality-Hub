# --- STAGE 1: Build Environment ---
FROM python:3.9-slim-buster AS builder

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

# Install system dependencies required for OpenCV build and running the application
# build-essential, cmake, and various image libraries are critical for opencv
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

WORKDIR $APP_HOME

# Copy requirements and install
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt


# --- STAGE 2: Final Runtime Environment (Minimal) ---
FROM python:3.9-slim-buster

ENV APP_HOME /app
WORKDIR $APP_HOME

# Install only the necessary OpenCV runtime libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libsm6 \
    libxext6 \
    libxrender1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy built dependencies and install from wheels
COPY --from=builder /usr/src/app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Copy the worker application code
COPY consumer.py .

# Command is already defined in docker-compose.yml