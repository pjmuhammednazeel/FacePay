#!/bin/bash

echo "=========================================="
echo "FacePay ArcFace Setup Script"
echo "=========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✓ Python 3 detected: $(python3 --version)"
echo ""

# Navigate to backend directory
cd FacePayBackend || exit

echo "Installing Python dependencies for InsightFace..."
echo "This may take several minutes..."
echo ""

# Install Python dependencies
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✓ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

echo ""
echo "Installing Node.js backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Backend Node.js dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Create temp directory for image processing
mkdir -p temp
echo "✓ Created temp directory for image processing"

cd ..

# Navigate to mobile directory
cd FacePayMobile || exit

echo ""
echo "Installing React Native mobile dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Mobile dependencies installed successfully"
else
    echo "❌ Failed to install mobile dependencies"
    exit 1
fi

cd ..

echo ""
echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Configure your database connection in FacePayBackend/.env"
echo "2. Configure API URL in FacePayMobile/config/api.js"
echo "3. Start the backend: cd FacePayBackend && npm start"
echo "4. Start the mobile app: cd FacePayMobile && npm start"
echo ""
echo "For more details, see ARCFACE_IMPLEMENTATION.md"
echo ""
