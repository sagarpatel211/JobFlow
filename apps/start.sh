#!/bin/bash

# Start the Python backend server
python backend/app.py &

# Start the Next.js frontend server
cd frontend && npm run start &

wait
