#!/bin/bash

set -e

FRONTEND_DIR="apps/frontend"
BACKEND_DIR="apps/backend"

# Start frontend setup
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

# Start backend setup
echo "🔧 Checking backend Docker image..."
cd "$BACKEND_DIR"

# If image doesn't exist, build it
if ! docker compose images | grep -q "backend"; then
  echo "🐳 Backend image not found, building..."
  docker compose build
fi

echo "🚀 Starting backend..."
docker compose up
