#!/bin/bash

set -e

FRONTEND_DIR="apps/frontend"
BACKEND_DIR="apps/backend"

# Set COMPOSE_BAKE for the session
export COMPOSE_BAKE=true

# Frontend setup
echo "🔧 Checking frontend setup..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

if [ ! -d ".next" ]; then
  echo "🛠️ Building frontend..."
  npm run build
fi

echo "🚀 Starting frontend..."
npm run start &

cd - > /dev/null

# Backend setup
echo "🔧 Checking backend Docker image..."
cd "$BACKEND_DIR"

if ! docker compose images | grep -q "web"; then
  echo "🐳 Backend image not found, building with Bake..."
  docker compose build
fi

echo "🚀 Starting backend..."
docker compose up
