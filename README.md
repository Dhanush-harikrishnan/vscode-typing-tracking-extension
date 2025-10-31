# 🧩 VS Code Typing Activity Logger

A comprehensive VS Code extension that tracks typing activity, distinguishes between typed and copied lines, and provides insights into coding productivity.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Functionality
- ✍️ **Typing Detection**: Tracks manually typed code in real-time
- 📋 **Paste Detection**: Distinguishes copied/pasted code from typed code
- 📊 **Line Counting**: Accurate counting of typed vs. pasted lines
- 💾 **MongoDB Storage**: Persistent storage of all activity logs
- 📈 **Daily Summaries**: Aggregated statistics per user and date
- 🔒 **Privacy-Focused**: Only metadata tracked, content optional
- ⚡ **Performance Optimized**: Debounced saves and efficient event handling

### Analytics & Insights
- Total lines typed vs. pasted
- Typing-to-pasting ratio
- Files edited count
- Daily/weekly productivity charts
- Session duration tracking

## 🏗️ Architecture

```
┌─────────────────────┐
│   VS Code Editor    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Extension (Client) │
│  - Event Handler    │
│  - API Client       │
│  - Config Manager   │
└──────────┬──────────┘
           │ HTTP/REST
           ▼
┌─────────────────────┐
│  Backend Server     │
│  - Express API      │
│  - Validation       │
│  - Business Logic   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     MongoDB         │
│  - activity_logs    │
│  - user_summaries   │
└─────────────────────┘
```

## 📦 Installation
                                          
### Prerequisites
- VS Code 1.85.0 or higher
- Node.js 18.x or higher
- MongoDB 6.0 or higher

### Extension Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vscode-typing-tracker.git
cd vscode-typing-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Compile TypeScript**
```bash
npm run compile
```

4. **Install the extension**
- Press `F5` in VS Code to launch Extension Development Host
- Or package the extension:
```bash
npm install -g vsce
vsce package
code --install-extension vscode-typing-tracker-1.0.0.vsix
```

### Backend Server Setup

1. **Navigate to server directory**
```bash
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

4. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## ⚙️ Configuration

### Extension Settings

Open VS Code Settings (`Ctrl+,` or `Cmd+,`) and search for "Typing Tracker":

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `typingTracker.username` | string | `""` | Your username for activity tracking |
| `typingTracker.apiEndpoint` | string | `http://localhost:3000/api` | Backend API endpoint URL |
| `typingTracker.enabled` | boolean | `true` | Enable/disable tracking |
| `typingTracker.trackContentSnippets` | boolean | `false` | Include code snippets in logs (privacy) |
| `typingTracker.debounceInterval` | number | `2000` | Milliseconds to wait before sending data |

### Example settings.json

```json
{
  "typingTracker.username": "johndoe",
  "typingTracker.apiEndpoint": "http://localhost:3000/api",
  "typingTracker.enabled": true,
  "typingTracker.trackContentSnippets": false,
  "typingTracker.debounceInterval": 2000
}
```

### MongoDB Configuration

