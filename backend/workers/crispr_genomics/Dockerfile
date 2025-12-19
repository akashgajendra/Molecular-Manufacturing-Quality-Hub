# /backend/workers/crispr_genomics/Dockerfile
# Use a suitable base image for installing Linux packages
FROM ubuntu:22.04 

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV GENOME_INDEX_DIR /genomes/Saccharomyces_cerevisiae/sacCer3.1

# Install essentials: Python, wget, unzip, and the binary tool (Bowtie2)
RUN apt-get update && \
    apt-get install -y python3 python3-pip wget unzip build-essential && \
    apt-get install -y bowtie2 && \
    rm -rf /var/lib/apt/lists/*

# === Download and Index the Genome (The Data) ===
# This small genome index is used for fast, reproducible testing
# WORKDIR /genomes
# RUN wget https://genome-idx.s3.amazonaws.com/bt/sacCer3.zip && \
#     unzip sacCer3.zip && \
#     rm sacCer3.zip

# RUN wget https://genome-idx.s3.amazonaws.com/bt/GRCh38_no_alt_analysis_set.zip && \
#     unzip GRCh38_no_alt_analysis_set.zip && \
#     rm GRCh38_no_alt_analysis_set.zip

# === Download and Index the Genome (The Data) ===
# CRITICAL FIX: Replaced the broken S3 link with a stable UCSC source and self-building index.
# WORKDIR /genomes
# Download the stable S. cerevisiae reference genome FASTA (sacCer3 assembly)
# RUN wget http://hgdownload.cse.ucsc.edu/goldenPath/sacCer3/bigZips/chromFa.tar.gz && \
#     tar -xvzf chromFa.tar.gz && \
#     rm chromFa.tar.gz && \
#     cat chr*.fa > sacCer3.fa && \
#     rm chr*.fa

# Build the Bowtie2 index from the FASTA file
# This ensures index compatibility with the installed bowtie2 version
# RUN bowtie2-build sacCer3.fa sacCer3


# WORKDIR /genomes
# # 1. Download the raw FASTA file
# RUN wget http://hgdownload.cse.ucsc.edu/goldenPath/sacCer3/bigZips/chromFa.tar.gz && \
#     tar -xvzf chromFa.tar.gz && \
#     rm chromFa.tar.gz && \
#     cat chr*.fa > sacCer3.fa && \
#     rm chr*.fa

# # 2. **CRITICAL STEP:** Use the installed Bowtie2 utility to create the index files
# RUN bowtie2-build sacCer3.fa sacCer3

# # The old, broken lines are now removed or commented out:
# # RUN wget https://genome-idx.s3.amazonaws.com/bt/sacCer3.zip && \
# #     unzip sacCer3.zip && \
# #     rm sacCer3.zip

# # === Python Environment Setup ===
# WORKDIR /app
# COPY requirements.txt .
# # Install Python dependencies
# RUN pip3 install --no-cache-dir -r requirements.txt

# # Copy all application files (consumer.py, crispr_analysis.py, db_utils, etc.)
# COPY . /app/ 

# # Define the entry point for the worker
# CMD ["python3", "consumer.py"]

# # # Use a Python base image
# # FROM python:3.9-slim-buster

# # # Set environment variables
# # ENV PYTHONUNBUFFERED 1
# # ENV APP_HOME /app

# # # 1. Install system dependencies required for Bowtie2 and build tools
# # RUN apt-get update && \
# #     apt-get install -y --no-install-recommends \
# #     # build-essential needed for general compilation
# #     build-essential \
# #     # wget/unzip needed to download and extract Bowtie2
# #     wget \
# #     unzip \
# #     # python3-pip for Python dependencies
# #     python3-pip \
# #     # clean up lists to reduce image size
# #     && rm -rf /var/lib/apt/lists/*

# # # 2. Install Bowtie2 (The external genomics tool)
# # # We download and install it manually since it's a critical external dependency
# # WORKDIR /usr/local/bin/
# # RUN wget https://sourceforge.net/projects/bowtie-bio/files/bowtie2/2.4.5/bowtie2-2.4.5-linux-x86_64.zip/download -O bowtie2.zip && \
# #     unzip bowtie2.zip && \
# #     rm bowtie2.zip && \
# #     ln -s bowtie2-2.4.5-linux-x86_64/bowtie2 /usr/local/bin/bowtie2 && \
# #     chmod +x /usr/local/bin/bowtie2

# # # 3. Install Python dependencies
# # WORKDIR $APP_HOME
# # COPY requirements.txt .
# # RUN pip install --no-cache-dir -r requirements.txt

# # # 4. Copy the worker application code
# # COPY consumer.py .

# # # Define the default command to run the worker (defined in docker-compose)
# # CMD ["python", "consumer.py"]

#     # /backend/workers/crispr_genomics/Dockerfile
#     # Use a suitable base image for installing Linux packages
#     FROM ubuntu:22.04 

#     # Set environment variables
#     ENV PYTHONUNBUFFERED 1
#     ENV GENOME_INDEX_DIR /genomes/sacCer3

#     # Install essentials: Python, wget, unzip, and the binary tool (Bowtie2)
#     RUN apt-get update && \
#         apt-get install -y python3 python3-pip wget unzip build-essential && \
#         apt-get install -y bowtie2 && \
#         rm -rf /var/lib/apt/lists/*

#     # === Genome Index Setup ===
#     WORKDIR /genomes
#     # 1. Download the raw FASTA file
#     RUN wget http://hgdownload.cse.ucsc.edu/goldenPath/sacCer3/bigZips/chromFa.tar.gz && \
#         tar -xvzf chromFa.tar.gz && \
#         rm chromFa.tar.gz && \
#         cat chr*.fa > sacCer3.fa && \
#         rm chr*.fa

#     # 2. CRITICAL STEP: Use the installed Bowtie2 utility to create the index files
#     RUN bowtie2-build sacCer3.fa sacCer3

#     # === Python Environment Setup ===
#     WORKDIR /app

#     # 1. INSTALL THE SHARED PACKAGE (CRITICAL FIX)
#     # Context is the root, so paths start from the project root (e.g., ./backend/...)
#     COPY ./backend/setup.py /tmp/setup.py
#     COPY ./backend/shared /tmp/shared    # Copy the entire flat source code folder
#     RUN pip3 install /tmp/setup.py

#     # 2. Install Worker-Specific Dependencies
#     COPY ./backend/workers/crispr_genomics/requirements.txt .
#     RUN pip3 install --no-cache-dir -r requirements.txt

#     # 3. Copy the worker's application code
#     # Ensure ALL worker-specific code (e.g., crispr_analysis.py) is copied here
#     COPY ./backend/workers/crispr_genomics/consumer.py .
#     # If you have other worker files, add them here:
#     # COPY ./backend/workers/crispr_genomics/crispr_analysis.py . 

#     # Define the entry point for the worker
#     CMD ["python3", "consumer.py"]