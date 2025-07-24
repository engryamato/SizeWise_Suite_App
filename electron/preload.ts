/**
 * Electron Preload Script - Secure IPC Bridge
 * 
 * MISSION-CRITICAL: Secure communication bridge between main and renderer processes
 * Provides controlled access to Electron APIs with tier enforcement integration
 * 
 * @see docs/implementation/tier-system/tier-boundaries-specification.md
 * @see docs/developer-guide/tier-implementation-checklist.md section 3.1
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Feature flag API for renderer process
 */
const featureAPI = {
  /**
   * Check if a feature is enabled for a user
   */
  isEnabled: (featureName: string, userId?: string) => 
    ipcRenderer.invoke('feature:isEnabled', featureName, userId),

  /**
   * Listen for feature flag updates
   */
  onFeatureUpdate: (callback: (featureName: string, enabled: boolean) => void) => {
    ipcRenderer.on('feature:updated', (_, featureName, enabled) => callback(featureName, enabled));
  },

  /**
   * Remove feature update listener
   */
  removeFeatureUpdateListener: () => {
    ipcRenderer.removeAllListeners('feature:updated');
  }
};

/**
 * Tier enforcement API for renderer process
 */
const tierAPI = {
  /**
   * Validate project creation
   */
  validateProjectCreation: (userId: string) =>
    ipcRenderer.invoke('tier:validateProjectCreation', userId),

  /**
   * Validate project content
   */
  validateProjectContent: (userId: string, projectData: any) =>
    ipcRenderer.invoke('tier:validateProjectContent', userId, projectData),

  /**
   * Validate export access
   */
  validateExportAccess: (userId: string, formatId: string, resolution?: number) =>
    ipcRenderer.invoke('tier:validateExportAccess', userId, formatId, resolution),

  /**
   * Validate calculation access
   */
  validateCalculationAccess: (userId: string, inputs: any, projectData?: any) =>
    ipcRenderer.invoke('tier:validateCalculationAccess', userId, inputs, projectData),

  /**
   * Perform calculation with enforcement
   */
  performCalculation: (userId: string, inputs: any, projectData?: any) =>
    ipcRenderer.invoke('tier:performCalculation', userId, inputs, projectData)
};

/**
 * License API for renderer process
 */
const licenseAPI = {
  /**
   * Get license information
   */
  getInfo: () => ipcRenderer.invoke('license:getInfo'),

  /**
   * Validate license
   */
  validate: () => ipcRenderer.invoke('license:validate'),

  /**
   * Get user tier from license
   */
  getUserTier: () => ipcRenderer.invoke('license:getUserTier'),

  /**
   * Listen for license updates
   */
  onLicenseUpdate: (callback: (licenseInfo: any) => void) => {
    ipcRenderer.on('license:updated', (_, licenseInfo) => callback(licenseInfo));
  },

  /**
   * Remove license update listener
   */
  removeLicenseUpdateListener: () => {
    ipcRenderer.removeAllListeners('license:updated');
  }
};

/**
 * File API for renderer process
 */
const fileAPI = {
  /**
   * Show open file dialog
   */
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('file:showOpenDialog', options),

  /**
   * Show save file dialog
   */
  showSaveDialog: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke('file:showSaveDialog', options),

  /**
   * Read file with tier restrictions
   */
  readFile: (filePath: string, userId: string) =>
    ipcRenderer.invoke('file:readFile', filePath, userId),

  /**
   * Write file with tier restrictions
   */
  writeFile: (filePath: string, data: any, userId: string, options?: any) =>
    ipcRenderer.invoke('file:writeFile', filePath, data, userId, options),

  /**
   * Export project with tier enforcement
   */
  exportProject: (projectData: any, formatId: string, userId: string, options?: any) =>
    ipcRenderer.invoke('file:exportProject', projectData, formatId, userId, options)
};

/**
 * Application API for renderer process
 */
const appAPI = {
  /**
   * Get application version
   */
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  /**
   * Show message box
   */
  showMessageBox: (options: Electron.MessageBoxOptions) =>
    ipcRenderer.invoke('app:showMessageBox', options),

  /**
   * Get platform information
   */
  getPlatform: () => process.platform,

  /**
   * Listen for menu events
   */
  onMenuAction: (callback: (action: string, data?: any) => void) => {
    ipcRenderer.on('menu:newProject', () => callback('newProject'));
    ipcRenderer.on('menu:openProject', () => callback('openProject'));
    ipcRenderer.on('menu:saveProject', () => callback('saveProject'));
    ipcRenderer.on('menu:exportProject', () => callback('exportProject'));
  },

  /**
   * Remove menu action listeners
   */
  removeMenuActionListeners: () => {
    ipcRenderer.removeAllListeners('menu:newProject');
    ipcRenderer.removeAllListeners('menu:openProject');
    ipcRenderer.removeAllListeners('menu:saveProject');
    ipcRenderer.removeAllListeners('menu:exportProject');
  },

  /**
   * Quit application
   */
  quit: () => ipcRenderer.invoke('app:quit')
};

/**
 * Security API for renderer process
 */
const securityAPI = {
  /**
   * Validate user session
   */
  validateSession: (sessionToken: string) =>
    ipcRenderer.invoke('security:validateSession', sessionToken),

  /**
   * Encrypt sensitive data
   */
  encrypt: (data: string) =>
    ipcRenderer.invoke('security:encrypt', data),

  /**
   * Decrypt sensitive data
   */
  decrypt: (encryptedData: string) =>
    ipcRenderer.invoke('security:decrypt', encryptedData),

  /**
   * Generate secure hash
   */
  hash: (data: string) =>
    ipcRenderer.invoke('security:hash', data)
};

/**
 * Development API (only available in development mode)
 */
const devAPI = process.env.NODE_ENV === 'development' ? {
  /**
   * Open developer tools
   */
  openDevTools: () => ipcRenderer.invoke('dev:openDevTools'),

  /**
   * Reload application
   */
  reload: () => ipcRenderer.invoke('dev:reload'),

  /**
   * Get debug information
   */
  getDebugInfo: () => ipcRenderer.invoke('dev:getDebugInfo')
} : undefined;

/**
 * Combined Electron API exposed to renderer process
 */
const electronAPI = {
  feature: featureAPI,
  tier: tierAPI,
  license: licenseAPI,
  file: fileAPI,
  app: appAPI,
  security: securityAPI,
  ...(devAPI && { dev: devAPI })
};

/**
 * Type definitions for the exposed API
 */
export interface ElectronAPI {
  feature: typeof featureAPI;
  tier: typeof tierAPI;
  license: typeof licenseAPI;
  file: typeof fileAPI;
  app: typeof appAPI;
  security: typeof securityAPI;
  dev?: typeof devAPI;
}

// Expose API to renderer process through context bridge
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type augmentation for global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Log successful preload
console.log('✅ Preload script loaded - Electron API exposed');

export default electronAPI;
