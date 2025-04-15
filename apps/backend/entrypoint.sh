#!/bin/bash
set -e

sleep 10

# Run database migrations
flask db upgrade

# Start Supervisor (which will launch Gunicorn and the scraper)
exec supervisord -n
  