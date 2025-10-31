# Changelog

All notable changes to the "VS Code Typing Activity Logger" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-31

### Added
- Initial release of VS Code Typing Activity Logger
- Real-time typing detection and tracking
- Paste operation detection and counting
- Line-based metrics (typed vs. pasted)
- MongoDB integration for data persistence
- User activity summaries with daily aggregation
- RESTful API backend with Express.js
- TypeScript implementation for type safety
- Configurable settings via VS Code preferences
- Commands for viewing statistics and toggling tracking
- Debounced data saving for performance
- Comprehensive error handling
- Privacy-focused design with optional content tracking
- ESLint and Prettier for code quality
- Complete documentation and quick start guide

### Features
- ✍️ Typing detection with accurate line counting
- 📋 Paste detection and differentiation
- 📊 Daily activity summaries
- 💾 MongoDB persistence layer
- 🔒 Privacy controls for content snippets
- ⚡ Performance optimizations with debouncing
- 🎯 File filtering (exclude node_modules, .git, etc.)
- 📈 Typing-to-pasting ratio calculation

### Technical
- TypeScript 5.3.3
- VS Code API 1.85.0+
- MongoDB with Mongoose ODM
- Express.js REST API
- Comprehensive validation with express-validator
- Security headers with Helmet.js
- CORS support
- Jest testing framework

## [Unreleased]

### Planned Features
- Typing speed tracking (WPM/CPM)
- AI-based code similarity detection
- Web dashboard for visualizations
- CSV/JSON export functionality
- Weekly and monthly reports
- Custom productivity notifications
- Multi-user team analytics
- Integration with Git for commit correlation