Edit `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/vscode_tracker
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

## 🚀 Usage

### Commands

Access commands via Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- **Typing Tracker: Show Today's Statistics** - View your daily stats
- **Typing Tracker: Toggle Tracking** - Enable/disable tracking

### Automatic Tracking

Once configured, the extension automatically tracks:
- Every keystroke in supported files
- Paste operations (Ctrl+V, right-click paste)
- File saves and closures
- Session duration

### Excluded Files

The following are excluded from tracking:
- `node_modules/`
- `.git/`
- `.vscode/`
- Build outputs (`dist/`, `build/`, `out/`)
- Log files (`.log`)
- Lock files (`.lock`)

## 📡 API Documentation

### Endpoints

#### POST `/api/activity`
Create a single activity log entry.

**Request Body:**
```json
{
  "username": "johndoe",
  "fileName": "index.ts",
  "filePath": "/path/to/index.ts",
  "date": "2025-10-31",
  "time": "14:30:00",
  "timestamp": "2025-10-31T14:30:00.000Z",
  "actionType": "typing",
  "typedLines": 15,
  "pastedLines": 0,
  "totalLines": 15,
  "editorVersion": "1.85.0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity log created successfully",
  "data": { ... }
}
```

#### POST `/api/activity/batch`
Create multiple activity log entries.

**Request Body:**
```json
{
  "logs": [
    { ... },
    { ... }
  ]
}
```

#### GET `/api/summary/:username/:date`
Get user summary for a specific date.

**Response:**
```json
{
  "success": true,
  "data": {
    "username": "johndoe",
    "date": "2025-10-31",
    "totalTypedLines": 140,
    "totalPastedLines": 40,
    "typingToPastingRatio": 3.5,
    "totalFilesEdited": 6
  }
}
```

#### GET `/api/activity/:username?date=YYYY-MM-DD&limit=100&skip=0`
Get activity logs for a user.

#### GET `/api/health`
Health check endpoint.

## 🛠️ Development

### Project Structure

```
vscode-typing-tracker/
├── src/                      # Extension source
│   ├── extension.ts         # Main extension file
│   ├── event-handler.ts     # Event handling logic
│   ├── api-client.ts        # API communication
│   ├── config.ts            # Configuration management
│   ├── utils.ts             # Utility functions
│   └── types.ts             # TypeScript interfaces
├── server/                   # Backend server
│   ├── src/
│   │   ├── index.ts         # Server entry point
│   │   ├── config/          # Configuration
│   │   ├── models/          # MongoDB models
│   │   └── routes/          # API routes
│   └── package.json
├── package.json             # Extension manifest
├── tsconfig.json            # TypeScript config
└── README.md
```

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code quality rules
- **Prettier**: Consistent code formatting
- **Naming Conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and interfaces
  - `UPPER_CASE` for constants

### Scripts

**Extension:**
```bash
npm run compile       # Compile TypeScript
npm run watch         # Watch mode compilation
npm run lint          # Run ESLint
npm run format        # Format with Prettier
npm test              # Run tests
```

**Server:**
```bash
npm run dev          # Development mode
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Manual Testing

1. Launch Extension Development Host (`F5`)
2. Open a test project
3. Start typing and pasting code
4. Check backend logs for received data
5. Query MongoDB to verify stored data

## 📊 Database Schema

### Collection: `activity_logs`

```typescript
{
  _id: ObjectId
  username: string
  fileName: string
  filePath: string
  date: string          // "YYYY-MM-DD"
  time: string          // "HH:MM:SS"
  timestamp: Date
  actionType: "typing" | "paste"
  typedLines: number
  pastedLines: number
  totalLines: number
  contentSnippet?: string
  editorVersion: string
  createdAt: Date
  updatedAt: Date
}
```

### Collection: `user_activity_summaries`

```typescript
{
  _id: ObjectId
  username: string
  date: string
  totalTypedLines: number
  totalPastedLines: number
  typingToPastingRatio: number
  totalFilesEdited: number
  createdAt: Date
  updatedAt: Date
}
```

## 🔐 Security & Privacy

- ✅ Environment variables for sensitive data
- ✅ Input validation on all API endpoints
- ✅ Optional content snippet tracking
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Rate limiting (recommended for production)

## 🚀 Future Enhancements

- [ ] ⏱️ Typing speed tracking (WPM/CPM)
- [ ] 🧠 AI-based code similarity detection
- [ ] 📈 Web dashboard for analytics
- [ ] 📤 CSV/JSON export functionality
- [ ] 🔔 Productivity notifications
- [ ] 📊 Weekly/monthly reports
- [ ] 🎨 Custom themes for stats display

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- VS Code Extension API
- MongoDB & Mongoose
- Express.js community
- TypeScript team

---

**Made with ❤️ for developers who care about productivity**
# vscode-typing-tracking-extension
