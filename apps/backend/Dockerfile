FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . /app/

# Set permissions for the scripts
RUN chmod +x /app/wait_for_it.sh /app/run_migration.py

EXPOSE 5000

# Use gunicorn as the WSGI server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
