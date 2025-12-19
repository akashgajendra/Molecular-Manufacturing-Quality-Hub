# /backend/api/Dockerfile
# Use a standard, slim Python image for efficiency
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file first to leverage Docker caching
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir reduces the size of the final image
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code (main.py, models.py, etc.)
COPY . .

# Expose the default port for FastAPI
EXPOSE 8000

# The startup command is defined in docker-compose.yml, but this serves as a good default
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

    # /backend/workers/crispr_genomics/Dockerfile
    # Use a suitable base image for installing Linux packages
    # FROM ubuntu:22.04 

    # # Set environment variables
    # ENV PYTHONUNBUFFERED 1
    # ENV GENOME_INDEX_DIR /genomes/sacCer3

    # # Install essentials: Python, wget, unzip, and the binary tool (Bowtie2)
    # RUN apt-get update && \
    #     apt-get install -y python3 python3-pip wget unzip build-essential && \
    #     apt-get install -y bowtie2 && \
    #     rm -rf /var/lib/apt/lists/*

    # # === Genome Index Setup ===
    # WORKDIR /genomes
    # # 1. Download the raw FASTA file
    # RUN wget http://hgdownload.cse.ucsc.edu/goldenPath/sacCer3/bigZips/chromFa.tar.gz && \
    #     tar -xvzf chromFa.tar.gz && \
    #     rm chromFa.tar.gz && \
    #     cat chr*.fa > sacCer3.fa && \
    #     rm chr*.fa

    # # 2. CRITICAL STEP: Use the installed Bowtie2 utility to create the index files
    # RUN bowtie2-build sacCer3.fa sacCer3

    # # === Python Environment Setup ===
    # WORKDIR /app

    # # 1. INSTALL THE SHARED PACKAGE (CRITICAL FIX)
    # # Context is the root, so paths start from the project root (e.g., ./backend/...)
    # COPY ./backend/setup.py /tmp/setup.py
    # COPY ./backend/shared /tmp/shared    # Copy the entire flat source code folder
    # RUN pip3 install /tmp/setup.py

    # # 2. Install Worker-Specific Dependencies
    # COPY ./backend/workers/crispr_genomics/requirements.txt .
    # RUN pip3 install --no-cache-dir -r requirements.txt

    # # 3. Copy the worker's application code
    # # Ensure ALL worker-specific code (e.g., crispr_analysis.py) is copied here
    # COPY ./backend/workers/crispr_genomics/consumer.py .
    # # If you have other worker files, add them here:
    # # COPY ./backend/workers/crispr_genomics/crispr_analysis.py . 

    # # Define the entry point for the worker
    # CMD ["python3", "consumer.py"]