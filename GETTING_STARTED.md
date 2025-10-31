# 🎯 Getting Started with VS Code Typing Activity Logger

Welcome! This guide will help you get up and running in **5 minutes**.

## ⚡ Quick Install

### Option 1: Automated Installation (Recommended)

**Windows:**
```bash
install.bat
```

**macOS/Linux:**
```bash
chmod +x install.sh
./install.sh
```

### Option 2: Manual Installation

```bash
# 1. Install extension dependencies
npm install

# 2. Install server dependencies
cd server
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your MongoDB connection

# 4. Compile TypeScript
cd ..
npm run compile
```

## 🗄️ MongoDB Setup

### Option A: Local MongoDB

```bash
# Install MongoDB (if not already installed)
# macOS: brew install mongodb-community
# Windows: Download from mongodb.com
# Linux: sudo apt-get install mongodb

# Start MongoDB
mongod --dbpath /path/to/data
```

### Option B: MongoDB Atlas (Cloud - Free Tier)

1. Visit https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a cluster (M0 Free tier)
4. Get your connection string
5. Update `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vscode_tracker
   ```

## ⚙️ Configuration

### 1. Configure Backend (.env)

Edit `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/vscode_tracker
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

### 2. Configure Extension

**Option A: VS Code Settings UI**
1. Press `Ctrl+,` (or `Cmd+,` on Mac)
2. Search for "Typing Tracker"
3. Set your username: e.g., "johndoe"

**Option B: settings.json**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
2. Type "Preferences: Open User Settings (JSON)"
3. Add:

```json
{
  "typingTracker.username": "johndoe",
  "typingTracker.apiEndpoint": "http://localhost:3000/api",
  "typingTracker.enabled": true,
  "typingTracker.trackContentSnippets": false,
  "typingTracker.debounceInterval": 2000
}
```

## 🚀 Running the Project

### Terminal 1: Start Backend Server

```bash
cd server
npm run dev
```

**Expected Output:**
```
╔══════════════════════════════════════════════╗
║  🚀 VS Code Typing Tracker Server Started   ║
╠══════════════════════════════════════════════╣
║  Port:        3000                           ║
║  Environment: development                    ║
║  Database:    MongoDB Connected ✅           ║
╚══════════════════════════════════════════════╝
```

### Terminal 2: Run Extension

**Development Mode:**
1. Open project in VS Code
2. Press `F5`
3. Extension Development Host opens
4. Start typing in files!

**Package & Install:**
```bash
# Install VSCE if not installed
npm install -g vsce

# Package extension
vsce package

# Install
code --install-extension vscode-typing-tracker-1.0.0.vsix
```

## 🧪 Test the Extension

### 1. Test Typing Detection

1. Open Extension Development Host (F5)
2. Create a new file: `test.js`
3. Type some code:
   ```javascript
   function hello() {
     console.log("Hello World");
   }
   ```
4. Save the file

### 2. Test Paste Detection

1. Copy this code:
   ```javascript
   const add = (a, b) => a + b;
   const subtract = (a, b) => a - b;
   const multiply = (a, b) => a * b;
   ```
2. Paste into your file
3. Save the file

### 3. View Your Stats

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
2. Type: "Typing Tracker: Show Today's Statistics"
3. You should see:
   - Typed lines
   - Pasted lines
   - Typing/Pasting ratio
   - Files edited

### 4. Check Backend Logs

In your server terminal, you should see:
```
2025-10-31T14:30:00.000Z - POST /api/activity/batch
```

### 5. Verify Database

```bash
# Connect to MongoDB
mongosh vscode_tracker

# View logs
db.activitylogs.find().pretty()

# View summaries
db.useractivitysummaries.find().pretty()
```

## 📊 Available Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Show Today's Statistics | `Ctrl+Shift+P` → Search | View daily stats |
| Toggle Tracking | `Ctrl+Shift+P` → Search | Enable/disable tracking |

## 🔍 Troubleshooting

### Extension Not Tracking?

**Check 1: Is tracking enabled?**
```
Ctrl+Shift+P → "Typing Tracker: Toggle Tracking"
```

**Check 2: Is username set?**
- Settings → Search "Typing Tracker" → Set username

**Check 3: View extension logs**
- View → Output → Select "Extension Host"

### Can't Connect to Backend?

**Test connection:**
```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Server is healthy"
}
```

**If fails:**
- Check if server is running
- Verify port 3000 is not in use
- Check firewall settings

### MongoDB Connection Failed?

**Test MongoDB:**
```bash
mongosh
```

**If fails:**
- Check if MongoDB is running: `mongod`
- Verify connection string in `.env`
- Check MongoDB logs

## 📈 Monitor Your Progress

### Real-time Monitoring

**Watch Backend Logs:**
```bash
# Server logs show incoming requests
cd server
npm run dev
```

**Query MongoDB:**
```javascript
// Connect to DB
mongosh vscode_tracker

// Get today's summary
db.useractivitysummaries.find({
  date: "2025-10-31"
}).pretty()

// Get recent activities
db.activitylogs.find().sort({ timestamp: -1 }).limit(10).pretty()

// Count total logs
db.activitylogs.countDocuments()
```

## 🎨 Customization

### Change Debounce Interval

Settings → `typingTracker.debounceInterval`: `3000` (3 seconds)

### Enable Content Snippets

Settings → `typingTracker.trackContentSnippets`: `true`

⚠️ **Privacy Note:** This will store code snippets in the database

### Change API Endpoint

Settings → `typingTracker.apiEndpoint`: `https://your-server.com/api`

## 📚 Next Steps

1. ✅ Read [README.md](./README.md) for full documentation
2. ✅ Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
3. ✅ Review [CONTRIBUTING.md](./CONTRIBUTING.md) to contribute
4. ✅ Explore API endpoints in backend
5. ✅ Build a custom dashboard (future)

## 🆘 Need Help?

- **Documentation:** Check README.md and other docs
- **Issues:** Open a GitHub issue
- **Questions:** Read CONTRIBUTING.md
- **Backend API:** See API documentation in README.md

## 🎉 You're All Set!

Start coding and watch your productivity metrics grow!

**Happy tracking! 🚀**

---

**Pro Tips:**
- Check your stats regularly for motivation
- Use the data to identify productive hours
- Compare typed vs pasted ratios to measure original work
- Export data for custom analysis (MongoDB queries)
