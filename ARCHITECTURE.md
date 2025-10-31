# VS Code Typing Activity Logger - Architecture

## 🏗️ System Architecture Overview

This document describes the architecture, design patterns, and technical decisions behind the VS Code Typing Activity Logger extension.

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Editor                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │         User Types/Pastes Code                    │  │
│  └───────────────┬───────────────────────────────────┘  │
│                  │                                       │
│                  ▼                                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │         VS Code Extension API                     │  │
│  │  - onDidChangeTextDocument                        │  │
│  │  - onDidSaveTextDocument                          │  │
│  │  - onDidCloseTextDocument                         │  │
│  └───────────────┬───────────────────────────────────┘  │
└──────────────────┼───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Extension Layer (TypeScript)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Config     │  │    Event     │  │     API      │  │
│  │   Manager    │  │   Handler    │  │    Client    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Utility Functions                   │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP REST API
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Backend Server (Express.js)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │              API Routes Layer                    │  │
│  │  - POST /api/activity                            │  │
│  │  - POST /api/activity/batch                      │  │
│  │  - GET /api/summary/:username/:date              │  │
│  │  - GET /api/activity/:username                   │  │
│  └──────────────┬───────────────────────────────────┘  │
│                 │                                       │
│  ┌──────────────▼───────────────────────────────────┐  │
│  │          Validation & Business Logic             │  │
│  │  - express-validator                             │  │
│  │  - Data transformation                           │  │
│  │  - Summary calculations                          │  │
│  └──────────────┬───────────────────────────────────┘  │
│                 │                                       │
│  ┌──────────────▼───────────────────────────────────┐  │
│  │            Mongoose ODM Layer                    │  │
│  │  - ActivityLog Model                             │  │
│  │  - UserActivitySummary Model                     │  │
│  └──────────────┬───────────────────────────────────┘  │
└─────────────────┼───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   MongoDB Database                      │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │   activitylogs       │  │  useractivitysummaries│   │
│  │   Collection         │  │  Collection           │   │
│  └──────────────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 🧩 Component Architecture

### 1. Extension Layer (Client-Side)

#### **extension.ts** - Entry Point
- **Responsibility:** Extension lifecycle management
- **Pattern:** Singleton for global state
- **Key Functions:**
  - `activate()`: Initialize extension
  - `deactivate()`: Cleanup resources

```typescript
activate(context: ExtensionContext) → void
  ├─ Initialize ConfigManager
  ├─ Initialize ApiClient
  ├─ Initialize EventHandler
  ├─ Register event listeners
  ├─ Register commands
  └─ Add to context.subscriptions
```

#### **config.ts** - Configuration Manager
- **Pattern:** Singleton
- **Responsibilities:**
  - Read VS Code workspace configuration
  - Provide typed configuration access
  - Validate configuration
  - Toggle settings

```typescript
class ConfigManager {
  private static instance: ConfigManager
  
  public static getInstance(): ConfigManager
  public getConfig(): TrackerConfig
  public validateConfig(): ValidationResult
  public toggleEnabled(): Promise<boolean>
}
```

#### **event-handler.ts** - Event Processing
- **Pattern:** Observer + Strategy
- **Responsibilities:**
  - Listen to document change events
  - Detect typing vs. pasting
  - Maintain file sessions
  - Trigger debounced saves

```typescript
class EventHandler {
  private sessions: Map<string, FileSession>
  
  public handleTextChange(event): Promise<void>
  private analyzeChange(change): Promise<ChangeEvent>
  private updateSession(session, event): void
  private saveSession(session): Promise<void>
}
```

**Paste Detection Algorithm:**
```typescript
isPaste = (text.length > 50 || lineCount > 2) 
          && rangeLength === 0 
          && clipboardText.includes(text.trim())
```

#### **api-client.ts** - HTTP Communication
- **Pattern:** Singleton + Adapter
- **Responsibilities:**
  - HTTP communication with backend
  - Request/response handling
  - Error management
  - Health checks

```typescript
class ApiClient {
  private client: AxiosInstance
  
  public sendActivityLog(log): Promise<boolean>
  public sendBatchActivityLogs(logs): Promise<boolean>
  public getUserSummary(username, date): Promise<Summary>
  public healthCheck(): Promise<boolean>
}
```

#### **utils.ts** - Utility Functions
- **Pattern:** Pure Functions
- **Responsibilities:**
  - Date/time formatting
  - Text processing
  - Debouncing
  - File filtering

### 2. Backend Layer (Server-Side)

#### **index.ts** - Server Entry Point
- **Pattern:** Facade
- **Responsibilities:**
  - Express app initialization
  - Middleware configuration
  - Route registration
  - Database connection
  - Graceful shutdown

```typescript
class Server {
  private app: Application
  private dbConfig: DatabaseConfig
  
  private initializeMiddlewares(): void
  private initializeRoutes(): void
  private initializeErrorHandling(): void
  public start(): Promise<void>
  public shutdown(): Promise<void>
}
```

#### **database.config.ts** - Database Manager
- **Pattern:** Singleton
- **Responsibilities:**
  - MongoDB connection management
  - Connection state tracking
  - Event handling (disconnect, error)

```typescript
class DatabaseConfig {
  private static instance: DatabaseConfig
  private isConnected: boolean
  
  public connect(): Promise<void>
  public disconnect(): Promise<void>
  public getConnectionStatus(): boolean
}
```

