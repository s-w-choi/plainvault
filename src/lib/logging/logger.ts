type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL];
}

function formatLogEntry(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...meta,
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('debug')) {
      console.debug(formatLogEntry('debug', message, meta));
    }
  },

  info: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('info')) {
      console.info(formatLogEntry('info', message, meta));
    }
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('warn')) {
      console.warn(formatLogEntry('warn', message, meta));
    }
  },

  error: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('error')) {
      console.error(formatLogEntry('error', message, meta));
    }
  },
};
