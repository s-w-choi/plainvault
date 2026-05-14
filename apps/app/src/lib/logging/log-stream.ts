export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args: unknown[];
}

type LogLevel = LogEntry['level'];
type LogSubscriber = (entry: LogEntry) => void;

interface LogStream {
  subscribe(fn: LogSubscriber): () => void;
  getBufferedLogs(): LogEntry[];
}

interface LogStreamState extends LogStream {
  capture(level: LogLevel, args: unknown[]): void;
  initLogCapture(): void;
}

const MAX_BUFFER = 500;

const SENSITIVE_KEYS = /password|token|secret|key|auth|credential|private|hash/i;

function sanitizeArg(arg: unknown, depth = 0): unknown {
  if (depth > 3) return '[Max depth]';

  if (typeof arg === 'string') {
    if (SENSITIVE_KEYS.test(arg)) {
      return '[REDACTED]';
    }
    return arg.length > 500 ? arg.slice(0, 500) + '...' : arg;
  }

  if (Array.isArray(arg)) {
    return arg.map((item) => sanitizeArg(item, depth + 1));
  }

  if (typeof arg === 'object' && arg !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(arg)) {
      if (SENSITIVE_KEYS.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeArg(value, depth + 1);
      }
    }
    return sanitized;
  }

  return arg;
}

const createLogStream = (): LogStreamState => {
  const buffer: LogEntry[] = [];
  const subscribers = new Set<LogSubscriber>();
  let counter = 0;
  let initialized = false;

  const capture = (level: LogLevel, args: unknown[]) => {
    const [firstArg, ...restArgs] = args;
    const entry: LogEntry = {
      id: ++counter,
      timestamp: new Date().toISOString(),
      level,
      message: String(firstArg),
      args: restArgs.map((arg) => sanitizeArg(arg)),
    };

    buffer.push(entry);
    if (buffer.length > MAX_BUFFER) {
      buffer.shift();
    }

    for (const subscriber of subscribers) {
      subscriber(entry);
    }
  };

  const initLogCapture = () => {
    if (initialized || typeof window !== 'undefined') {
      return;
    }

    initialized = true;

    const origConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    console.log = (...args) => {
      try { capture('log', args); } catch {}
      origConsole.log(...args);
    };
    console.info = (...args) => {
      try { capture('info', args); } catch {}
      origConsole.info(...args);
    };
    console.warn = (...args) => {
      try { capture('warn', args); } catch {}
      origConsole.warn(...args);
    };
    console.error = (...args) => {
      try { capture('error', args); } catch {}
      origConsole.error(...args);
    };
    console.debug = (...args) => {
      try { capture('debug', args); } catch {}
      origConsole.debug(...args);
    };
  };

  return {
    capture,
    initLogCapture,
    subscribe(fn) {
      subscribers.add(fn);

      return () => {
        subscribers.delete(fn);
      };
    },
    getBufferedLogs() {
      return [...buffer];
    },
  };
};

declare global {
  var __logStream: LogStreamState | undefined;
}

export const logStream = globalThis.__logStream ?? createLogStream();
globalThis.__logStream = logStream;

export const initLogCapture = () => logStream.initLogCapture();
export const getBufferedLogs = () => logStream.getBufferedLogs();

initLogCapture();
