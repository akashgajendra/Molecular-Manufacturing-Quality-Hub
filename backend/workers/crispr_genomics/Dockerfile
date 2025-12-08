# Use a Python base image
FROM python:3.9-slim-buster

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

# 1. Install system dependencies required for Bowtie2 and build tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    # build-essential needed for general compilation
    build-essential \
    # wget/unzip needed to download and extract Bowtie2
    wget \
    unzip \
    # python3-pip for Python dependencies
    python3-pip \
    # clean up lists to reduce image size
    && rm -rf /var/lib/apt/lists/*

# 2. Install Bowtie2 (The external genomics tool)
# We download and install it manually since it's a critical external dependency
WORKDIR /usr/local/bin/
RUN wget https://sourceforge.net/projects/bowtie-bio/files/bowtie2/2.4.5/bowtie2-2.4.5-linux-x86_64.zip/download -O bowtie2.zip && \
    unzip bowtie2.zip && \
    rm bowtie2.zip && \
    ln -s bowtie2-2.4.5-linux-x86_64/bowtie2 /usr/local/bin/bowtie2 && \
    chmod +x /usr/local/bin/bowtie2

# 3. Install Python dependencies
WORKDIR $APP_HOME
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the worker application code
COPY consumer.py .

# Define the default command to run the worker (defined in docker-compose)
CMD ["python", "consumer.py"]