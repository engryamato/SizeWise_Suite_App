# Installation Guide

SizeWise Suite can be installed and used in multiple ways, depending on your needs and environment.

## Web Application (Recommended)

The easiest way to use SizeWise Suite is through the web application, which works in any modern browser.

### Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- Minimum 100MB available storage for offline data

### Access the Application

1. **Open your web browser**
2. **Navigate to the application URL** (when deployed)
3. **Allow the application to install** as a Progressive Web App (PWA) when prompted

### Progressive Web App Installation

SizeWise Suite can be installed as a PWA for a native app-like experience:

#### Desktop Installation

1. **Chrome/Edge**: Click the install icon in the address bar or use the "Install SizeWise Suite" option in the menu
2. **Firefox**: Use the "Install" option in the address bar
3. **Safari**: Use "Add to Dock" from the File menu

#### Mobile Installation

1. **Chrome (Android)**: Tap "Add to Home Screen" from the browser menu
2. **Safari (iOS)**: Tap the share button and select "Add to Home Screen"

## Local Development Setup

For developers or users who want to run SizeWise Suite locally:

### Prerequisites

- **Python 3.9+** with pip
- **Node.js 16+** with npm
- **Git** for version control

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/sizewise-suite/sizewise-suite.git
   cd sizewise-suite
   ```

2. **Set up Python environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Start the backend server**
   ```bash
   npm run start:backend
   # Or manually: python run_backend.py
   ```

5. **Start the frontend development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Production Build

To build SizeWise Suite for production deployment:

```bash
# Build the frontend
npm run build

# The built files will be in the dist/ directory
# Serve them with any static file server
```

## System Requirements

### Minimum Requirements

- **RAM**: 2GB available memory
- **Storage**: 500MB free disk space
- **Network**: Internet connection for initial setup (optional for offline use)
- **Browser**: Modern browser with JavaScript and IndexedDB support

### Recommended Requirements

- **RAM**: 4GB+ available memory
- **Storage**: 1GB+ free disk space
- **Network**: Broadband connection for faster initial loading
- **Display**: 1024x768 minimum resolution (responsive design supports all sizes)

## Browser Compatibility

SizeWise Suite is tested and supported on:

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full PWA support |
| Firefox | 88+ | Full PWA support |
| Safari | 14+ | PWA support with limitations |
| Edge | 90+ | Full PWA support |
| Mobile Chrome | 90+ | Full mobile support |
| Mobile Safari | 14+ | Full mobile support |

### Unsupported Browsers

- Internet Explorer (all versions)
- Chrome < 90
- Firefox < 88
- Safari < 14

## Offline Functionality

SizeWise Suite is designed to work offline after the initial installation:

### What Works Offline

- ✅ All calculation modules
- ✅ Project management
- ✅ Data storage and retrieval
- ✅ Standards compliance checking
- ✅ Unit conversions
- ✅ Documentation (if cached)

### What Requires Internet

- ❌ Initial application download
- ❌ Software updates
- ❌ External documentation links
- ❌ Future cloud sync features

## Troubleshooting

### Common Issues

#### Application Won't Load

1. **Check browser compatibility** - Ensure you're using a supported browser version
2. **Clear browser cache** - Force refresh with Ctrl+F5 (Cmd+Shift+R on Mac)
3. **Check JavaScript** - Ensure JavaScript is enabled in your browser
4. **Disable extensions** - Try disabling browser extensions that might interfere

#### Calculations Not Working

1. **Check backend connection** - Ensure the backend server is running (local development)
2. **Verify input data** - Check that all required fields are filled correctly
3. **Check browser console** - Look for error messages in the developer console

#### Data Not Saving

1. **Check storage permissions** - Ensure the browser allows local storage
2. **Clear storage** - Try clearing IndexedDB data and restarting
3. **Check available space** - Ensure sufficient disk space is available

#### PWA Installation Issues

1. **Use supported browser** - PWA installation requires a compatible browser
2. **Check HTTPS** - PWA requires secure connection (HTTPS or localhost)
3. **Clear cache** - Clear browser cache and try again

### Getting Help

If you encounter issues not covered here:

1. **Check the [User Guide](../user-guide/overview.md)** for detailed usage information
2. **Review [API Documentation](../api/overview.md)** for technical details
3. **Submit an issue** on the GitHub repository
4. **Contact support** through the application's help system

## Next Steps

After installation, continue with:

- **[Quick Start Guide](quick-start.md)** - Perform your first calculation
- **[User Guide](../user-guide/overview.md)** - Learn all features
- **[Examples](../examples/basic-calculations.md)** - See practical usage examples
