#!/bin/bash

# VS Code Typing Activity Logger - Installation Script
# This script automates the setup process

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🚀 VS Code Typing Activity Logger - Installation       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for Node.js
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18.x or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version) detected${NC}"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version) detected${NC}"

# Check for MongoDB
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✅ MongoDB detected${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB not found locally. You can use MongoDB Atlas (cloud).${NC}"
fi

echo ""
echo -e "${YELLOW}📦 Installing extension dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Extension dependencies installed${NC}"

echo ""
echo -e "${YELLOW}📦 Installing server dependencies...${NC}"
cd server
npm install
echo -e "${GREEN}✅ Server dependencies installed${NC}"

echo ""
echo -e "${YELLOW}⚙️  Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created from template${NC}"
    echo -e "${YELLOW}📝 Please edit server/.env with your MongoDB connection string${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping...${NC}"
fi

cd ..

echo ""
echo -e "${YELLOW}🔨 Compiling TypeScript...${NC}"
npm run compile
echo -e "${GREEN}✅ TypeScript compiled successfully${NC}"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ Installation Complete!                              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo ""
echo "1. Configure MongoDB connection:"
echo "   Edit: server/.env"
echo "   Set MONGODB_URI to your MongoDB connection string"
echo ""
echo "2. Start the backend server:"
echo "   cd server && npm run dev"
echo ""
echo "3. Configure VS Code extension:"
echo "   - Open VS Code Settings (Ctrl+,)"
echo "   - Search for 'Typing Tracker'"
echo "   - Set your username"
echo ""
echo "4. Run the extension:"
echo "   - Press F5 in VS Code"
echo "   - Or package and install: vsce package"
echo ""
echo -e "${GREEN}📚 Documentation:${NC}"
echo "   - README.md - Full documentation"
echo "   - QUICKSTART.md - Quick start guide"
echo "   - ARCHITECTURE.md - Technical architecture"
echo ""
echo -e "${YELLOW}💡 Need help? Check the documentation or open an issue on GitHub${NC}"
echo ""
