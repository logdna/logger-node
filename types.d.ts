declare module "@logdna/logger" {
  import { EventEmitter } from 'events';
  enum LogLevel {
    trace,
    debug,
    info,
    warn,
    error,
    fatal
  }

  type CustomLevel = string

  interface ConstructorOptions {
    level?: LogLevel | CustomLevel;
    tags?: string | string[];
    meta?: object;
    timeout?: number;
    hostname?: string;
    mac?: string;
    ip?: string;
    url?: string;
    flushLimit?: number;
    flushIntervalMs?: number;
    shimProperties?: string[];
    indexMeta?: boolean;
    app?: string;
    env?: string;
    baseBackoffMs?: number;
    maxBackoffMs?: number;
    withCredentials?: boolean;
    sendUserAgent?: boolean;
    levels?: CustomLevel[];
    maxAttempts?: number;
    verboseEvents?: boolean;
    ignoreRetryableErrors?: boolean;
  }

  interface LogOptions {
    level?: LogLevel | CustomLevel;
    app?: string;
    env?: string;
    timestamp?: number;
    context?: object;
    indexMeta?: boolean;
    meta?: object;
  }

  export interface Logger extends EventEmitter {
    info?(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    warn?(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    debug?(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    error?(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    fatal?(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    trace?(statement: string | object, options?: Omit<LogOptions, 'level'>): void;
    log(statement: string | object, options?: LogOptions): void;
    addMetaProperty(key: string, value: any): void;
    removeMetaProperty(key: string): void;
    flush(): void;
  }

  export function createLogger(
    key: string,
    options?: ConstructorOptions
  ): Logger;

  export function setupDefaultLogger(
    key: string,
    options?: ConstructorOptions
  ): Logger;
}
