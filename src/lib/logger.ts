/* eslint-disable no-console */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const verboseLoggingEnabled =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true'

function emit(level: LogLevel, args: unknown[]) {
  if (level === 'error') {
    console.error(...args)
    return
  }

  if (level === 'warn') {
    console.warn(...args)
    return
  }

  if (verboseLoggingEnabled) {
    if (level === 'debug') {
      console.log(...args)
      return
    }

    console.info(...args)
  }
}

export const logger = {
  debug: (...args: unknown[]) => emit('debug', args),
  info: (...args: unknown[]) => emit('info', args),
  warn: (...args: unknown[]) => emit('warn', args),
  error: (...args: unknown[]) => emit('error', args)
}
