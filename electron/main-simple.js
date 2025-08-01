/**
 * Simple Electron Main Process for SizeWise Suite Testing
 * 
 * This is a simplified version for testing the desktop application
 * without complex TypeScript dependencies.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3003'
    : `file://${path.join(__dirname, '../frontend/out/index.html')}`;
  
  console.log('🚀 SizeWise Suite starting...');
  console.log('Loading URL:', startUrl);
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('✅ SizeWise Suite ready');
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle navigation
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3003' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

console.log('Electron main process initialized');
