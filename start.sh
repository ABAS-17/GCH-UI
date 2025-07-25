#!/bin/bash

# Urban Intelligence Web UI - Quick Start Script

echo "🏙️ Urban Intelligence - Starting Web UI"
echo "========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the UrbanIntelligence-WebUi directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
fi

# Check if .env.local exists, if not copy from example
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo "🔧 Creating environment configuration..."
        cp .env.example .env.local
        echo "✅ Environment file created (.env.local)"
    else
        echo "🔧 Creating default environment configuration..."
        cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Urban Intelligence
NEXT_PUBLIC_DEBUG=false
EOF
        echo "✅ Default environment file created (.env.local)"
    fi
fi

# Check if backend is running (optional)
echo "🔍 Checking backend connection..."
if curl -s -f -m 3 http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:8000"
else
    echo "⚠️  Backend not detected at http://localhost:8000"
    echo "   The app will work with mock data if backend is unavailable."
    echo "   Make sure your FastAPI backend is running for full functionality."
fi

echo ""
echo "🚀 Starting development server..."
echo "   Web UI will be available at: http://localhost:3000"
echo "   Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev
