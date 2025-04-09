@echo off
setlocal enabledelayedexpansion

:: Set directories
set FRONTEND_DIR=apps\frontend
set BACKEND_DIR=apps\backend

:: Set COMPOSE_BAKE environment variable for the session
set COMPOSE_BAKE=false

:: Frontend setup
echo 🔧 Checking frontend setup...
cd %FRONTEND_DIR%

if not exist node_modules (
    echo 📦 Installing frontend dependencies...
    call npm install
)

if not exist .next (
    echo 🛠️ Building frontend...
    call npm run build
)

echo 🚀 Starting frontend...
start /b npm run start

cd ..\..\

:: Backend setup
echo 🔧 Checking backend Docker image...
cd %BACKEND_DIR%

for /f "delims=" %%i in ('docker compose images ^| findstr /i "web"') do set FOUND_WEB=1

if not defined FOUND_WEB (
    echo 🐳 Backend image not found, building with Bake...
    call docker compose build
)

echo 🚀 Starting backend...
call docker compose up

endlocal
