@echo off
echo ==========================================
echo FacePay ArcFace Setup Script (Windows)
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [X] Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

echo [OK] Python detected
python --version
echo.

REM Navigate to backend directory
cd FacePayBackend
if errorlevel 1 (
    echo [X] Failed to navigate to FacePayBackend directory
    pause
    exit /b 1
)

echo Installing Python dependencies for InsightFace...
echo This may take several minutes...
echo.

REM Install Python dependencies
pip install -r requirements.txt
if errorlevel 1 (
    echo [X] Failed to install Python dependencies
    pause
    exit /b 1
)

echo [OK] Python dependencies installed successfully
echo.

echo Installing Node.js backend dependencies...
call npm install
if errorlevel 1 (
    echo [X] Failed to install backend dependencies
    pause
    exit /b 1
)

echo [OK] Backend Node.js dependencies installed successfully

REM Create temp directory for image processing
if not exist "temp" mkdir temp
echo [OK] Created temp directory for image processing

cd ..

REM Navigate to mobile directory
cd FacePayMobile
if errorlevel 1 (
    echo [X] Failed to navigate to FacePayMobile directory
    pause
    exit /b 1
)

echo.
echo Installing React Native mobile dependencies...
call npm install
if errorlevel 1 (
    echo [X] Failed to install mobile dependencies
    pause
    exit /b 1
)

echo [OK] Mobile dependencies installed successfully

cd ..

echo.
echo ==========================================
echo [OK] Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Configure your database connection in FacePayBackend\.env
echo 2. Configure API URL in FacePayMobile\config\api.js
echo 3. Start the backend: cd FacePayBackend ^&^& npm start
echo 4. Start the mobile app: cd FacePayMobile ^&^& npm start
echo.
echo For more details, see ARCFACE_IMPLEMENTATION.md
echo.
pause
