#!/bin/bash
set -e

echo "Waiting for Elasticsearch cluster to be healthy..."
until curl -sSf "http://elasticsearch:9200/_cluster/health?wait_for_status=yellow" >/dev/null; do
  echo "Elasticsearch cluster not healthy yet, retrying in 3 seconds..."
  sleep 3
done

# Run database migrations
flask db upgrade

# Start Supervisor (which will launch Gunicorn and the scraper)
exec supervisord -n
