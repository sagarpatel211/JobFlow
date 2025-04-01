#!/usr/bin/env bash
set -e

# Usage: ./setup.sh [--production]

PRODUCTION=false

if [ "$1" == "--production" ]; then
  PRODUCTION=true
fi

echo "=== Installing Dependencies and Setting Up Project ==="

# 1. Install & Build Frontend
echo "=== Setting up Next.js frontend ==="
cd apps/frontend

echo "Installing npm dependencies..."
npm install

if [ "$PRODUCTION" = true ]; then
  echo "Building frontend in production mode..."
  npm run build
else
  echo "Skipping production build for dev environment..."
fi

cd ../..

# 2. Set up Go GraphQL API
echo "=== Setting up Go GraphQL API ==="
cd apps/backend

echo "Tidying Go modules..."
go mod tidy

echo "Building Go GraphQL server..."
go build -o backend ./src

cd ../..

echo "=== Setup Complete! ==="
echo "You can now run the GraphQL API server with: apps/backend/graphql-api"
echo "And start Next.js dev server via: cd apps/frontend && npm run dev"
echo "Or start Next.js in production: npm run start"
