# --- STAGE 1: Builder ---
# Use a modern, supported Python version (Debian Bookworm based) to fix apt-get 404s
FROM python:3.11-slim AS builder

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Install system dependencies required for building Python packages (like lxml)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libxml2-dev \
    libxslt-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment
RUN python -m venv /opt/venv
# Make sure we use the virtualenv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY requirements.txt .

# Install Python dependencies into the virtualenv
RUN pip install --no-cache-dir -r requirements.txt


# --- STAGE 2: Runtime ---
# CRITICAL: This must also match the supported version (NOT buster)
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

# Install only the necessary runtime system libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libxml2 \
    libxslt1.1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
# Copy the application code
COPY . .

# Run the consumer
CMD ["python", "consumer.py"]