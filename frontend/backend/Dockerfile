FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir huggingface_hub

COPY app/ ./app/
COPY models/ ./models/
COPY download_weights.py ./download_weights.py

CMD ["python", "-c", "\
import os; \
import download_weights; download_weights.download_weights(); \
import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))"]
