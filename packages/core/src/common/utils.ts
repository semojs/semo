import crypto from 'crypto'
import _ from 'lodash'
import { createRequire } from 'node:module'
import { findUpSync } from 'find-up'
import path from 'node:path'
import { getBorderCharacters, table } from 'table'
import { info, log } from './log.js'
import { CommonSpawnOptions, spawn, spawnSync } from 'node:child_process'
import { ensureDirSync } from 'fs-extra'
import { existsSync, unlinkSync, writeFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
/**
 * Compute md5.
 * @param {string} s
 */
export const md5 = function (s: string) {
  return crypto.createHash('md5').update(s, 'utf8').digest('hex')
}

/**
 * Split input by comma and blank.
 * @example
 * const = Utils.splitComma('a, b , c,d')
 * @param {string} input
 * @returns {array} input separated by comma
 */
export const splitComma = function (input: string): Array<string> {
  return splitByChar(input, ',')
}

/**
 * Split input by a specific char and blank.
 * @example
 * const = Utils.splitByChar('a, b , c=d', '=')
 * @param {string} input
 * @returns {array} input separated by comma
 */
export const splitByChar = function (
  input: string,
  char: string
): Array<string> {
  const exp = new RegExp(char, 'g')
  return input.replace(exp, ' ').split(/\s+/)
}

/**
 * Parse packages from yargs option
 * @param {*} input yarns option input, could be string or array
 * @returns {array} Package list
 */
export const parsePackageNames = function (input: string | string[]): string[] {
  if (_.isString(input)) {
    return splitComma(input)
  }

  if (_.isArray(input)) {
    return _.flatten(input.map((item) => splitComma(item)))
  }

  return []
}

/**
 * Load any package's package.json
 * @param {string} pkg package name
 * @param {array} paths search paths
 */
export const getPackagePath = function (
  pkg: string | undefined = undefined,
  paths: string[] = []
): string | undefined {
  const packagePath = findUpSync('package.json', {
    cwd: pkg ? path.dirname(require.resolve(pkg, { paths })) : process.cwd(),
  })
  return packagePath
}

/**
 * Get absolute path or dir, this func will not judge if exist
 */
export const getAbsolutePath = function (filePath: string): string {
  if (filePath[0] === '/') return filePath

  if (process.env.HOME) {
    if (filePath[0] === '~') return filePath.replace(/^~/, process.env.HOME)
  }

  return path.resolve(filePath)
}

/**
 * Print a simple table.
 * A table style for `semo status`, if you don't like this style, can use Utils.table
 * @param {array} columns Table columns
 * @param {string} caption Table caption
 * @param {object} borderOptions Border options
 */
export const outputTable = function (
  columns: string[][],
  caption: string = '',
  borderOptions: object = {}
) {
  // table config
  const config = {
    drawHorizontalLine: () => {
      return false
    },
    columnDefault: {
      paddingLeft: 2,
      paddingRight: 1,
    },
    border: Object.assign(
      getBorderCharacters('void'),
      { bodyJoin: ':' },
      borderOptions
    ),
  }

  if (caption) {
    info(caption)
  }
  log(table(columns, config))
}

interface ExecResult {
  code: number | null
  stdout: string
  stderr: string
}

interface ExecOptions extends CommonSpawnOptions {
  captureOutput?: boolean
}

export const execPromise = function (
  cmd: string,
  opts: ExecOptions = {
    stdio: 'inherit',
    shell: true,
    captureOutput: false,
  },
  callback?: (result: ExecResult) => void
): Promise<ExecResult> {
  opts.stdio ??= 'inherit'
  opts.shell ??= true
  opts.captureOutput ??= false
  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''

    // 如果需要捕获输出，修改 stdio 选项
    if (opts.captureOutput) {
      opts.stdio = 'pipe'
    }

    const process = spawn(cmd, opts)

    // 如果需要捕获输出
    if (opts.captureOutput) {
      process.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      process.stderr?.on('data', (data) => {
        stderr += data.toString()
      })
    }

    // 监听命令执行完成
    process.on('close', (code) => {
      const result: ExecResult = {
        code,
        stdout,
        stderr,
      }

      if (callback) {
        callback(result)
      }
      resolve(result)
    })

    // 监听错误
    process.on('error', (err) => {
      reject(err)
    })
  })
}

export const execSync = function (
  cmd: string,
  opts: CommonSpawnOptions = {
    stdio: 'inherit',
    shell: true,
  }
) {
  return spawnSync(cmd, opts)
}
export const exec = function (
  cmd: string,
  opts: CommonSpawnOptions = {
    stdio: 'inherit',
    shell: true,
  }
) {
  return spawn(cmd, opts)
}

