/**
 * Type shims for native modules used in Electron
 * 
 * These ambient declarations allow TypeScript compilation without installing
 * the actual packages. The runtime behavior depends on the packages being
 * available at execution time.
 */

declare module 'better-sqlite3' {
  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): void;
    pragma(pragma: string, value?: any): any;
    backup(filename: string): Promise<void>;
    close(): void;
  }

  interface Statement {
    run(...params: any[]): { changes: number; lastInsertRowid: number };
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }

  interface DatabaseOptions {
    verbose?: (message?: any, ...additionalArgs: any[]) => void;
    timeout?: number;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: DatabaseOptions): Database;
    (filename: string, options?: DatabaseOptions): Database;
  }

  const Database: DatabaseConstructor;
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
