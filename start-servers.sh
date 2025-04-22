#!/bin/bash
# Script to start both frontend and backend servers
# Run this with: bash start-servers.sh

# Set the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/event-visualizer"

# Function to handle script termination
function cleanup {
  echo "Stopping servers..."
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null
  fi
  if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null
  fi
  exit
}

# Register the cleanup function for Ctrl+C
trap cleanup SIGINT SIGTERM

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
  echo "Backend directory not found: $BACKEND_DIR"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Frontend directory not found: $FRONTEND_DIR"
  exit 1
fi

# Start backend
echo "Starting backend server..."
cd "$BACKEND_DIR"
npm run dev &
BACKEND_PID=$!

# Check if backend started
sleep 2
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "Failed to start backend server!"
  cleanup
  exit 1
fi
echo "Backend started with PID: $BACKEND_PID"

# Start frontend
echo "Starting frontend server..."
cd "$FRONTEND_DIR"
npm start &
FRONTEND_PID=$!

# Check if frontend started
sleep 2
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
  echo "Failed to start frontend server!"
  cleanup
  exit 1
fi
echo "Frontend started with PID: $FRONTEND_PID"

echo "Both servers are running."
echo "Frontend will be available at: http://localhost:3000"
echo "Backend API will be available at: http://localhost:3001"
echo "Press Ctrl+C to stop both servers."

# Keep the script running
wait 