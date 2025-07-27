/**
 * Electron Main Process - Desktop Application Entry Point
 * 
 * MISSION-CRITICAL: Main Electron process with Next.js integration and tier enforcement
 * Provides secure desktop foundation with feature flag initialization and license validation
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.1
 */

import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import { join } from 'path';
import { readFileSync } from 'fs';
import isDev from 'electron-is-dev';
import {
  initSentry,
  captureDesktopPerformance,
  captureWindowEvent,
  captureElectronError
} from './sentry.config';
import { DatabaseManager } from '../backend/database/DatabaseManager';
import { FeatureManager } from '../backend/features/FeatureManager';
import { TierEnforcer } from '../backend/services/enforcement/TierEnforcer';
import { LicenseManager } from './license/LicenseManager';
import { ElectronSecurity } from './security/ElectronSecurity';

/**
 * Application configuration
 */
interface AppConfig {
  windowWidth: number;
  windowHeight: number;
  minWidth: number;
  minHeight: number;
  devServerPort: number;
  productionPath: string;
}

/**
 * Application state
 */
interface AppState {
  mainWindow: BrowserWindow | null;
  dbManager: DatabaseManager | null;
  featureManager: FeatureManager | null;
  tierEnforcer: TierEnforcer | null;
  licenseManager: LicenseManager | null;
  isReady: boolean;
  startupTime: number;
}

/**
 * ElectronApp - Main application class for desktop integration
 * CRITICAL: Provides secure desktop foundation with tier enforcement
 */
class ElectronApp {
  private config: AppConfig;
  private state: AppState;
  private security: ElectronSecurity;

  constructor() {
    this.config = {
      windowWidth: 1400,
      windowHeight: 900,
      minWidth: 1200,
      minHeight: 800,
      devServerPort: 3000,
      productionPath: '../frontend/out/index.html'
    };

    this.state = {
      mainWindow: null,
      dbManager: null,
      featureManager: null,
      tierEnforcer: null,
      licenseManager: null,
      isReady: false,
      startupTime: Date.now()
    };

    this.security = new ElectronSecurity();
    this.initializeApp();
  }

