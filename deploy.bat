@echo off
REM Personal OS - Deploy Script for Windows
REM This script builds and deploys your app to Firebase Hosting

echo.
echo ========================================
echo  Personal OS Deployment Script
echo ========================================
echo.

REM Check if firebase-tools is installed
where firebase >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] Firebase CLI not found!
    echo [*] Installing firebase-tools...
    call npm install -g firebase-tools
    
    if %errorlevel% neq 0 (
        echo [X] Failed to install Firebase CLI
        echo Try running this terminal as Administrator
        pause
        exit /b 1
    )
    echo [√] Firebase CLI installed
)

REM Check if logged in to Firebase
echo [*] Checking Firebase authentication...
firebase projects:list >nul 2>nul

if %errorlevel% neq 0 (
    echo [X] Not logged in to Firebase
    echo [*] Please login...
    call firebase login
    
    if %errorlevel% neq 0 (
        echo [X] Login failed
        pause
        exit /b 1
    )
)

echo [√] Firebase authenticated
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo [*] Installing dependencies...
    call npm install
    
    if %errorlevel% neq 0 (
        echo [X] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [√] Dependencies installed
)

REM Build the app
echo.
echo [*] Building app for production...
call npm run build

if %errorlevel% neq 0 (
    echo [X] Build failed!
    echo Please fix the errors above and try again.
    pause
    exit /b 1
)

echo [√] Build successful!
echo.

REM Deploy to Firebase
echo [*] Deploying to Firebase Hosting...
call firebase deploy --only hosting

if %errorlevel% neq 0 (
    echo [X] Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  [√] Deployment successful!
echo  [*] Your app is now live!
echo.
echo  [*] View your app at the Hosting URL shown above
echo  [*] Monitor: https://console.firebase.google.com
echo ========================================
echo.
pause
