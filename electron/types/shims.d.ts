/**
 * Type shims for native modules used in Electron
 *
 * These ambient declarations allow TypeScript compilation without installing
 * the actual packages. The runtime behavior depends on the packages being
 * available at execution time.
 */

declare module 'better-sqlite3' {
  namespace Database {
    interface Statement {
      run(...params: any[]): { changes: number; lastInsertRowid: number };
      get(...params: any[]): any;
      all(...params: any[]): any[];
    }

    interface DatabaseOptions {
      verbose?: (message?: any, ...additionalArgs: any[]) => void;
      timeout?: number;
    }

    interface Database {
      prepare(sql: string): Statement;
      exec(sql: string): void;
      pragma(pragma: string, value?: any): any;
      backup(filename: string): Promise<void>;
      close(): void;
    }

    interface DatabaseConstructor {
      new (filename: string, options?: DatabaseOptions): Database;
      (filename: string, options?: DatabaseOptions): Database;
    }
  }

  const Database: Database.DatabaseConstructor;
  export = Database;
}

declare module 'keytar' {
  export function getPassword(service: string, account: string): Promise<string | null>;
  export function setPassword(service: string, account: string, password: string): Promise<void>;
  export function deletePassword(service: string, account: string): Promise<boolean>;
  export function findCredentials(service: string): Promise<Array<{ account: string; password: string }>>;
  export function findPassword(service: string): Promise<string | null>;
}

declare module '@sentry/electron' {
  export interface Event {
    environment?: string;
    [key: string]: any;
  }

  export interface EventHint {
    originalException?: any;
    [key: string]: any;
  }

  export interface InitOptions {
    dsn?: string;
    environment?: string;
    tracesSampleRate?: number;
    beforeSend?: (event: Event, hint: EventHint) => Event | null;
    release?: string;
    attachStacktrace?: boolean;
    maxBreadcrumbs?: number;
    initialScope?: any;
  }

  export interface Scope {
    setTag(key: string, value: string): void;
    setLevel(level: string): void;
    setContext(key: string, context: any): void;
  }

  export function init(options: InitOptions): void;
  export function captureException(exception: any): void;
  export function withScope(callback: (scope: Scope) => void): void;
  export function addBreadcrumb(breadcrumb: any): void;
  export function setTag(key: string, value: string): void;
  export function setContext(key: string, context: any): void;
  export function setMeasurement(name: string, value: number, unit?: string): void;
  export function startSpan(options: any, callback: (span: any) => void): void;
}


/**
 * Additional shims for Electron environment and native modules
 */

declare module 'electron-is-dev' {
  const isDev: boolean;
  export default isDev;
}

declare module 'electron' {
  // Minimal named exports used in our codebase
  export const app: any;
  export class BrowserWindow {
    static getAllWindows(): any[];
    loadURL(url: string): Promise<void>;
    once(event: string, listener: (...args: any[]) => void): void;
    show(): void;
    on(event: string, listener: (...args: any[]) => void): void;
    webContents: any;
    constructor(options?: any);
  }
  export const ipcMain: any;
  export const dialog: any;
  export const shell: any;
  export const Menu: any;
  export const session: any;
  export const ipcRenderer: any;
  export const contextBridge: {
    exposeInMainWorld: (key: string, api: any) => void;
  };

  // Types referenced in code
  export type WebContents = any;
}

// Global Electron namespace type aliases used in code (e.g., Electron.OpenDialogOptions)
declare namespace Electron {
  type MenuItemConstructorOptions = any;
  type OpenDialogOptions = any;
  type SaveDialogOptions = any;
  type MessageBoxOptions = any;
  type FileFilter = any;
}

declare module 'node-machine-id' {
  export function machineId(original?: boolean): Promise<string>;
  export function machineIdSync(original?: boolean): string;
}

// Minimal Node.js built-in module shims (types only, runtime provided by Node)
declare module 'fs' {
  export function readFileSync(path: string | any, options?: any): string | Buffer;
  export function writeFileSync(path: string | any, data: any, options?: any): void;
  export function existsSync(path: string | any): boolean;
  export function mkdirSync(path: string | any, options?: any): void;
  export function statSync(path: string | any): any;
  export function createReadStream(path: string | any, options?: any): any;
}

declare module 'path' {
  export function join(...args: any[]): string;
  export function extname(p: string): string;
  export function basename(p: string, ext?: string): string;
  export function dirname(p: string): string;
}

declare module 'crypto' {
  export function createHash(algorithm: string): any;
  export function createHmac(algorithm: string, key: any): any;
  export function randomBytes(size: number): any;
  export function createCipheriv(alg: string, key: any, iv: any, options?: any): any;
  export function createDecipheriv(alg: string, key: any, iv: any, options?: any): any;
  export function createVerify(algorithm: string): any;
  export function pbkdf2Sync(password: any, salt: any, iterations: number, keylen: number, digest: string): { toString(enc: string): string };
}

declare module 'os' {
  export function platform(): string;
  export function arch(): string;
  export function release(): string;
  export function totalmem(): number;
  export function cpus(): Array<{ model: string }>;
  export function networkInterfaces(): any;
}

declare module 'child_process' { export function execSync(cmd: string, options?: any): any; }

// Common globals in Node/Electron contexts
declare var __dirname: string;
declare var process: { env: Record<string, string | undefined>; platform: string; versions?: any; arch?: string; type?: string };
declare type Buffer = any;
declare var Buffer: any;
declare function require(moduleName: string): any;

declare class URL {
  constructor(input: string, base?: string);
  hostname: string;
}
