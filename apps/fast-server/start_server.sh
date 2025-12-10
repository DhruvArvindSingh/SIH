#!/bin/bash

# FastAPI ML Detection Server Startup Script

echo "🚀 Starting FastAPI ML Detection Server..."
echo "📁 Working directory: $(pwd)"

# Activate virtual environment
echo "📦 Activating virtual environment..."
source .venv/bin/activate

# Check if models directory exists
if [ ! -d "models" ]; then
    echo "⚠️  Warning: 'models' directory not found. Some detection features may be disabled."
    echo "   Please ensure your model files are in the 'models/' directory:"
    echo "   - models/Pothole-Detector.pt"
    echo "   - models/fallenTree.onnx" 
    echo "   - models/bad_sign_detector.onnx"
    echo "   - models/garbage_detection.pt"
    echo "   - models/streetlight.pt"
    echo ""
fi

# Start the server
echo "🌟 Starting FastAPI server on http://localhost:8000"
echo "📡 API endpoints available at:"
echo "   - GET  /           (API info)"
echo "   - POST /pothole    (Pothole detection)"
echo "   - POST /fallentree (Fallen tree detection)" 
echo "   - POST /brokensignage (Broken signage detection)"
echo "   - POST /garbage    (Garbage detection)"
echo "   - POST /streetlight (Streetlight detection)"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo "======================================"

# Run the FastAPI server
uvicorn app:app --host 0.0.0.0 --port 8001 --reload

