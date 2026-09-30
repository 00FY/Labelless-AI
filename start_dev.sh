#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  LabelLess AI - Development Environment Launcher"
echo "==================================================="
echo ""

echo "[1/3] Running active learning pipeline synchronization..."
python3 run_pipeline.py

echo ""
echo "[2/3] Starting FastAPI Backend on http://localhost:8000 ..."
python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload &
API_PID=$!

echo ""
echo "[3/3] Starting React Frontend on http://localhost:3000 ..."
npm run dev &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Shutting down LabelLess AI servers..."
    kill $API_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "==================================================="
echo "  LabelLess AI is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000/docs"
echo "  Press Ctrl+C to terminate both servers."
echo "==================================================="

wait
