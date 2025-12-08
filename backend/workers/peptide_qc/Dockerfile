# --- STAGE 1: Build Environment ---
FROM python:3.9-slim-buster AS builder

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

# Install system dependencies required for building scientific Python packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libxml2-dev \
    libxslt-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory and copy requirements
WORKDIR $APP_HOME
COPY requirements.txt .

# Install packages into a wheelhouse (for efficient transfer)
RUN pip install --upgrade pip
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt


# --- STAGE 2: Final Runtime Environment ---
FROM python:3.9-slim-buster

# Install only the necessary runtime system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libxml2 \
    libxslt1.1 \
    && rm -rf /var/lib/apt/lists/*

ENV APP_HOME /app
WORKDIR $APP_HOME

# Copy built dependencies and install from wheels
COPY --from=builder /usr/src/app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Copy the worker application code
COPY consumer.py .

# Command is already defined in docker-compose.yml