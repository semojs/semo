import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import glob from 'glob'
import { table, getBorderCharacters } from 'table'
import findUp from 'find-up'
import _ from 'lodash'
import colorize from 'json-colorizer'
import stringify from 'json-stringify-pretty-compact'
import chalk from 'chalk'
import randomatic from 'randomatic'
import day from 'dayjs'
import co from 'co'
import shell from 'shelljs'
import debug from 'debug'
import inquirer from 'inquirer'
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt'
import fuzzy from 'fuzzy'
import { execSync } from 'child_process'
import objectHash from 'node-object-hash'
import emoji from 'node-emoji'
import { dd, dump } from 'dumper.js'
import getStdin from 'get-stdin'
import NodeCache from 'node-cache'
import yargs from 'yargs'

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt)
const { hash } = objectHash({ sort: true })

let cachedInstance: NodeCache
/**
 * Get Zignis internal cache instance
 * @returns {NodeCache}
 */
const getInternalCache = function(): NodeCache {
  if (!cachedInstance) {
    cachedInstance = new NodeCache({
      useClones: false
    })
  }
  return cachedInstance
}
cachedInstance = getInternalCache()

interface CachedNamespaceInstance {
  [propName: string]: NodeCache
}

/**
 * Get Zignis cache instance by namespace
 * @param {string} namespace
 * @returns {NodeCache}
 */
const getCache = function(namespace: string): NodeCache {
  if (!namespace) {
    throw Error('Namespace is necessary.')
  }

  let cachedNamespaceInstances: CachedNamespaceInstance | undefined
  cachedNamespaceInstances = cachedInstance.get('cachedNamespaceInstances')

  if (!cachedNamespaceInstances) {
    cachedNamespaceInstances = {}
  }

  if (!cachedNamespaceInstances[namespace]) {
    cachedNamespaceInstances[namespace] = new NodeCache({
      useClones: false
    })
    cachedInstance.set('cachedNamespaceInstances', cachedNamespaceInstances)
  }
  return cachedNamespaceInstances[namespace]
}

/**
 * debug core
 */
const debugCore = function(...args) {
  let debugCache: any = getInternalCache().get('debug')

  if (!debugCache) {
    const argv: any = getInternalCache().get('argv')
    const scriptName = argv && argv.scriptName ? argv.scriptName : 'zignis'
    debugCache = debug(`${scriptName}-core`)
    debugCache(...args)

    getInternalCache().set('debug', debugCache)
  }

  return debugCache
}

interface IHookOption {
  mode?: 'assign' | 'merge' | 'push' | 'replace' | 'group'
  useCache?: boolean
  include?: boolean | string[]
  exclude?: boolean | string[]
  opts?: any
}

/**
 * Run hook in all valid plugins and return the combined results.
 * Plugins implement hook in `module.exports`, could be generator function or promise function or non-function
 * For non-function, it will be used as hook data directly, likely to be returned by function
 * @example
 * const hookReturn = await Utils.invokeHook('hook')
 * @param {string} hook Hook name, suggest plugin defined hook include a prefix, e.g. `zhike:hook`
 * @param {string} options Options
 * @param {string} options.mode Hook mode, could be `assign`, `merge`, `push`, `replace`, `group`, default is assign.
 * @param {bool} options.useCache If or not use cached hook result
 * @param {array} options.include set plugins to be used in invoking
 * @param {array} options.exclude set plugins not to be used in invoking, same ones options.exclude take precedence
 * @param {array} options.opts opts will be sent to hook implementation
 */
