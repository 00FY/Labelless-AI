@echo off
echo ===================================================
echo   LabelLess AI - Development Environment Launcher
echo ===================================================
echo.

echo [1/3] Running active learning pipeline synchronization...
python run_pipeline.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Pipeline sync failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Starting FastAPI Backend on http://localhost:8000 ...
start "LabelLess AI API Server" cmd /k "python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [3/3] Starting React Frontend on http://localhost:3000 ...
start "LabelLess AI React UI" cmd /k "npm run dev"

echo.
echo ===================================================
echo   LabelLess AI is running!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000/docs
echo ===================================================
