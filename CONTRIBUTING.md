# Contributing to VS Code Typing Activity Logger

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

### How to Submit a Bug Report

1. **Use a clear and descriptive title**
2. **Describe the exact steps to reproduce the problem**
3. **Provide specific examples**
4. **Describe the behavior you observed and expected**
5. **Include screenshots if applicable**
6. **Specify your environment:**
   - OS and version
   - VS Code version
   - Extension version
   - Node.js version
   - MongoDB version

## 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

### How to Submit an Enhancement

1. **Use a clear and descriptive title**
2. **Provide a detailed description of the suggested enhancement**
3. **Explain why this enhancement would be useful**
4. **List examples of how it would be used**

## 🔧 Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/vscode-typing-tracker.git
   cd vscode-typing-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Set up MongoDB**
   ```bash
   # Local MongoDB or MongoDB Atlas
   cp server/.env.example server/.env
   # Edit server/.env with your connection string
   ```

4. **Start development**
   ```bash
   # Terminal 1: Watch extension
   npm run watch

   # Terminal 2: Run server
   cd server && npm run dev

   # Terminal 3: Press F5 in VS Code to launch Extension Development Host
   ```

## 📝 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Run tests and linting**
   ```bash
   npm run lint
   npm test
   npm run format
   ```

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

   **Commit Message Format:**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference related issues
   - Include screenshots for UI changes

## 🎨 Code Style Guidelines

### TypeScript
- Use TypeScript strict mode
- Provide explicit type annotations
- Use interfaces over types when possible
- Document public APIs with JSDoc comments

### Naming Conventions
- **Variables/Functions:** `camelCase`
- **Classes/Interfaces:** `PascalCase`
- **Constants:** `UPPER_CASE`
- **Private members:** Prefix with `private`

### Code Organization
- One class/interface per file
- Keep functions small and focused
- Use meaningful variable names
- Add comments for complex logic

### Example
```typescript
/**
 * Calculate the typing-to-pasting ratio
 * @param typedLines - Number of lines typed
 * @param pastedLines - Number of lines pasted
 * @returns The ratio rounded to 2 decimal places
 */
export function calculateRatio(typedLines: number, pastedLines: number): number {
  if (pastedLines === 0) {
    return typedLines > 0 ? Infinity : 0;
  }
  return Number((typedLines / pastedLines).toFixed(2));
}
```

## 🧪 Testing Guidelines

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Example Test
```typescript
describe('calculateRatio', () => {
  it('should calculate ratio correctly', () => {
    // Arrange
    const typedLines = 100;
    const pastedLines = 50;

    // Act
    const result = calculateRatio(typedLines, pastedLines);

    // Assert
    expect(result).toBe(2);
  });
});
```

## 📚 Documentation

- Update README.md for user-facing changes
- Update CHANGELOG.md following Keep a Changelog format
- Add JSDoc comments for public APIs
- Include code examples in documentation

## 🔍 Code Review Process

All submissions require review before merging.

**Reviewers check for:**
- Code quality and style
- Test coverage
- Documentation completeness
- Performance implications
- Security considerations

## 📋 Checklist Before Submitting PR

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No linting errors
- [ ] CHANGELOG.md updated

## 🚀 Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Build extension package
6. Create GitHub release
7. Publish to VS Code Marketplace

## 💬 Questions?

Feel free to open an issue for questions or reach out to maintainers.

## 🙏 Recognition

Contributors will be acknowledged in the README.md file.

Thank you for contributing! 🎉
