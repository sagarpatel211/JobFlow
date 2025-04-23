#!/bin/bash
set -e

# wait for Postgres
until pg_isready -h db -U postgres; do
  echo "Waiting for Postgres…"
  sleep 2
done

# then run migrations
flask db upgrade

# Start Supervisor (which will launch Gunicorn and the scraper)
exec supervisord -n