/**
 * Format options keys to make them compatible with both param cases and camel cases
 *
 * @param opts - The options object to format
 * @returns A new object with formatted keys
 * @throws {Error} When input is not a valid object
 *
 * @example
 * ```ts
 * formatRcOptions({ 'foo-bar': 1 }) // returns { fooBar: 1 }
 * formatRcOptions({ 'foo.bar': 1 }) // returns { foo_bar: 1 }
 * ```
 */
export const formatRcOptions = function <T extends Record<string, unknown>>(
  opts: T
): Record<string, unknown> {
  if (!_.isObject(opts) || Array.isArray(opts)) {
    throw new Error('Not valid rc options! Expected an object.')
  }

  return Object.keys(opts).reduce(
    (newOpts, key) => {
      if (key.includes('-') || key.includes('.')) {
        const newKey = key
          .replace(/--+/g, '-')
          .replace(/^-/g, '')
          .replace(/-([a-z])/g, (_, p1) => p1.toUpperCase())
          .replace('.', '_')
        newOpts[newKey] = opts[key]
      } else {
        newOpts[key] = opts[key]
      }
      return newOpts
    },
    {} as Record<string, unknown>
  )
}

export const getNodeRuntime = function (): string {
  const script = process.env.npm_lifecycle_script || ''

  if (script.includes('tsx ')) {
    return 'tsx'
  }

  if (script.includes('jiti ')) {
    return 'jiti'
  }

  if (script.includes('ts-node')) {
    return 'ts-node'
  }

  return 'node'
}

/**
 * Determines if the current Node.js process is using a TypeScript runner.
 *
 * @returns {boolean} `true` if a TypeScript runner is detected, otherwise `false`.
 */
export const isUsingTsRunner = function (): boolean {
  return (
    getNodeRuntime() === 'ts-node' ||
    getNodeRuntime() === 'jiti' ||
    getNodeRuntime() === 'tsx'
  )
}

/**
 * Clear console
 */
export const clearConsole = function () {
  if (process.stdout.isTTY) {
    process.stdout.write(
      process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
    )
  }
}

/**
 * Moves the cursor to the top of the console.
 */
export const moveToTopConsole = function () {
  if (process.stdout.isTTY) {
    process.stdout.write(process.platform === 'win32' ? '\\x1B[0f' : '\\x1B[H')
  }
}

/**
 * Console Reader
 *
 * Mostly use less mode, if HOME can not be detected, it will fallback to console.log
 *
 * @param content The content to read
 * @param plugin Plugin name, used to make up cache path
 * @param identifier The content identifier, used to make up cache path
 */
export const consoleReader = async function (
  content: string,
  opts: { plugin?: string; identifier?: string; tmpPathOnly?: boolean } = {},
  scriptName: string = 'semo'
) {
  opts.plugin = opts.plugin || scriptName
  opts.identifier = opts.identifier || Math.random() + ''

  if (process.env.HOME) {
    const tmpPath = path.resolve(
      process.env.HOME,
      `.${scriptName}/cache`,
      <string>opts.plugin,
      md5(opts.identifier)
    )
    ensureDirSync(path.dirname(tmpPath))
    writeFileSync(tmpPath, content)

    if (opts.tmpPathOnly) {
      return tmpPath
    }

    await execPromise(`cat ${tmpPath} | less -r`, undefined, () => {
      // Maybe the file already removed
      if (existsSync(tmpPath)) {
        unlinkSync(tmpPath)
      }
    })
  } else {
    console.log(content)
  }

  return true
}

/**
 * Check if obj is a Promise
 *
 * Copy from `is-promise` npm module
 */
export const isPromise = (obj) => {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  )
}

/**
 * Used for get deep value from a object or function or Promise
 *
 * @param func a Promise, a Function or a literal object
 * @param getPath a key path
 * @param args arguments for function
 */
export const run = async (func, getPath = '', ...args) => {
  let result
  if (isPromise(func)) {
    result = await func
  } else if (_.isFunction(func)) {
    result = await func(...args)
  } else if (_.isArray(func) && _.isFunction(func[0])) {
    const newFunc = func[0]
    func.shift()
    result = await newFunc(...func)
  } else if (_.isObject(func)) {
    result = func
  } else {
    throw new Error('invalid func')
  }

  const that = result

  result = !getPath ? result : _.get(result, getPath)

  if (_.isFunction(result)) {
    // pass this obj to function/method call
    result = await result.call(that, ...args)
  }

  return result
}
