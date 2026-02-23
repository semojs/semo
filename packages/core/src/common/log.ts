import picocolors from 'picocolors'
import { createColorize } from 'colorize-template'

const colorizeTemplate = createColorize({
  ...picocolors,
  success: picocolors.green,
  error: picocolors.red,
  warn: picocolors.yellow,
  info: picocolors.blue,
})

// Lazy-loaded modules for jsonLog (rarely used at startup)
let _colorizeJson: ((input: string) => string) | null = null
let _stringify: ((obj: any) => string) | null = null

async function getJsonModules() {
  if (!_colorizeJson) {
    const [colorizer, stringifier] = await Promise.all([
      import('json-colorizer'),
      import('json-stringify-pretty-compact'),
    ])
    _colorizeJson = colorizer.colorize
    _stringify = stringifier.default
  }
  return { colorizeJson: _colorizeJson!, stringify: _stringify! }
}

// Synchronous stringify fallback (used in log/info/error/warn/success when message is object)
function simpleStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

/**
 * Logs a message to the console. If the message is an array or an object,
 * it will be stringified and colorized before being logged. Otherwise,
 * the message will be logged as is.
 *
 * @param message - The message to log. It can be an array, an object, or a string.
 */
export const jsonLog = async (
  message: unknown[] | Record<string, unknown> | string
) => {
  if (
    Array.isArray(message) ||
    (typeof message === 'object' && message !== null && !Array.isArray(message))
  ) {
    const { colorizeJson, stringify } = await getJsonModules()
    console.log(colorizeJson(stringify(message)))
  } else {
    console.log(message)
  }
}

export const logJson = jsonLog

/**
 * Options for configuring log output behavior and formatting
 */
export type LogOptions = {
  // Whether to exit the process after logging
  ifExit?: boolean
  // The exit code to use when exiting the process
  exitCode?: number
  // Whether to display the log message with inverse colors
  inverseColor?: boolean
  // The type of log to output ('log', 'info', 'error' or 'warn')
  type?: 'log' | 'info' | 'error' | 'warn'
}

/**
 * Logs a message to the console with optional formatting and behavior.
 *
 * @param message - The message to log.
 * @param opts - Optional configuration for the log behavior.
 * @param opts.exitCode - The exit code to use if the process exits. Defaults to `0`.
 * @param opts.inverseColor - Whether to apply inverse color formatting to the message. Defaults to `false`.
 * @param opts.ifExit - Whether to exit the process after logging the message. Defaults to `false`.
 * @param opts.type - The type of console method to use for logging (e.g., 'log', 'error', 'warn'). Defaults to `'log'`.
 */
export const log = (message: string | unknown = '', opts: LogOptions = {}) => {
  if (
    typeof message === 'object' &&
    message !== null &&
    !Array.isArray(message)
  ) {
    message = simpleStringify(message)
  }

  opts.exitCode ??= 0
  opts.inverseColor ??= false
  opts.ifExit ??= false
  opts.type ??= 'log'

  console[opts.type](
    opts.inverseColor
      ? colorizeTemplate`{inverse ${message}}`
      : colorizeTemplate`${message}`
  )
  if (opts.ifExit) {
    process.exit(opts.exitCode)
  }
}

/**
 * Logs an info level message with blue color.
 *
 * @param message - The message content to be logged
 * @param opts - Log options configuration object
 * @param opts.ifExit - Whether to exit process after logging
 * @param opts.exitCode - Process exit code if exiting
 * @param opts.inverseColor - Whether to use inverse color display
 */
export const info = (message: string | unknown = '', opts: LogOptions = {}) => {
  if (
    typeof message === 'object' &&
    message !== null &&
    !Array.isArray(message)
  ) {
    message = simpleStringify(message)
  }
  opts.type = 'info'
  log(`{info ${message}}`, opts)
}

/**
 * Logs a success level message with green color.
 *
 * @param message - The message content to be logged
 * @param opts - Log options configuration object
 * @param opts.ifExit - Whether to exit process after logging
 * @param opts.exitCode - Process exit code if exiting
 * @param opts.inverseColor - Whether to use inverse color display
 */
export const success = (
  message: string | unknown = '',
  opts: LogOptions = {}
) => {
  if (
    typeof message === 'object' &&
    message !== null &&
    !Array.isArray(message)
  ) {
    message = simpleStringify(message)
  }
  opts.type = 'log'
  log(`{success ${message}}`, opts)
}

/**
 * Logs an error level message with red color.
 *
 * @param message - The message content to be logged
 * @param opts - Log options configuration object
 * @param opts.ifExit - Whether to exit process after logging
 * @param opts.exitCode - Process exit code if exiting
 * @param opts.inverseColor - Whether to use inverse color display
 */
export const error = (
  message: string | unknown = '',
  opts: LogOptions = {}
) => {
  if (
    typeof message === 'object' &&
    message !== null &&
    !Array.isArray(message)
  ) {
    message = simpleStringify(message)
  }
  opts.type = 'error'
  log(`{error ${message}}`, opts)
}

/**
 * Logs a warning level message with yellow color.
 *
 * @param message - The message content to be logged
 * @param opts - Log options configuration object
 * @param opts.ifExit - Whether to exit process after logging
 * @param opts.exitCode - Process exit code if exiting
 * @param opts.inverseColor - Whether to use inverse color display
 */
export const warn = (message: string | unknown = '', opts: LogOptions = {}) => {
  if (
    typeof message === 'object' &&
    message !== null &&
    !Array.isArray(message)
  ) {
    message = simpleStringify(message)
  }
  opts.type = 'warn'
  log(`{warn ${message}}`, opts)
}

/**
 * Logs a message with specified color to the console.
 *
 * @param color - The color to apply to the message
 * @param message - The message content to be logged
 * @param opts - Log options configuration object
 * @param opts.ifExit - Whether to exit process after logging
 * @param opts.exitCode - Process exit code if exiting
 * @param opts.inverseColor - Whether to use inverse color display
 */
export const colorfulLog = (
  color: string,
  message: string | unknown = '',
  opts: LogOptions = {}
) => {
  const colorized = colorize(color, message)
  opts.type = 'log'
  log(colorized, opts)
}

/**
 * Logs an error message and immediately exits the process.
 * Use this instead of error() + return when you want to halt execution.
 *
 * @param message - The error message to log before exiting
 * @param exitCode - The process exit code (default: 1)
 */
export const fatal = (
  message: string | unknown = '',
  exitCode: number = 1
): never => {
  error(message)
  process.exit(exitCode)
}

/**
 * Returns a colorized version of a message string using the specified color.
 *
 * @param color - The color to apply to the message
 * @param message - The message content to be colorized
 * @returns The colorized message string
 */
export const colorize = (color: string, message: string | unknown = '') => {
  if (
    typeof message === 'object' &&
    message !== null &&
    !Array.isArray(message)
  ) {
    message = simpleStringify(message)
  }
  return colorizeTemplate`{${color} ${message}}`
}