#### **activity.routes.ts** - API Routes
- **Pattern:** Router + Controller
- **Responsibilities:**
  - Route definitions
  - Request validation
  - Response formatting
  - Error handling

**Route Handlers:**
```
POST   /api/activity        → Create single log
POST   /api/activity/batch  → Create multiple logs
GET    /api/summary/:user/:date → Get user summary
GET    /api/activity/:user  → Get user activity logs
GET    /api/health          → Health check
```

#### **Models** - Data Layer

**activity-log.model.ts:**
```typescript
interface IActivityLog {
  username: string
  fileName: string
  filePath: string
  date: string
  time: string
  timestamp: Date
  actionType: 'typing' | 'paste'
  typedLines: number
  pastedLines: number
  totalLines: number
  contentSnippet?: string
  editorVersion: string
}
```

**user-summary.model.ts:**
```typescript
interface IUserActivitySummary {
  username: string
  date: string
  totalTypedLines: number
  totalPastedLines: number
  typingToPastingRatio: number
  totalFilesEdited: number
}
```

## 📊 Data Flow

### Typing Event Flow

```
1. User types in editor
   ↓
2. VS Code fires onDidChangeTextDocument
   ↓
3. EventHandler.handleTextChange()
   ├─ Get/create file session
   ├─ Analyze change (typing vs paste)
   ├─ Update session counters
   └─ Mark as pending
   ↓
4. Debounced save (after 2 seconds)
   ↓
5. Create ActivityLog objects
   ↓
6. ApiClient.sendBatchActivityLogs()
   ↓
7. POST /api/activity/batch
   ↓
8. Validation → Insert logs → Update summaries
   ↓
9. MongoDB storage
```

### Summary Calculation Flow

```
1. Activity log received
   ↓
2. Extract username + date
   ↓
3. MongoDB updateOne with $inc
   {
     $inc: {
       totalTypedLines: typed,
       totalPastedLines: pasted
     }
   }
   ↓
4. Calculate ratio: typed / pasted
   ↓
5. Update summary document
```

## 🔐 Security Architecture

### Authentication & Authorization
- No authentication in v1.0 (local use)
- Username manually configured
- Future: JWT-based authentication

### Input Validation
```typescript
// Express-validator middleware
[
  body('username').isString().trim().notEmpty(),
  body('typedLines').isInt({ min: 0 }),
  // ... more validators
]
```

### Security Headers (Helmet.js)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security

### CORS Configuration
```typescript
cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
})
```

## ⚡ Performance Optimizations

### 1. Debouncing
```typescript
// Wait 2 seconds before saving to reduce API calls
debounce(saveAllPendingSessions, 2000)
```

### 2. Batch Operations
```typescript
// Send multiple logs in one request
POST /api/activity/batch
{
  logs: [log1, log2, log3, ...]
}
```

### 3. MongoDB Indexing
```typescript
// Compound indexes for fast queries
{ username: 1, date: 1 }
{ username: 1, timestamp: -1 }
```

### 4. Connection Pooling
- Mongoose default connection pool
- Reuse HTTP connections (Keep-Alive)

### 5. File Filtering
```typescript
// Skip unnecessary files early
if (!shouldTrackFile(filePath)) return;
```

## 🧪 Testing Strategy

### Unit Tests
- Utils functions
- Configuration manager
- Business logic

### Integration Tests
- API endpoint testing
- Database operations
- End-to-end workflows

### Test Structure
```
src/__tests__/
  ├── utils.test.ts
  ├── config.test.ts
  ├── api-client.test.ts
  └── event-handler.test.ts
```

## 📈 Scalability Considerations

### Current Architecture
- Single MongoDB instance
- Single backend server
- Local extension instances

### Future Scalability

**Horizontal Scaling:**
```
Load Balancer
    ├─ Server Instance 1
    ├─ Server Instance 2
    └─ Server Instance 3
         ↓
    MongoDB Replica Set
```

**Caching Layer:**
```
Extension → Redis Cache → Backend → MongoDB
```

**Microservices:**
```
├─ Activity Ingestion Service
├─ Summary Calculation Service
├─ Analytics Service
└─ API Gateway
```

## 🔄 Design Patterns Used

| Pattern | Component | Purpose |
|---------|-----------|---------|
| Singleton | ConfigManager, ApiClient | Single instance |
| Observer | Event listeners | React to editor changes |
| Strategy | Paste detection | Different detection algorithms |
| Facade | Server class | Simplify complex setup |
| Factory | Model creation | Standardized object creation |
| Repository | Mongoose models | Data access abstraction |
| Middleware | Express | Request processing chain |

## 📝 Code Quality Standards

### TypeScript Configuration
```json
{
  "strict": true,
  "noImplicitAny": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

### ESLint Rules
- @typescript-eslint/recommended
- Prettier integration
- Naming conventions enforced

### Code Metrics Goals
- Test coverage: > 80%
- Cyclomatic complexity: < 10
- Lines per function: < 50
- File length: < 500 lines

## 🔮 Future Architecture Enhancements

1. **Event Sourcing:** Store all events for replay
2. **CQRS:** Separate read/write models
3. **GraphQL:** More flexible API queries
4. **WebSocket:** Real-time updates
5. **Service Worker:** Offline support
6. **Plugin System:** Extensible architecture

---

**Last Updated:** October 31, 2025
**Version:** 1.0.0