const invokeHook = async function(hook: string, options: IHookOption = { mode: 'assign' }) {
  const argv: any = getInternalCache().get('argv')
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'zignis'
  const invokedHookCache: { [propName: string]: any } = cachedInstance.get('invokedHookCache') || {}
  hook = `hook_${hook}`
  options = Object.assign(
    {
      mode: 'assign',
      useCache: false,
      include: [],
      exclude: [],
      opts: {}
    },
    options
  )

  try {
    const cacheKey = `${hook}:${hash(options)}`
    if (options.useCache && invokedHookCache[cacheKey]) {
      return invokedHookCache[cacheKey]
    }

    // Make Zignis core supporting hook invocation
    const plugins = Object.assign(
      {},
      {
        [scriptName]: path.resolve(__dirname, '../../')
      },
      getAllPluginsMapping()
    )

    // Make Application supporting hook invocation
    const appConfig = getApplicationConfig()
    if (appConfig && appConfig.name !== scriptName && !plugins[appConfig.name] && appConfig.applicationDir) {
      plugins['application'] = appConfig.applicationDir
    }

    let pluginsReturn
    switch (options.mode) {
      case 'push':
        pluginsReturn = []
        break
      case 'replace':
        pluginsReturn = ''
        break
      case 'group':
      case 'assign':
      case 'merge':
      default:
        pluginsReturn = {}
        break
    }

    for (let i = 0, length = Object.keys(plugins).length; i < length; i++) {
      let plugin = Object.keys(plugins)[i]

      if (_.isArray(options.include) && options.include.length > 0 && options.include.indexOf(plugin) === -1) {
        continue
      }

      if (_.isArray(options.exclude) && options.exclude.length > 0 && options.exclude.indexOf(plugin) > -1) {
        continue
      }

      try {
        let pluginEntry = 'index.js'
        if (fs.existsSync(path.resolve(plugins[plugin], 'package.json'))) {
          const pkgConfig = require(path.resolve(plugins[plugin], 'package.json'))
          if (pkgConfig.main) {
            pluginEntry = pkgConfig.main
          }

          if (pkgConfig.rc && pkgConfig.rc.hookDir) {
            if (fs.existsSync(path.resolve(plugins[plugin], pkgConfig.rc.hookDir, 'index.js'))) {
              pluginEntry = path.join(pkgConfig.rc.hookDir, 'index.js')
            }
          }
        }

        // hookDir
        if (fs.existsSync(path.resolve(plugins[plugin], `.${scriptName}rc.json`))) {
          const scriptConfig = require(path.resolve(plugins[plugin], `.${scriptName}rc.json`))
          if (scriptConfig.hookDir && fs.existsSync(path.resolve(plugins[plugin], scriptConfig.hookDir, 'index.js'))) {
            pluginEntry = path.join(scriptConfig.hookDir, 'index.js')
          }
        }

        // For application, do not accept default index.js
        if (plugin === 'application' && pluginEntry === 'index.js') {
          continue
        }

        if (fs.existsSync(path.resolve(plugins[plugin], pluginEntry))) {
          const loadedPlugin = require(path.resolve(plugins[plugin], pluginEntry))
          if (loadedPlugin[hook]) {
            let pluginReturn
            if (_.isFunction(loadedPlugin[hook])) {
              pluginReturn = (await loadedPlugin[hook](options.opts, pluginsReturn)) || {}
            } else {
              pluginReturn = loadedPlugin[hook]
            }

            switch (options.mode) {
              case 'group':
                pluginReturn = pluginReturn || {}
                pluginsReturn[plugin] = pluginReturn
                break
              case 'push':
                pluginsReturn.push(pluginReturn)
                break
              case 'replace':
                pluginsReturn = pluginReturn
                break
              case 'merge':
                pluginReturn = pluginReturn || {}
                pluginsReturn = _.merge(pluginsReturn, pluginReturn)
                break
              case 'assign':
              default:
                pluginReturn = pluginReturn || {}
                pluginsReturn = Object.assign(pluginsReturn, pluginReturn)
                break
            }
          }
        }
      } catch (e) {
        if (!e.code || e.code !== 'MODULE_NOT_FOUND') {
          throw new Error(e.stack)
        } else {
          error(e.message, false)
        }
      }
    }

    invokedHookCache[cacheKey] = pluginsReturn
    cachedInstance.set('invokedHookCache', invokedHookCache)

    return pluginsReturn
  } catch (e) {
    throw new Error(e.stack)
  }
}

