# Contributing to Cat Colony: Mars Terraformation 🐱🚀

Thank you for your interest in contributing to our cat-themed Mars colonization game! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **🐛 Bug Reports**: Help us identify and fix issues
- **✨ Feature Requests**: Suggest new game features
- **🎨 Art & Assets**: Contribute cat-themed graphics and animations
- **💻 Code**: Implement features or fix bugs
- **📚 Documentation**: Improve guides and documentation
- **🌐 Localization**: Translate the game to other languages
- **🎵 Audio**: Create sound effects and music
- **🧪 Testing**: Help test features and report issues

## 🚀 Getting Started

### Prerequisites

- **Git**: Version control system
- **Node.js**: Version 14.0.0 or higher
- **Modern Browser**: Chrome, Firefox, Safari, or Edge
- **Local Web Server**: For development testing

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/mars-terraformer.git
   cd mars-terraformer
   ```

2. **Set up Firebase (Optional)**
   ```bash
   # Copy the template file
   cp firebase.js.template firebase.js
   
   # Edit with your Firebase configuration
   # Get config from: https://console.firebase.google.com/
   ```

3. **Start Development Server**
   ```bash
   # Using npm scripts
   npm start
   
   # Or manually
   python -m http.server 8000
   ```

4. **Open in Browser**
   Navigate to `http://localhost:8000`

## 📋 Development Guidelines

### Code Style

- **JavaScript**: Use ES6+ features (const, let, arrow functions, classes)
- **Comments**: Use JSDoc for function documentation
- **Naming**: Use descriptive variable and function names
- **Indentation**: Use 4 spaces (no tabs)
- **Line Length**: Keep lines under 100 characters

### File Organization

- **Scenes**: Place in `scenes/` directory
- **Utilities**: Place in `utils/` directory
- **Configuration**: Place in `config/` directory
- **Assets**: Place in `assets/` directory

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(station): add building upgrade system
fix(gameplay): resolve double jump bug
docs(readme): update installation instructions
```

## 🎨 Asset Guidelines

### Image Assets

| Asset Type | Size | Format | Purpose |
|------------|------|--------|---------|
| Player Sprites | 256x256px | PNG | Character animations |
| UI Icons | 64x64px | PNG | Interface elements |
| Resource Orbs | 256x256px | PNG | Collectible items |
| Building Units | 256x256px | PNG | Station structures |
| Backgrounds | Variable | PNG | Scene backgrounds |

### Naming Conventions

- **Player**: `cat_colonist_*`
- **Resources**: `resource_*_orb`
- **Icons**: `icon_*`
- **Buildings**: `*_unit` for station buildings
- **UI Elements**: Descriptive names (e.g., `build_menu_frame`)

### Style Guidelines

- **Theme**: Cat-themed, space/Mars aesthetic
- **Color Palette**: Warm oranges, cool blues, space grays
- **Art Style**: Pixel art with modern touches
- **Consistency**: Maintain visual consistency across assets

## 🐛 Bug Reports

### Before Reporting

1. **Check Existing Issues**: Search for similar reports
2. **Test Latest Version**: Ensure you're using the latest code
3. **Reproduce**: Verify the bug is reproducible
4. **Document**: Gather relevant information

### Bug Report Template

```markdown
**Bug Description**
Brief description of the issue.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14.0]
- Game Version: [e.g., 1.0.0]

**Additional Information**
Screenshots, console logs, etc.
```

## ✨ Feature Requests

### Before Requesting

1. **Check Roadmap**: Review planned features
2. **Search Issues**: Look for similar requests
3. **Think Through**: Consider implementation complexity
4. **Provide Details**: Include use cases and examples

### Feature Request Template

```markdown
**Feature Description**
Brief description of the requested feature.

**Use Case**
Why this feature would be useful.

**Proposed Implementation**
How you think it could be implemented.

**Alternatives Considered**
Other approaches you've considered.

**Additional Information**
Mockups, examples, etc.
```

## 🔧 Pull Request Process

### Before Submitting

1. **Test Thoroughly**: Ensure your changes work correctly
2. **Follow Guidelines**: Adhere to code style and conventions
3. **Update Documentation**: Update relevant documentation
4. **Add Tests**: Include tests for new features (if applicable)

### Pull Request Template

```markdown
**Description**
Brief description of changes.

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Asset addition
- [ ] Other (please describe)

**Testing**
- [ ] Tested locally
- [ ] All existing tests pass
- [ ] New tests added (if applicable)

**Screenshots**
Add screenshots if UI changes are included.

**Checklist**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

### Review Process

1. **Automated Checks**: Ensure all checks pass
2. **Code Review**: Address reviewer feedback
3. **Testing**: Verify functionality works as expected
4. **Merge**: Once approved, maintainers will merge

## 🎯 Development Priorities

### High Priority
- Bug fixes and stability improvements
- Performance optimizations
- Security enhancements
- Critical gameplay issues

### Medium Priority
- New game features
- UI/UX improvements
- Asset additions
- Documentation updates

### Low Priority
- Nice-to-have features
- Experimental features
- Minor visual improvements
- Additional language support

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and ideas
- **Pull Requests**: For code contributions

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be respectful and considerate
- Use inclusive language
- Focus on constructive feedback
- Help others learn and grow

## 🙏 Recognition

Contributors will be recognized in:

- **README.md**: Listed as contributors
- **Release Notes**: Mentioned for significant contributions
- **Game Credits**: Featured in the game itself

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Cat Colony: Mars Terraformation! 🐱🚀**

*Together, we're making the best cat-themed Mars colonization game possible!* 