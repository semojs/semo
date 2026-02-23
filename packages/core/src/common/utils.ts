import crypto from 'crypto'
import { findUpSync } from 'find-up'
import { CommonSpawnOptions, spawn, spawnSync } from 'node:child_process'
import {
  closeSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
// table is lazy-loaded in outputTable()
import { info, log } from './log.js'

/** Get a nested value from an object by dot-separated path */
export function deepGet(obj: any, path: string, defaultValue?: any): any {
  if (!obj || !path) return defaultValue
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    if (result == null) return defaultValue
    result = result[key]
  }
  return result === undefined ? defaultValue : result
}

/** Set a nested value on an object by dot-separated path */
export function deepSet(obj: any, path: string, value: any): any {
  if (!path) return obj
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }
  current[keys[keys.length - 1]] = value
  return obj
}

/** Deep merge source objects into target (mutates target) */
export function deepMerge(target: any, ...sources: any[]): any {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue
    for (const key of Object.keys(source)) {
      const srcVal = source[key]
      const tgtVal = target[key]
      if (
        srcVal &&
        typeof srcVal === 'object' &&
        !Array.isArray(srcVal) &&
        tgtVal &&
        typeof tgtVal === 'object' &&
        !Array.isArray(tgtVal)
      ) {
        deepMerge(tgtVal, srcVal)
      } else {
        target[key] = srcVal
      }
    }
  }
  return target
}

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
  if (typeof input === 'string') {
    return splitComma(input)
  }

  if (Array.isArray(input)) {
    return input.map((item) => splitComma(item)).flat()
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
  let cwd: string
  if (pkg) {
    // createRequire needed for path-scoped require.resolve (import.meta.resolve doesn't support custom paths)
    const localRequire = createRequire(
      paths.length > 0 ? path.resolve(paths[0], '_virtual.js') : import.meta.url
    )
    cwd = path.dirname(localRequire.resolve(pkg))
  } else {
    cwd = process.cwd()
  }
  const packagePath = findUpSync('package.json', { cwd })
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
export const outputTable = async function (
  columns: string[][],
  caption: string = '',
  borderOptions: object = {}
) {
  const { table, getBorderCharacters } = await import('table')
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

    const child = spawn(cmd, opts)

    // 如果需要捕获输出
    if (opts.captureOutput) {
      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })
    }

    // 监听命令执行完成
    child.on('close', (code) => {
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
    child.on('error', (err) => {
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
  if (typeof opts !== 'object' || opts === null || Array.isArray(opts)) {
    throw new Error('Not valid rc options! Expected an object.')
  }

  return Object.keys(opts).reduce(
    (newOpts, key) => {
      if (key.includes('-') || key.includes('.')) {
        const newKey = key
          .replace(/--+/g, '-')
          .replace(/^-/g, '')
          .replace(/-([a-z])/g, (_, p1) => p1.toUpperCase())
          .replace(/\./g, '_')
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
 * Checks npm_lifecycle_script (via getNodeRuntime), process.argv for tsx/ts-node/jiti,
 * and Node.js --import/--loader flags pointing to TS loaders.
 *
 * @returns {boolean} `true` if a TypeScript runner is detected, otherwise `false`.
 */
export const isUsingTsRunner = function (): boolean {
  const runtime = getNodeRuntime()
  if (runtime === 'ts-node' || runtime === 'jiti' || runtime === 'tsx') {
    return true
  }

  // Check process.argv for TS runner binaries
  const argv = process.argv
  for (const arg of argv) {
    if (
      /\btsx\b/.test(arg) ||
      /\bts-node\b/.test(arg) ||
      /\bjiti\b/.test(arg)
    ) {
      return true
    }
  }

  // Check Node.js --import or --loader flags pointing to TS loaders
  const execArgv = process.execArgv
  for (let i = 0; i < execArgv.length; i++) {
    const arg = execArgv[i]
    const nextArg = execArgv[i + 1] || ''
    const value = arg.includes('=') ? arg.split('=')[1] : nextArg

    if (arg.startsWith('--import') || arg.startsWith('--loader')) {
      if (/tsx|ts-node|jiti/.test(value)) {
        return true
      }
    }
  }

  return false
}

/**
 * Determines if the current working directory is a TypeScript project.
 *
 * Checks for tsconfig.json and typescript in devDependencies/dependencies.
 *
 * @param cwd - Optional working directory to check, defaults to process.cwd()
 * @returns {boolean} `true` if the project appears to use TypeScript.
 */
export const isTypeScriptProject = function (cwd?: string): boolean {
  const dir = cwd || process.cwd()

  // Check for tsconfig.json
  if (existsSync(path.resolve(dir, 'tsconfig.json'))) {
    return true
  }

  // Check package.json for typescript dependency
  try {
    const pkgPath = path.resolve(dir, 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (allDeps.typescript) {
        return true
      }
    }
  } catch {
    // ignore parse errors
  }

  return false
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
    process.stdout.write(process.platform === 'win32' ? '\x1B[0f' : '\x1B[H')
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
    mkdirSync(path.dirname(tmpPath), { recursive: true })
    writeFileSync(tmpPath, content)

    if (opts.tmpPathOnly) {
      return tmpPath
    }

    await new Promise<void>((resolve, reject) => {
      const child = spawn('less', ['-r', tmpPath], { stdio: 'inherit' })
      child.on('close', () => {
        if (existsSync(tmpPath)) {
          unlinkSync(tmpPath)
        }
        resolve()
      })
      child.on('error', reject)
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
export const isPromise = (obj: any) => {
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
export const run = async (func: any, getPath = '', ...args: any[]) => {
  let result
  if (isPromise(func)) {
    result = await func
  } else if (typeof func === 'function') {
    result = await func(...args)
  } else if (Array.isArray(func) && typeof func[0] === 'function') {
    const newFunc = func[0]
    func.shift()
    result = await newFunc(...func)
  } else if (typeof func === 'object' && func !== null) {
    result = func
  } else {
    throw new Error('invalid func')
  }

  const that = result

  result = !getPath ? result : deepGet(result, getPath)

  if (typeof result === 'function') {
    // pass this obj to function/method call
    result = await result.call(that, ...args)
  }

  return result
}

/**
 * Keep repl history
 * Shared utility for REPL and Shell plugins
 */
export const replHistory = function (
  replServer: {
    history?: string[]
    historyIndex?: number
    addListener: (...args: any[]) => void
    output: { write: (...args: any[]) => void }
    displayPrompt: (...args: any[]) => void
    defineCommand: (...args: any[]) => void
    [key: string]: any
  },
  file: string
) {
  try {
    statSync(file)
    replServer.history = readFileSync(file, 'utf-8').split('\n').reverse()
    replServer.history.shift()
    replServer.historyIndex = -1
  } catch {}

  const fd = openSync(file, 'a')
  const wstream = createWriteStream(file, { fd })
  wstream.on('error', function (err) {
    throw err
  })

  replServer.addListener('line', function (code: string) {
    if (code && code !== '.history') {
      wstream.write(code + '\n')
    } else {
      replServer.historyIndex!++
      replServer.history!.pop()
    }
  })

  process.on('exit', function () {
    closeSync(fd)
  })

  replServer.defineCommand('history', {
    help: 'Show the history',
    action: function () {
      const out = [...replServer.history!]
      replServer.output.write(out.reverse().join('\n') + '\n')
      replServer.displayPrompt()
    },
  })
}
