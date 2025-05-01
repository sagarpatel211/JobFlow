#!/bin/bash
set -e

until pg_isready -h db -U postgres; do
  echo "Waiting for Postgres…"
  sleep 2
done

flask db upgrade

exec supervisord -n