/**
 * Extend command's sub command, it give other plugins an opportunity to extend it's sub command.
 * So if you want other plugins to extend your sub commands, you can use this util function to replace default `yargs.commandDir`
 * @example
 * exports.builder = function (yargs) {
 *   // The first param could be a/b/c if you want to extend subcommand's subcommand
 *   Utils.extendSubCommand('make', 'zignis', yargs, __dirname)
 * }
 * @param {String} command Current command name.
 * @param {String} module Current plugin name.
 * @param {Object} yargs Yargs reference.
 * @param {String} basePath Often set to `__dirname`.
 */
const extendSubCommand = function(command: string, module: string, yargs: yargs.Argv, basePath: string): void {
  const plugins = getAllPluginsMapping()
  const config = getCombinedConfig()

  // load default commands
  const currentCommand: string | undefined = command.split('/').pop()
  if (currentCommand && fs.existsSync(path.resolve(basePath, currentCommand))) {
    yargs.commandDir(path.resolve(basePath, currentCommand))
  }

  // Load plugin commands
  if (plugins) {
    Object.keys(plugins).map(function(plugin): void {
      if (config.pluginConfigs[plugin] && config.pluginConfigs[plugin].extendDir) {
        if (
          fs.existsSync(
            path.resolve(plugins[plugin], `${config.pluginConfigs[plugin].extendDir}/${module}/src/commands`, command)
          )
        ) {
          yargs.commandDir(
            path.resolve(plugins[plugin], `${config.pluginConfigs[plugin].extendDir}/${module}/src/commands`, command)
          )
        }
      }
    })
  }

  // Load application commands
  if (
    config.extendDir &&
    fs.existsSync(path.resolve(process.cwd(), `${config.extendDir}/${module}/src/commands`, command))
  ) {
    yargs.commandDir(path.resolve(process.cwd(), `${config.extendDir}/${module}/src/commands`, command))
  }
}

/**
 * Get all plugins path mapping.
 * Same name plugins would be overriden orderly.
 * This function also influence final valid commands and configs.
 */
const getAllPluginsMapping = function(): { [propName: string]: string } {
  let argv: any = cachedInstance.get('argv') || {}
  let plugins: { [propName: string]: any } = cachedInstance.get('plugins') || {}

  if (_.isEmpty(plugins)) {
    let pluginPrefix = argv.pluginPrefix || 'zignis'
    let scriptName = argv && argv.scriptName ? argv.scriptName : 'zignis'
    if (_.isString(pluginPrefix)) {
      pluginPrefix = [pluginPrefix]
    }

    if (!_.isArray(pluginPrefix)) {
      error('invalid --plugin-prefix')
    }

    let topPluginPattern = '@(' + pluginPrefix.map(prefix => `${prefix}-plugin-*`).join('|') + ')'
    let orgPluginPattern = '@(' + pluginPrefix.map(prefix => `@*/${prefix}-plugin-*`).join('|') + ')'

    plugins = {}

    // process core plugins
    glob
      .sync(topPluginPattern, {
        cwd: path.resolve(__dirname, '../plugins')
      })
      .map(function(plugin): void {
        plugins[plugin] = path.resolve(__dirname, '../plugins', plugin)
      })

    if (!argv.disableGlobalPlugin) {
      // process core same directory plugins
      glob
        .sync(topPluginPattern, {
          cwd: path.resolve(__dirname, '../../../')
        })
        .map(function(plugin): void {
          plugins[plugin] = path.resolve(__dirname, '../../../', plugin)
        })

      // process core same directory npm plugins
      glob
        .sync(orgPluginPattern, {
          cwd: path.resolve(__dirname, '../../../')
        })
        .map(function(plugin): void {
          plugins[plugin] = path.resolve(__dirname, '../../../', plugin)
        })
    }

    if (process.env.HOME && !argv.disableHomePlugin) {
      // process home npm plugins
      glob
        .sync(topPluginPattern, {
          cwd: path.resolve(process.env.HOME, `.${scriptName}`, 'node_modules')
        })
        .map(function(plugin): void {
          if (process.env.HOME) {
            plugins[plugin] = path.resolve(process.env.HOME, `.${scriptName}`, 'node_modules', plugin)
          }
        })

      // process home npm scope plugins
      glob
        .sync(orgPluginPattern, {
          cwd: path.resolve(process.env.HOME, `.${scriptName}`, 'node_modules')
        })
        .map(function(plugin): void {
          if (process.env.HOME) {
            plugins[plugin] = path.resolve(process.env.HOME, `.${scriptName}`, 'node_modules', plugin)
          }
        })
    }

    // process cwd npm plugins
    glob
      .sync(topPluginPattern, {
        cwd: path.resolve(process.cwd(), 'node_modules')
      })
      .map(function(plugin) {
        plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
      })

    // process cwd npm scope plugins
    glob
      .sync(orgPluginPattern, {
        cwd: path.resolve(process.cwd(), 'node_modules')
      })
      .map(function(plugin) {
        plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
      })

    const config = getApplicationConfig()
    if (fs.existsSync(config.pluginDir)) {
      // process local plugins
      glob
        .sync(topPluginPattern, {
          cwd: path.resolve(process.cwd(), config.pluginDir)
        })
        .map(function(plugin) {
          plugins[plugin] = path.resolve(process.cwd(), config.pluginDir, plugin)
        })
    }

    // process plugin project
    if (fs.existsSync(path.resolve(process.cwd(), 'package.json'))) {
      const pkgConfig = require(path.resolve(process.cwd(), 'package.json'))
      const matchPluginProject = pluginPrefix.map(prefix => `${prefix}-plugin-`).join('|')
      const regExp = new RegExp(`^(@[^/]+\/)?(${matchPluginProject})`)
      if (pkgConfig.name && regExp.test(pkgConfig.name)) {
        plugins[pkgConfig.name] = path.resolve(process.cwd())
      }
    }

    cachedInstance.set('plugins', plugins)
  }

  return plugins
}

