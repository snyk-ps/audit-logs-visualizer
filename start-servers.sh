#!/bin/bash
# Script to start both frontend and backend servers with environment variables from command-line parameters
# Run this with: bash start-servers.sh [OPTIONS]

# Display help message
function show_help {
  echo "Usage: $0 [OPTIONS]"
  echo "Start both backend and frontend servers for Snyk Audit Log Visualizer"
  echo ""
  echo "Options:"
  echo "  --api-key, -k VALUE     Set Snyk API Key"
  echo "  --org-id, -o VALUE      Set Snyk Organization ID"
  echo "  --group-id, -g VALUE    Set Snyk Group ID"
  echo "  --from-date, -f VALUE   Set start date (format: YYYY-MM-DDTHH:MM:SSZ)"
  echo "  --to-date, -t VALUE     Set end date (format: YYYY-MM-DDTHH:MM:SSZ)"
  echo "  --help, -h              Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 --api-key=YOUR_KEY --group-id=YOUR_GROUP_ID --from-date=2023-01-01T00:00:00Z --to-date=2023-01-31T23:59:59Z"
  exit 0
}

# Check for help option
if [[ "$*" == *"--help"* ]] || [[ "$*" == *"-h"* ]]; then
  show_help
fi

# Parse command line arguments and set environment variables
API_KEY=""
ORG_ID=""
GROUP_ID=""
FROM_DATE=""
TO_DATE=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --api-key=*) API_KEY="${1#*=}" ;;
    -k=*) API_KEY="${1#*=}" ;;
    --org-id=*) ORG_ID="${1#*=}" ;;
    -o=*) ORG_ID="${1#*=}" ;;
    --group-id=*) GROUP_ID="${1#*=}" ;;
    -g=*) GROUP_ID="${1#*=}" ;;
    --from-date=*) FROM_DATE="${1#*=}" ;;
    -f=*) FROM_DATE="${1#*=}" ;;
    --to-date=*) TO_DATE="${1#*=}" ;;
    -t=*) TO_DATE="${1#*=}" ;;
    *)
      echo "Unknown parameter: $1"
      show_help
      ;;
  esac
  shift
done

# Set the base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$BASE_DIR/src/backend"
FRONTEND_DIR="$BASE_DIR/src/frontend"

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

# Set environment variables
export_vars=""
if [ ! -z "$API_KEY" ]; then
  export SNYK_API_KEY="$API_KEY"
  export_vars="$export_vars SNYK_API_KEY"
  echo "Using API Key from command line ✅"
fi

if [ ! -z "$ORG_ID" ]; then
  export SNYK_ORG_ID="$ORG_ID"
  export_vars="$export_vars SNYK_ORG_ID"
  echo "Using Org ID: $ORG_ID ✅"
fi

if [ ! -z "$GROUP_ID" ]; then
  export SNYK_GROUP_ID="$GROUP_ID"
  export_vars="$export_vars SNYK_GROUP_ID"
  echo "Using Group ID: $GROUP_ID ✅"
fi

if [ ! -z "$FROM_DATE" ]; then
  export FROM_DATE="$FROM_DATE"
  export_vars="$export_vars FROM_DATE"
  echo "Using From Date: $FROM_DATE ✅"
fi

if [ ! -z "$TO_DATE" ]; then
  export TO_DATE="$TO_DATE"
  export_vars="$export_vars TO_DATE"
  echo "Using To Date: $TO_DATE ✅"
fi

if [ ! -z "$export_vars" ]; then
  echo "Environment variables set:$export_vars"
fi

# Create cache directories if they don't exist
mkdir -p "$BACKEND_DIR/.dccache"
mkdir -p "$FRONTEND_DIR/.dccache"

# Start backend with environment variables already set
echo "Starting backend server..."
cd "$BACKEND_DIR"
NODE_ENV=development npm run dev > backend.log 2>&1 &
BACKEND_PID=$!

# Check if backend started
sleep 2
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "Failed to start backend server!"
  cat backend.log
  cleanup
  exit 1
fi
echo "Backend started with PID: $BACKEND_PID"
echo "Backend logs are available in $BACKEND_DIR/backend.log"

# Start frontend
echo "Starting frontend server..."
cd "$FRONTEND_DIR"
NODE_ENV=development npm start &
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