# Next.js Frontend Design & API Documentation for VS Code Typing Tracker

## 1. Project Overview
A Next.js web dashboard to visualize, manage, and analyze coding activity logs collected by the VS Code Typing Tracker extension.

### Key Features
- Dashboard: Charts for typed vs pasted lines, daily/weekly stats
- Activity Log List: Filter, search, sort logs
- User Summaries: Per-user, per-day stats
- CRUD Operations: Add, update, delete logs
- Health & status display

---

## 2. UI Design Description

### Pages & Components
- **Dashboard**: Summary charts (bar, pie, line), quick stats
- **Activity Logs**: Table/list view, filter by user/date/file, actions (edit/delete)
- **Add/Edit Log**: Form for manual log entry or editing
- **User Summary**: Per-user stats, files edited, ratios
- **Settings**: API endpoint config, user preferences

### Example Layout
- Sidebar: Navigation (Dashboard, Logs, Users, Settings)
- Main Area: Dynamic content (charts, tables, forms)
- Top Bar: Quick actions, user info

---

## 3. API Endpoints & JSON Contracts

### 3.1 Add Activity Log
**POST** `/api/activity`
**Request:**
```json
{
  "username": "dhanu",
  "fileName": "index.ts",
  "filePath": "/src/index.ts",
  "date": "2025-10-31",
  "time": "09:00:00",
  "timestamp": "2025-10-31T09:00:00.000Z",
  "actionType": "typing", // or "paste"
  "typedLines": 10,
  "pastedLines": 2,
  "totalLines": 12,
  "contentSnippet": "console.log('Hello World');",
  "editorVersion": "1.85.0"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Activity log created successfully",
  "data": { /* ActivityLog object */ }
}
```

---

### 3.2 Batch Add Activity Logs
**POST** `/api/activity/batch`
**Request:**
```json
{
  "logs": [ /* array of ActivityLog objects as above */ ]
}
```
**Response:**
```json
{
  "success": true,
  "message": "Batch logs created successfully",
  "data": [ /* array of created logs */ ]
}
```

---

### 3.3 Get All Activity Logs
**GET** `/api/activity`
**Response:**
```json
{
  "success": true,
  "data": [ /* array of ActivityLog objects */ ]
}
```

---

### 3.4 Delete Activity Log
**DELETE** `/api/activity/:id`
**Response:**
```json
{
  "success": true,
  "message": "Activity log deleted"
}
```

---

### 3.5 Update Activity Log
**PUT** `/api/activity/:id`
**Request:**
```json
{
  // fields to update, e.g.
  "typedLines": 15
}
```
**Response:**
```json
{
  "success": true,
  "message": "Activity log updated",
  "data": { /* updated ActivityLog object */ }
}
```

---

### 3.6 Get User Summary
**GET** `/api/summary/:username/:date`
**Response:**
```json
{
  "success": true,
  "data": {
    "username": "dhanu",
    "date": "2025-10-31",
    "typedLines": 100,
    "pastedLines": 20,
    "filesEdited": 5
  }
}
```

---

### 3.7 Health Check
**GET** `/`
**Response:**
```json
{
  "success": true,
  "message": "VS Code Typing Tracker API",
  "version": "1.0.0",
  "status": "running"
}
```

---

## 4. Required Actions (CRUD)
- **Add**: POST `/api/activity` or `/api/activity/batch`
- **Read**: GET `/api/activity`, GET `/api/summary/:username/:date`
- **Update**: PUT `/api/activity/:id`
- **Delete**: DELETE `/api/activity/:id`

---

## 5. Notes
- All requests/responses are JSON
- Use standard HTTP status codes
- Validate required fields (username, fileName, etc.)
- Extend endpoints for pagination/filtering as needed

---

## 6. Example Next.js Usage
```js
// Example fetch in Next.js
fetch('http://localhost:3000/api/activity')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

This document can be used as a reference for frontend/backend integration and UI design.