/**
 * Get application zignis config only.
 */
const getApplicationConfig = function(cwd: string | undefined = undefined) {
  let argv: any = cachedInstance.get('argv') || {}
  let scriptName = argv && argv.scriptName ? argv.scriptName : 'zignis'

  try {
    const configPath = findUp.sync([`.${scriptName}rc.json`], {
      cwd
    })
    let applicationConfig = configPath ? require(configPath) : {}
    applicationConfig.applicationDir = configPath ? path.dirname(configPath) : cwd ? cwd : process.cwd()
    if (fs.existsSync(path.resolve(applicationConfig.applicationDir, 'package.json'))) {
      let packageInfo = require(path.resolve(applicationConfig.applicationDir, 'package.json'))

      if (packageInfo.name) {
        applicationConfig.name = packageInfo.name
      }

      if (packageInfo.version) {
        applicationConfig.version = packageInfo.version
      }

      // args > package > current rc
      if (packageInfo.rc) {
        applicationConfig = Object.assign({}, applicationConfig, packageInfo.rc)
      }
      if (packageInfo[scriptName]) {
        applicationConfig = Object.assign({}, applicationConfig, packageInfo[scriptName])
      }
    }
    return applicationConfig
  } catch (e) {
    error(`Application .${scriptName}rc.json can not be parsed!`)
  }
}

/**
 * Get commbined config from whole environment.
 */
