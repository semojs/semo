import crypto from 'crypto'
import _ from 'lodash'
import { createRequire } from 'node:module'
import { findUpSync } from 'find-up'
import path from 'node:path'
import { getBorderCharacters, table } from 'table'
import { info, log } from './log.js'
import { CommonSpawnOptions, spawn, spawnSync } from 'node:child_process'

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

export const execSync = function (
  cmd: string,
  opts: CommonSpawnOptions = {
    stdio: 'inherit',
    shell: true,
  }
) {
  spawnSync(cmd, opts)
}
export const exec = function (
  cmd: string,
  opts: CommonSpawnOptions = {
    stdio: 'inherit',
    shell: true,
  }
) {
  spawn(cmd, opts)
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

  if (script.startsWith('tsx ')) {
    return 'tsx'
  }

  if (script.startsWith('jiti ')) {
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
