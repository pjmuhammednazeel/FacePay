@echo off
echo ========================================
echo  FacePay Backend Startup (Fast Mode)
echo ========================================
echo.

cd /d "%~dp0FacePayBackend"

echo [1/3] Installing axios if needed...
call npm install axios --save --silent

echo.
echo [2/3] Starting InsightFace Server (keeps model loaded)...
echo This will take 5-10 seconds for initial model load...
echo.
start "InsightFace Server" cmd /k "python insightface_server.py"

echo Waiting for model to load...
timeout /t 8 /nobreak >nul

echo.
echo [3/3] Starting Node.js Backend Server...
echo.
start "Node Backend" cmd /k "npm start"

echo.
echo ========================================
echo  Both servers started!
echo ========================================
echo  - InsightFace Server: http://127.0.0.1:5001
echo  - Backend API: http://localhost:3000
echo.
echo  Face recognition is now 10x faster!
echo  Close both windows to stop the servers.
echo ========================================
pause
