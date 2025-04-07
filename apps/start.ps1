# Start backend server
Start-Process "python" -ArgumentList "backend/app.py"

# Start the Next.js frontend server
Start-Process "npm" -ArgumentList "run start" -WorkingDirectory "./frontend"
