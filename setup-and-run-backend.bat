@echo off
cls
echo ============================================================
echo    VS Code Typing Tracker - Backend Setup and Run
echo ============================================================
echo.

:: Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✓ Node.js is installed
echo.

:: Check if npm is installed
echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install npm or reinstall Node.js
    echo.
    pause
    exit /b 1
)
echo ✓ npm is installed
echo.

:: Install frontend dependencies
echo [3/6] Installing frontend dependencies...
echo Installing packages for VS Code extension...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    echo.
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

:: Navigate to server directory and install backend dependencies
echo [4/6] Installing backend dependencies...
echo Installing packages for Express.js server...
cd server
if not exist package.json (
    echo ERROR: server/package.json not found
    echo Please ensure you're running this from the project root directory
    echo.
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    echo.
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

:: Build the backend TypeScript
echo [5/6] Building backend TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build backend TypeScript
    echo Please check for TypeScript compilation errors
    echo.
    pause
    exit /b 1
)
echo ✓ Backend TypeScript compiled successfully
echo.

:: Check if MongoDB is required and warn user
echo [6/6] Final setup checks...
if not exist .env (
    echo.
    echo ⚠️  WARNING: No .env file found in server directory
    echo You may need to create a .env file with the following:
    echo.
    echo PORT=3001
    echo MONGODB_URI=mongodb://localhost:27017/typing-tracker
    echo CORS_ORIGIN=http://localhost:3000,https://your-frontend-url.vercel.app
    echo.
    echo See .env.example for reference
    echo.
)

echo ============================================================
echo ✓ Setup completed successfully!
echo ============================================================
echo.
echo Starting the backend server...
echo Server will run on http://localhost:3001
echo.
echo To stop the server, press Ctrl+C
echo ============================================================
echo.

:: Start the development server
call npm run dev

:: If we get here, the server was stopped
echo.
echo ============================================================
echo Backend server has been stopped.
echo ============================================================
echo.
pause