const getCombinedConfig = function(): { [propName: string]: any } {
  let argv: any = cachedInstance.get('argv') || {}
  let scriptName = argv && argv.scriptName ? argv.scriptName : 'zignis'
  let combinedConfig: { [propName: string]: any } = cachedInstance.get('combinedConfig') || {}
  let pluginConfigs: { [propName: string]: any } = {}

  if (_.isEmpty(combinedConfig)) {
    if (process.env.HOME && fs.existsSync(path.resolve(process.env.HOME, `.${scriptName}`, `.${scriptName}rc.json`))) {
      combinedConfig = require(path.resolve(process.env.HOME, `.${scriptName}`, `.${scriptName}rc.json`))
    } else {
      combinedConfig = {}
    }

    const plugins = getAllPluginsMapping()
    Object.keys(plugins).map(plugin => {
      if (fs.existsSync(path.resolve(plugins[plugin], `.${scriptName}rc.json`))) {
        const pluginConfig = require(path.resolve(plugins[plugin], `.${scriptName}rc.json`))
        combinedConfig = _.merge(combinedConfig, pluginConfig)
        pluginConfigs[plugin] = pluginConfig
      }
    })

    const configPath = findUp.sync([`.${scriptName}rc.json`])
    let rcConfig = configPath ? require(configPath) : {}

    combinedConfig = _.merge(combinedConfig, rcConfig)
    combinedConfig.pluginConfigs = pluginConfigs
    cachedInstance.set('combinedConfig', combinedConfig)
  }

  return combinedConfig || {}
}

/**
 * Print message with format and color.
 * @param {mix} message Message to log
 */
const log = function(message: any) {
  if (_.isArray(message) || _.isObject(message)) {
    console.log(colorize(stringify(message)))
  } else {
    console.log(message)
  }
}

/**
 * Print error message, and exit process.
 * @param {mix} message Error message to log
 * @param {string} label Error log label
 * @param {integer} errorCode Error code
 */
