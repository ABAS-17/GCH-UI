#!/bin/bash

# Urban Intelligence Web UI - NextJS 15 Quick Start Script

echo "🚀 Urban Intelligence - Starting NextJS 15 Web UI"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org"
    exit 1
fi

# Check Node.js version (NextJS 15 requires Node 18.17+)
NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
MINOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f2)

if [ "$MAJOR_VERSION" -lt 18 ] || ([ "$MAJOR_VERSION" -eq 18 ] && [ "$MINOR_VERSION" -lt 17 ]); then
    echo "❌ Node.js version 18.17 or higher is required for NextJS 15. Current version: $(node -v)"
    echo "   Please upgrade Node.js from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node -v) (NextJS 15 compatible)"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the UrbanIntelligence-WebUi directory"
    exit 1
fi

# Clean install if node_modules exists but package.json was updated
if [ -d "node_modules" ] && [ "package.json" -nt "node_modules" ]; then
    echo "🧹 Package.json updated, cleaning and reinstalling dependencies..."
    rm -rf node_modules package-lock.json
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing NextJS 15 dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        echo "   Try: rm -rf node_modules package-lock.json && npm install"
        exit 1
    fi
    echo "✅ NextJS 15 dependencies installed"
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "🔧 Creating environment configuration..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Urban Intelligence
NEXT_PUBLIC_DEBUG=false
EOF
    echo "✅ Environment file created (.env.local)"
fi

# Check if backend is running (optional)
echo "🔍 Checking backend connection..."
if curl -s -f -m 3 http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:8000"
    BACKEND_STATUS="✅ Connected"
else
    echo "⚠️  Backend not detected at http://localhost:8000"
    echo "   The app will work with mock data if backend is unavailable."
    BACKEND_STATUS="⚠️ Mock data mode"
fi

# Check for NextJS 15 specific optimizations
if command -v turbo &> /dev/null; then
    echo "✅ Turbopack available for faster development"
    TURBO_STATUS="✅ Available"
else
    echo "ℹ️  Turbopack not available (npm install -g turbo to enable)"
    TURBO_STATUS="ℹ️ Not available"
fi

echo ""
echo "🎯 NextJS 15 Configuration Summary:"
echo "   Framework: NextJS 15.0.3"
echo "   React: 19.0.0"  
echo "   Turbopack: $TURBO_STATUS"
echo "   Backend: $BACKEND_STATUS"
echo "   Node.js: $(node -v)"
echo ""
echo "🚀 Starting development server with Turbopack..."
echo "   Web UI will be available at: http://localhost:3000"
echo "   Press Ctrl+C to stop the server"
echo ""

# Start the development server with turbo mode
npm run dev
