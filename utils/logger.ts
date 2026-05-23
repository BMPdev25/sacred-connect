/**
 * Logger utility to output console messages in development mode and remain silent in production.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Logs general info messages to the console in development mode.
 * @param message - The message description.
 * @param data - Optional data or metadata to log.
 */
export function log(message: string, data?: unknown): void {
  if (IS_PROD) return;
  if (data !== undefined) {
    console.log(`[INFO] ${message}`, data);
  } else {
    console.log(`[INFO] ${message}`);
  }
}

/**
 * Logs warning messages to the console in development mode.
 * @param message - The warning message description.
 * @param data - Optional data or metadata to log.
 */
export function warn(message: string, data?: unknown): void {
  if (IS_PROD) return;
  if (data !== undefined) {
    console.warn(`[WARN] ${message}`, data);
  } else {
    console.warn(`[WARN] ${message}`);
  }
}

/**
 * Logs error messages to the console in development mode.
 * @param message - The error message description.
 * @param data - Optional data or metadata to log.
 */
export function error(message: string, data?: unknown): void {
  if (IS_PROD) return;
  if (data !== undefined) {
    console.error(`[ERROR] ${message}`, data);
  } else {
    console.error(`[ERROR] ${message}`);
  }
}

export const logger = {
  log,
  warn,
  error,
};