  /**
   * Initialize Electron application
   */
  private initializeApp(): void {
    // Initialize Sentry monitoring (temporarily disabled for testing)
    // initSentry();

    // Handle app ready event
    app.whenReady().then(async () => {
      try {
        await this.onAppReady();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // captureElectronError(error as Error, {
        //   component: 'main',
        //   operation: 'app_initialization'
        // });
        this.handleStartupError(error);
      }
    });

    // Handle window closed events
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Handle app activation (macOS)
    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.createMainWindow();
      }
    });

    // Handle before quit
    app.on('before-quit', async () => {
      await this.cleanup();
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (_, contents) => {
      this.security.configureWebContents(contents);
    });
  }

  /**
   * Handle app ready event
   */
  private async onAppReady(): Promise<void> {
    console.log('🚀 SizeWise Suite starting...');

    // Initialize security
    this.security.configureApp();

    // Initialize database
    await this.initializeDatabase();

    // Initialize license system
    await this.initializeLicense();

    // Initialize feature management
    await this.initializeFeatureManagement();

    // Create main window
    await this.createMainWindow();

    // Setup IPC handlers
    this.setupIpcHandlers();

    // Setup application menu
    this.setupApplicationMenu();

    // Mark as ready
    this.state.isReady = true;
    const startupTime = Date.now() - this.state.startupTime;
    console.log(`✅ SizeWise Suite ready in ${startupTime}ms`);

    // Validate startup performance
    if (startupTime > 3000) {
      console.warn(`⚠️ Startup time ${startupTime}ms exceeds 3s target`);
    }
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      const dbPath = isDev 
        ? join(__dirname, '../data/sizewise-dev.db')
        : join(app.getPath('userData'), 'sizewise.db');

      this.state.dbManager = new DatabaseManager({ 
        filePath: dbPath,
        encryption: true // Enable encryption for desktop
      });

      await this.state.dbManager.initialize();
      console.log('✅ Database initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize license management
   */
  private async initializeLicense(): Promise<void> {
    try {
      this.state.licenseManager = new LicenseManager();
      await this.state.licenseManager.initialize();
      
      // Validate license
      const licenseValid = await this.state.licenseManager.validateLicense();
      if (!licenseValid) {
        console.warn('⚠️ License validation failed - running in trial mode');
      } else {
        console.log('✅ License validated');
      }
    } catch (error) {
      console.error('❌ License initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize feature management system
   */
  private async initializeFeatureManagement(): Promise<void> {
    try {
      if (!this.state.dbManager || !this.state.licenseManager) {
        throw new Error('Database and license must be initialized first');
      }

      // Initialize feature manager
      this.state.featureManager = new FeatureManager(this.state.dbManager);

      // Initialize tier enforcer
      this.state.tierEnforcer = new TierEnforcer(
        this.state.featureManager,
        this.state.dbManager
      );

      // Get user tier from license
      const userTier = await this.state.licenseManager.getUserTier();
      console.log(`✅ Feature management initialized for ${userTier} tier`);
    } catch (error) {
      console.error('❌ Feature management initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create main application window
   */
  private async createMainWindow(): Promise<void> {
    try {
      // Create browser window
      this.state.mainWindow = new BrowserWindow({
        width: this.config.windowWidth,
        height: this.config.windowHeight,
        minWidth: this.config.minWidth,
        minHeight: this.config.minHeight,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          preload: join(__dirname, 'preload.js'),
          webSecurity: true,
          allowRunningInsecureContent: false,
          experimentalFeatures: false
        },
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        show: false, // Don't show until ready
        icon: this.getAppIcon()
      });

      // Configure security
      this.security.configureWindow(this.state.mainWindow);

      // Load application
      const url = isDev
        ? `http://localhost:${this.config.devServerPort}`
        : `file://${join(__dirname, this.config.productionPath)}`;

      await this.state.mainWindow.loadURL(url);

      // Show window when ready
      this.state.mainWindow.once('ready-to-show', () => {
        this.state.mainWindow?.show();
        
        if (isDev) {
          this.state.mainWindow?.webContents.openDevTools();
        }
      });

      // Handle window closed
      this.state.mainWindow.on('closed', () => {
        this.state.mainWindow = null;
      });

      console.log('✅ Main window created');
    } catch (error) {
      console.error('❌ Main window creation failed:', error);
      throw error;
    }
  }

  /**
   * Setup IPC handlers for frontend communication
   */
  private setupIpcHandlers(): void {
    // Feature flag operations
    ipcMain.handle('feature:isEnabled', async (_, featureName: string, userId?: string) => {
      try {
        if (!this.state.featureManager) {
          throw new Error('Feature manager not initialized');
        }
        return await this.state.featureManager.isEnabled(featureName, userId);
      } catch (error) {
        console.error('Feature check failed:', error);
        return { enabled: false, error: error.message };
      }
    });

    // Tier enforcement operations
    ipcMain.handle('tier:validateProjectCreation', async (_, userId: string) => {
      try {
        if (!this.state.tierEnforcer) {
          throw new Error('Tier enforcer not initialized');
        }
        return await this.state.tierEnforcer.validateProjectCreation(userId);
      } catch (error) {
        console.error('Project validation failed:', error);
        return { allowed: false, error: error.message };
      }
    });

    // License operations
    ipcMain.handle('license:getInfo', async () => {
      try {
        if (!this.state.licenseManager) {
          throw new Error('License manager not initialized');
        }
        return await this.state.licenseManager.getLicenseInfo();
      } catch (error) {
        console.error('License info failed:', error);
        return { error: error.message };
      }
    });

    // Application operations
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    ipcMain.handle('app:showMessageBox', async (_, options) => {
      if (!this.state.mainWindow) {
        throw new Error('Main window not available');
      }
      return await dialog.showMessageBox(this.state.mainWindow, options);
    });

    // File operations (basic)
    ipcMain.handle('file:showOpenDialog', async (_, options) => {
      if (!this.state.mainWindow) {
        throw new Error('Main window not available');
      }
      return await dialog.showOpenDialog(this.state.mainWindow, options);
    });

    ipcMain.handle('file:showSaveDialog', async (_, options) => {
      if (!this.state.mainWindow) {
        throw new Error('Main window not available');
      }
      return await dialog.showSaveDialog(this.state.mainWindow, options);
    });

    console.log('✅ IPC handlers setup');
  }

  /**
   * Setup application menu
   */
  private setupApplicationMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.state.mainWindow?.webContents.send('menu:newProject');
            }
          },
          {
            label: 'Open Project',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.state.mainWindow?.webContents.send('menu:openProject');
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About SizeWise Suite',
            click: () => {
              this.showAboutDialog();
            }
          }
        ]
      }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    console.log('✅ Application menu setup');
  }

  /**
   * Show about dialog
   */
  private showAboutDialog(): void {
    if (!this.state.mainWindow) return;

    dialog.showMessageBox(this.state.mainWindow, {
      type: 'info',
      title: 'About SizeWise Suite',
      message: 'SizeWise Suite',
      detail: `Version: ${app.getVersion()}\nA professional HVAC duct sizing application.`,
      buttons: ['OK']
    });
  }

  /**
   * Get application icon path
   */
  private getAppIcon(): string | undefined {
    if (process.platform === 'win32') {
      return join(__dirname, '../assets/icon.ico');
    } else if (process.platform === 'darwin') {
      return join(__dirname, '../assets/icon.icns');
    } else {
      return join(__dirname, '../assets/icon.png');
    }
  }

  /**
   * Handle startup errors
   */
  private handleStartupError(error: any): void {
    console.error('💥 Startup failed:', error);
    
    dialog.showErrorBox(
      'SizeWise Suite - Startup Error',
      `Failed to start application:\n\n${error.message}\n\nPlease contact support if this problem persists.`
    );
    
    app.quit();
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up...');

      if (this.state.dbManager) {
        await this.state.dbManager.close();
      }

      if (this.state.licenseManager) {
        await this.state.licenseManager.cleanup();
      }

      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  /**
   * Get application state (for testing)
   */
  public getState(): AppState {
    return { ...this.state };
  }

  /**
   * Get main window (for testing)
   */
  public getMainWindow(): BrowserWindow | null {
    return this.state.mainWindow;
  }
}

// Initialize application
const electronApp = new ElectronApp();

// Export for testing
export { ElectronApp };
export default electronApp;
