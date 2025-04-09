$frontendDir = "apps/frontend"
$backendDir = "apps/backend"

# Frontend setup
Write-Host "🔧 Checking frontend setup..."
Set-Location $frontendDir

if (-not (Test-Path "node_modules")) {
  Write-Host "📦 Installing frontend dependencies..."
  npm install
}

if (-not (Test-Path ".next")) {
  Write-Host "🛠️ Building frontend..."
  npm run build
}

Write-Host "🚀 Starting frontend..."
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "start"

Set-Location "../.."

# Backend setup
Write-Host "🔧 Checking backend Docker image..."
Set-Location $backendDir

$dockerImages = docker compose images
if ($dockerImages -notmatch "backend") {
  Write-Host "🐳 Backend image not found, building..."
  docker compose build
}

Write-Host "🚀 Starting backend..."
docker compose up
