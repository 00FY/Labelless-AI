# LabelLess AI - FastAPI Production Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY config.yaml .
COPY server.py .
COPY run_pipeline.py .
COPY scripts/ ./scripts/
COPY inputs/ ./inputs/
COPY outputs/ ./outputs/
COPY public/ ./public/
COPY data/ ./data/
COPY results/ ./results/

# Synchronize pipeline data
RUN python run_pipeline.py || true

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
