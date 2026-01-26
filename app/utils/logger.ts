// Client-side debug logger that only logs in development mode
const isDebugEnabled = import.meta.dev

export const debugLog = {
  log: (...args: unknown[]) => {
    if (isDebugEnabled) {
      console.log(...args)
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors regardless of environment
    console.error(...args)
  },
  warn: (...args: unknown[]) => {
    // Always log warnings regardless of environment
    console.warn(...args)
  }
}
