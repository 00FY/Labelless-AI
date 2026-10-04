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
COPY results/ ./results/

# data/ is gitignored and absent in a fresh clone; server.py creates it at startup.
# public/ranked_dataset.json is used as committed: re-running run_pipeline.py here would
# regenerate it from inputs/ and silently diverge from what the team demos locally.

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
