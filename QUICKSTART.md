# VS Code Typing Activity Logger - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
# Install extension dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Step 2: Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB (if installed locally)
mongod --dbpath /path/to/data
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `server/.env`

### Step 3: Configure Environment

```bash
# Copy environment template
cd server
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your favorite editor
```

**server/.env:**
```env
MONGODB_URI=mongodb://localhost:27017/vscode_tracker
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

### Step 4: Start Backend Server

```bash
cd server
npm run dev
```

You should see:
```
╔══════════════════════════════════════════════╗
║  🚀 VS Code Typing Tracker Server Started   ║
╠══════════════════════════════════════════════╣
║  Port:        3000                           ║
║  Environment: development                    ║
║  Database:    MongoDB Connected ✅           ║
╚══════════════════════════════════════════════╝
```

### Step 5: Configure Extension

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "Typing Tracker"
3. Verify API endpoint (default is fine):
   - `typingTracker.apiEndpoint`: "http://localhost:3000/api"


### Step 6: Run Extension

1. Press `F5` to launch Extension Development Host
2. Open any file in the new VS Code window
3. Start typing!

### Step 7: Verify It's Working

**Check Today's Stats:**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
2. Type "Typing Tracker: Show Today's Statistics"
3. View your stats!

**Check MongoDB:**
```bash
# Connect to MongoDB
mongosh vscode_tracker

# View activity logs
db.activitylogs.find().pretty()

# View summaries
db.useractivitysummaries.find().pretty()
```

**Check Backend Logs:**
Look for requests in your server terminal:
```
2025-10-31T14:30:00.000Z - POST /api/activity/batch
```

## 📊 Test the Extension

1. **Test Typing:**
   - Open a new file
   - Type some code manually
   - Save the file

2. **Test Pasting:**
   - Copy a block of code
   - Paste it into a file
   - Save the file

3. **View Stats:**
   - Run command: "Typing Tracker: Show Today's Statistics"
   - You should see typed vs pasted lines!

## 🐛 Troubleshooting

### Extension not tracking?

1. Check if tracking is enabled:
   ```
   Ctrl+Shift+P → "Typing Tracker: Toggle Tracking"
   ```

2. Check username is set in settings

3. Check Output panel:
   ```
   View → Output → Select "Typing Tracker"
   ```

### Can't connect to server?

1. Verify server is running:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. Check firewall settings

3. Verify `apiEndpoint` in settings

### MongoDB connection failed?

1. Check MongoDB is running:
   ```bash
   mongosh
   ```

2. Verify connection string in `server/.env`

3. Check MongoDB logs

## 🎯 Next Steps

- [ ] Customize debounce interval
- [ ] Enable content snippets (optional)
- [ ] Set up MongoDB Atlas for cloud storage
- [ ] Create a dashboard to visualize data
- [ ] Export your stats to CSV

## 📚 Additional Resources

- [Full README](./README.md)
- [API Documentation](./README.md#api-documentation)
- [Configuration Guide](./README.md#configuration)
- [Development Guide](./README.md#development)

## 🆘 Need Help?

- Open an issue on GitHub
- Check the FAQ section
- Contact support

---

**Happy Tracking! 🚀**