const error = function(message: any, exit = true, errorCode = 1) {
  message = _.isString(message) ? { message } : message
  console.log(emoji.get(message.emoji || 'x'), ' ', chalk.red(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Print warn message with yellow color.
 * @param {mix} message Error message to log
 */
const warn = function(message: any, exit = false, errorCode = 0) {
  message = _.isString(message) ? { message } : message
  console.log(chalk.yellow(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Print info message with green color.
 * @param {mix} message Error message to log
 */
const info = function(message: any, exit = false, errorCode = 0) {
  message = _.isString(message) ? { message } : message
  console.log(chalk.cyan(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Print success message with green color.
 * @param {mix} message Error message to log
 */
const success = function(message: any, exit = false, errorCode = 0) {
  message = _.isString(message) ? { message } : message
  console.log(chalk.green(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Compute md5.
 * @param {string} s
 */
const md5 = function(s: string) {
  return crypto
    .createHash('md5')
    .update(s, 'utf8')
    .digest('hex')
}

/**
 * Split input by comma and blank.
 * @example
 * const = Utils.splitComma('a, b , c,d')
 * @param {string} input
 * @returns {array} input separated by comma
 */
const splitComma = function(input: string) {
  return splitByChar(input, ',')
}

/**
 * Split input by a specific char and blank.
 * @example
 * const = Utils.splitByChar('a, b , c=d', '=')
 * @param {string} input
 * @returns {array} input separated by comma
 */
const splitByChar = function(input: string, char: string) {
  const exp = new RegExp(char, 'g')
  return input.replace(exp, ' ').split(/\s+/)
}

/**
 * Print a simple table.
 * A table style for `zignis status`, if you don't like this style, can use Utils.table
 * @param {array} columns Table columns
 * @param {string} caption Table caption
 * @param {object} borderOptions Border options
 */
const outputTable = function(columns: string[][], caption: string, borderOptions = {}) {
  // table config
  const config = {
    drawHorizontalLine: () => {
      return false
    },
    columnDefault: {
      paddingLeft: 2,
      paddingRight: 1
    },
    border: Object.assign(getBorderCharacters(`void`), { bodyJoin: `:` }, borderOptions)
  }

  if (caption) {
    info(caption)
  }
  console.log(table(columns, config))
}

/**
 * Parse packages from yargs option
 * @param {*} input yarns option input, could be string or array
 * @returns {array} Package list
 */
const parsePackageNames = function(input: string | string[]) {
  if (_.isString(input)) {
    return splitComma(input)
  }

  if (_.isArray(input)) {
    return _.flatten(input.map(item => splitComma(item)))
  }

  return []
}

/**
 * Load any package's package.json
 * @param {string} pkg package name
 * @param {array} paths search paths
 */
const loadPackageInfo = function(pkg: string | undefined = undefined, paths = []): any {
  const packagePath = findUp.sync('package.json', {
    cwd: pkg ? path.dirname(require.resolve(pkg, { paths })) : process.cwd()
  })
  return packagePath ? require(packagePath) : {}
}

/**
 * Load core package.json
 */
const loadCorePackageInfo = function(): any {
  const packagePath = findUp.sync('package.json', {
    cwd: path.resolve('../../', __dirname)
  })
  return packagePath ? require(packagePath) : {}
}

/**
 * Execute command, because npm install running info can not be catched by shelljs, temporarily use this one
 * @param {string} command Command to exec
 * @param {object} options Options stdio default is [0, 1, 2]
 */
const exec = function(command: string, options: any = {}): any {
  debugCore({ command, options })
  if (!options.stdio) {
    options.stdio = [0, 1, 2]
  }
  return execSync(command, options)
}

/**
 * Get current node env setting
 *
 * You can change the node-env-key in command args or zignis rc file
 */
const getNodeEnv = () => {
  const argv: any = cachedInstance.get('argv') || {}
  const nodeEnvKey = argv.nodeEnvKey || argv.nodeEnv || 'NODE_ENV'
  return process.env[nodeEnvKey] || 'development'
}

/**
 * Shortcut for checking if or not current env is production
 */
const isProduction = () => getNodeEnv() === 'production'

/**
 * Shortcut for checking if or not current env is development
 */
const isDevelopment = () => getNodeEnv() === 'development'

/**
 * Sleep a while of ms
 * @param {integer} ms
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const delay = sleep

/**
 * Zignis utils functions and references to common modules.
 * @module Utils
 */
export {
  // npm packages
  /** [lodash](https://www.npmjs.com/package/lodash) reference, check [doc](https://lodash.com/docs). */
  _,
  /** [chalk](https://www.npmjs.com/package/chalk) reference */
  chalk,
  /** [table](https://www.npmjs.com/package/table) reference */
  table,
  /** [day.js](https://www.npmjs.com/package/dayjs) reference, check [api](https://github.com/iamkun/dayjs/blob/HEAD/docs/en/API-reference.md) documentation. */
  day,
  /** [json-colorizer](https://www.npmjs.com/package/json-colorizer) reference */
  colorize,
  /** [json-stringify-pretty-compact](https://www.npmjs.com/package/json-stringify-pretty-compact) reference. */
  stringify,
  /** [glob](https://www.npmjs.com/package/glob) reference. */
  glob,
  /** [find-up](https://www.npmjs.com/package/find-up) reference. */
  findUp,
  /** [co](https://www.npmjs.com/package/co) reference. */
  co,
  /** [shelljs](https://www.npmjs.com/package/shelljs) reference. */
  shell,
  /** [debug](https://www.npmjs.com/package/debug) reference. */
  debug,
  /** [fuzzy](https://www.npmjs.com/package/fuzzy) reference. */
  fuzzy,
  /** [inquirer](https://www.npmjs.com/package/inquirer) reference, with autocomplete plugin */
  inquirer,
  /** [fs-extra](https://www.npmjs.com/package/fs-extra) reference */
  fs,
  /** [randomatic](https://www.npmjs.com/package/randomatic) reference */
  randomatic,
  /** [node-emoji](https://www.npmjs.com/package/node-emoji) reference */
  emoji,
  /** [get-stdin](https://www.npmjs.com/package/get-stdin) reference */
  getStdin,
  /** [node-cache](https://www.npmjs.com/package/node-cache) reference */
  NodeCache,
  // custom functions
  md5,
  delay,
  splitComma,
  splitByChar,
  log,
  warn,
  info,
  success,
  dd,
  dump,
  error,
  outputTable,
  invokeHook,
  extendSubCommand,
  getAllPluginsMapping,
  getCombinedConfig,
  getApplicationConfig,
  parsePackageNames,
  loadPackageInfo,
  loadCorePackageInfo,
  exec,
  sleep,
  getInternalCache,
  getCache,
  getNodeEnv,
  isProduction,
  isDevelopment
}
