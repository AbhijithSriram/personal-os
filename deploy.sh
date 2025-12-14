#!/bin/bash

# Personal OS - Deploy Script
# This script builds and deploys your app to Firebase Hosting

echo "🚀 Personal OS Deployment Script"
echo "=================================="
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI not found!"
    echo "📦 Installing firebase-tools..."
    npm install -g firebase-tools
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Firebase CLI"
        echo "Try running: sudo npm install -g firebase-tools"
        exit 1
    fi
    echo "✅ Firebase CLI installed"
fi

# Check if logged in to Firebase
echo "🔐 Checking Firebase authentication..."
firebase projects:list &> /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Firebase"
    echo "🔑 Please login..."
    firebase login
    
    if [ $? -ne 0 ]; then
        echo "❌ Login failed"
        exit 1
    fi
fi

echo "✅ Firebase authenticated"
echo ""

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

# Build the app
echo ""
echo "📦 Building app for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    echo "Please fix the errors above and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy to Firebase
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ Deployment successful!"
echo "🎉 Your app is now live!"
echo ""
echo "🔗 View your app at the Hosting URL shown above"
echo "📊 Monitor: https://console.firebase.google.com"
echo "=================================="
