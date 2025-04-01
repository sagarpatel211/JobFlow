# Requires PowerShell 5 or higher
# Run via: .\setup.ps1
param (
    [switch] $Production
)

Write-Host "=== Installing Dependencies and Setting Up Project ==="

# 1. Install & Build Frontend
Write-Host "=== Setting up Next.js frontend ==="
Push-Location "apps/frontend"

Write-Host "Installing npm dependencies..."
npm install

if ($Production) {
    Write-Host "Building frontend in production mode..."
    npm run build
} else {
    Write-Host "Skipping production build for dev environment..."
}

Pop-Location

# 2. Set up Go GraphQL API
Write-Host "=== Setting up Go GraphQL API ==="
Push-Location "apps/backend"

Write-Host "Tidying Go modules..."
go mod tidy

Write-Host "Building Go GraphQL server..."
go build -o backend ./src

Pop-Location

Write-Host "=== Setup Complete! ==="
Write-Host "You can now run the GraphQL API server with: apps/backend/graphql-api"
Write-Host "And start Next.js dev server via: cd apps/frontend && npm run dev"
Write-Host "Or start Next.js in production: npm run start"
