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