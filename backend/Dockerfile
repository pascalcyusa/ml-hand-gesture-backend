# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies (needed for psycopg2 and other libraries)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start server (can be overridden by docker-compose or cloud run)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
