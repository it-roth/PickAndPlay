// Lightweight logger utility. Use this instead of direct console calls so we
// can control log levels centrally (silence in production, enable debug in dev).

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, off: 4 };

// Default: enable debug in development, info+ in production
const isDev = import.meta.env.MODE === 'development';
const DEFAULT_LEVEL = isDev ? 'debug' : 'info';

let currentLevel = LEVELS[DEFAULT_LEVEL];

export function setLogLevel(levelName) {
  if (LEVELS[levelName] === undefined) return;
  currentLevel = LEVELS[levelName];
}

function shouldLog(level) {
  return level >= currentLevel;
}

const logger = {
  debug: (...args) => { if (shouldLog(LEVELS.debug)) console.debug('[DEBUG]', ...args); },
  info: (...args) => { if (shouldLog(LEVELS.info)) console.info('[INFO]', ...args); },
  warn: (...args) => { if (shouldLog(LEVELS.warn)) console.warn('[WARN]', ...args); },
  error: (...args) => { if (shouldLog(LEVELS.error)) console.error('[ERROR]', ...args); },
  setLevel: setLogLevel,
};

export default logger;
