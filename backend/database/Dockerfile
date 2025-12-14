# backend/db_init/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 1. Install dependencies
COPY db_init_requirements.txt .
RUN pip install --no-cache-dir -r db_init_requirements.txt

# 2. Copy the initialization script
# Assuming you move the script to the db_init folder for clean build context
COPY db_init.py . 

# Execute the script
CMD ["python", "db_init.py"]