# Use a slim Python image
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies, including supervisor
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    supervisor \
    curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Copy Supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8000

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
