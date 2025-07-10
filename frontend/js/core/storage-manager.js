/**
 * Storage Manager
 * 
 * Handles offline data storage using IndexedDB for the SizeWise Suite.
 */

export class StorageManager {
    constructor() {
        this.dbName = 'SizeWiseDB';
        this.dbVersion = 1;
        this.db = null;
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Projects store
                if (!db.objectStoreNames.contains('projects')) {
                    const projectStore = db.createObjectStore('projects', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    projectStore.createIndex('name', 'name', { unique: false });
                    projectStore.createIndex('created', 'created', { unique: false });
                    projectStore.createIndex('modified', 'modified', { unique: false });
                }
                
                // Calculations store
                if (!db.objectStoreNames.contains('calculations')) {
                    const calcStore = db.createObjectStore('calculations', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    calcStore.createIndex('projectId', 'projectId', { unique: false });
                    calcStore.createIndex('moduleId', 'moduleId', { unique: false });
                    calcStore.createIndex('created', 'created', { unique: false });
                }
                
                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                // Cache store for API responses
                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('expires', 'expires', { unique: false });
                }
                
                console.log('IndexedDB schema created/updated');
            };
        });
    }
    
    async saveProject(project) {
        const transaction = this.db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        
        const projectData = {
            ...project,
            modified: new Date().toISOString()
        };
        
        if (!projectData.created) {
            projectData.created = projectData.modified;
        }
        
        return new Promise((resolve, reject) => {
            const request = store.put(projectData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getProject(id) {
        const transaction = this.db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getAllProjects() {
        const transaction = this.db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async deleteProject(id) {
        const transaction = this.db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveCalculation(calculation) {
        const transaction = this.db.transaction(['calculations'], 'readwrite');
        const store = transaction.objectStore('calculations');
        
        const calcData = {
            ...calculation,
            created: calculation.created || new Date().toISOString()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.put(calcData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getCalculationsByProject(projectId) {
        const transaction = this.db.transaction(['calculations'], 'readonly');
        const store = transaction.objectStore('calculations');
        const index = store.index('projectId');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(projectId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getCalculationsByModule(moduleId) {
        const transaction = this.db.transaction(['calculations'], 'readonly');
        const store = transaction.objectStore('calculations');
        const index = store.index('moduleId');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(moduleId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        
        return new Promise((resolve, reject) => {
            const request = store.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async getSetting(key, defaultValue = null) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    async cacheData(key, data, ttlMinutes = 60) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + ttlMinutes);
        
        const cacheEntry = {
            key,
            data,
            expires: expires.toISOString(),
            created: new Date().toISOString()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.put(cacheEntry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async getCachedData(key) {
        const transaction = this.db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(null);
                    return;
                }
                
                const now = new Date();
                const expires = new Date(result.expires);
                
                if (now > expires) {
                    // Cache expired, delete it
                    this.deleteCachedData(key);
                    resolve(null);
                } else {
                    resolve(result.data);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    async deleteCachedData(key) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async clearExpiredCache() {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const index = store.index('expires');
        
        const now = new Date().toISOString();
        const range = IDBKeyRange.upperBound(now);
        
        return new Promise((resolve, reject) => {
            const request = index.openCursor(range);
            let deletedCount = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    deletedCount++;
                    cursor.continue();
                } else {
                    console.log(`Cleared ${deletedCount} expired cache entries`);
                    resolve(deletedCount);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
}
