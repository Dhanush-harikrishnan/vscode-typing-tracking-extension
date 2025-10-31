@echo off
REM VS Code Typing Activity Logger - Installation Script for Windows
REM This script automates the setup process

echo ╔══════════════════════════════════════════════════════════╗
echo ║  🚀 VS Code Typing Activity Logger - Installation       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Check for Node.js
echo Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18.x or higher.
    exit /b 1
)
node --version
echo ✅ Node.js detected

REM Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed.
    exit /b 1
)
npm --version
echo ✅ npm detected

REM Check for MongoDB
where mongod >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB detected
) else (
    echo ⚠️  MongoDB not found locally. You can use MongoDB Atlas cloud.
)

echo.
echo 📦 Installing extension dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install extension dependencies
    exit /b 1
)
echo ✅ Extension dependencies installed

echo.
echo 📦 Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install server dependencies
    exit /b 1
)
echo ✅ Server dependencies installed

echo.
echo ⚙️  Setting up environment...
if not exist .env (
    copy .env.example .env
    echo ✅ .env file created from template
    echo 📝 Please edit server\.env with your MongoDB connection string
) else (
    echo ⚠️  .env file already exists, skipping...
)

cd ..

echo.
echo 🔨 Compiling TypeScript...
call npm run compile
if %errorlevel% neq 0 (
    echo ❌ Failed to compile TypeScript
    exit /b 1
)
echo ✅ TypeScript compiled successfully

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  ✅ Installation Complete!                              ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Next Steps:
echo.
echo 1. Configure MongoDB connection:
echo    Edit: server\.env
echo    Set MONGODB_URI to your MongoDB connection string
echo.
echo 2. Start the backend server:
echo    cd server ^&^& npm run dev
echo.
echo 3. Configure VS Code extension:
echo    - Open VS Code Settings (Ctrl+,)
echo    - Search for 'Typing Tracker'
echo    - Set your username
echo.
echo 4. Run the extension:
echo    - Press F5 in VS Code
echo    - Or package and install: vsce package
echo.
echo 📚 Documentation:
echo    - README.md - Full documentation
echo    - QUICKSTART.md - Quick start guide
echo    - ARCHITECTURE.md - Technical architecture
echo.
echo 💡 Need help? Check the documentation or open an issue on GitHub
echo.

pause
