const crypto = require('crypto')
const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')
const { table, getBorderCharacters } = require('table')
const findUp = require('find-up')
const _ = require('lodash')
const colorize = require('json-colorizer')
const stringify = require('json-stringify-pretty-compact')
const chalk = require('chalk')
const randomatic = require('randomatic')
const day = require('dayjs')
const co = require('co')
const shell = require('shelljs')
const debug = require('debug')
const debugCore = debug('zignis-core')
const inquirer = require('inquirer')
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))
const fuzzy = require('fuzzy')
const { execSync } = require('child_process')
const objectHash = require('node-object-hash')
const { hash } = objectHash({ sort: true })
const emoji = require('node-emoji')
const { dd, dump } = require('dumper.js')
const getStdin = require('get-stdin')
const NodeCache = require('node-cache')

let cacheInstance
/**
 * Get Zignis internal cache instance
 * @returns {NodeCache}
 */
const getInternalCache = function () {
  if (!cacheInstance) {
    cacheInstance = new NodeCache({
      useClones: false
    })
  }
  return cacheInstance
}
cacheInstance = getInternalCache()

/**
 * Get Zignis cache instance by namespace
 * @param {string} namespace
 * @returns {NodeCache}
 */
const getCache = function (namespace) {
  let cacheNamespaces = cacheInstance.get('cacheNamespaces')

  if (!cacheNamespaces) {
    cacheNamespaces = {}
  }

  if (!cacheNamespaces[namespace]) {
    cacheNamespaces[namespace] = new NodeCache({
      useClones: false
    })
    cacheInstance.set('cacheNamespaces', cacheNamespaces)
  }
  return cacheNamespaces[namespace]
}

/**
 * Run hook in all valid plugins and return the combined results.
 * Plugins implement hook in `module.exports`, could be generator function or promise function or non-function
 * For non-function, it will be used as hook data directly, likely to be returned by function
 * @example
 * const hookReturn = yield Utils.invokeHook('hook')
 * @param {string} hook Hook name, suggest plugin defined hook include a prefix, e.g. `zhike:hook`
 * @param {string} options Options
 * @param {string} options.mode Hook mode, could be `assign`, `merge`, `push`, `replace`, `group`, default is assign.
 * @param {bool} options.useCache If or not use cached hook result
 * @param {array} options.include set plugins to be used in invoking
 * @param {array} options.exclude set plugins not to be used in invoking, same ones options.exclude take precedence
 * @param {array} options.opts opts will be sent to hook implementation
 */
const invokedHookCache = {}
const invokeHook = function (hook, options = {}) {
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

  return co(function * () {
    const cacheKey = `${hook}:${hash(options)}`
    if (options.useCache && invokedHookCache[cacheKey]) {
      return invokedHookCache[cacheKey]
    }

    // Make Zignis core supporting hook invocation
    const plugins = Object.assign(
      {},
      {
        zignis: path.resolve(__dirname, '../../')
      },
      getAllPluginsMapping()
    )

    // Make Application supporting hook invocation
    const appConfig = getApplicationConfig()
    if (appConfig && appConfig.name !== 'zignis' && !plugins[appConfig.name] && appConfig.applicationDir) {
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
        }

        // hookDir
        if (fs.existsSync(path.resolve(plugins[plugin], '.zignisrc.json'))) {
          const zignisConfig = require(path.resolve(plugins[plugin], '.zignisrc.json'))
          if (zignisConfig.hookDir && fs.existsSync(path.resolve(plugins[plugin], zignisConfig.hookDir, 'index.js'))) {
            pluginEntry = path.join(zignisConfig.hookDir, 'index.js')
          }
        }

        // For application, do not accept default index.js
        if (plugin === 'application' && pluginEntry === 'index.js') {
          continue
        }

        if (fs.existsSync(path.resolve(plugins[plugin], pluginEntry))) {
          debugCore(`zignis invoke hook: ${hook}, plugin: ${plugin}`)
          const loadedPlugin = require(path.resolve(plugins[plugin], pluginEntry))
          if (loadedPlugin[hook]) {
            let pluginReturn
            if (_.isFunction(loadedPlugin[hook])) {
              pluginReturn = yield loadedPlugin[hook](options.opts, pluginsReturn) || {}
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
          error(e.message, 0)
        }
      }
    }

    invokedHookCache[cacheKey] = pluginsReturn

    return pluginsReturn
  }).catch(e => {
    throw new Error(e.stack)
  })
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
const extendSubCommand = function (command, module, yargs, basePath) {
  const plugins = getAllPluginsMapping()
  const config = getCombinedConfig()

  // load default commands
  const currentCommand = command.split('/').pop()
  if (fs.existsSync(path.resolve(basePath, currentCommand))) {
    yargs.commandDir(path.resolve(basePath, currentCommand))
  }

  // Load plugin commands
  if (plugins) {
    Object.keys(plugins).map(function (plugin) {
      if (fs.existsSync(path.resolve(plugins[plugin], `src/extends/${module}/src/commands`, command))) {
        yargs.commandDir(path.resolve(plugins[plugin], `src/extends/${module}/src/commands`, command))
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
const getAllPluginsMapping = function () {
  let plugins = cacheInstance.get('plugins')
  if (!plugins) {
    plugins = {}

    // process core plugins
    glob
      .sync('zignis-plugin-*', {
        cwd: path.resolve(__dirname, '../plugins')
      })
      .map(function (plugin) {
        plugins[plugin] = path.resolve(__dirname, '../plugins', plugin)
      })

    // process core same directory plugins
    glob
      .sync('zignis-plugin-*', {
        cwd: path.resolve(__dirname, '../../../')
      })
      .map(function (plugin) {
        plugins[plugin] = path.resolve(__dirname, '../../../', plugin)
      })

    // process core same directory npm plugins
    glob
      .sync('@*/zignis-plugin-*', {
        cwd: path.resolve(__dirname, '../../../')
      })
      .map(function (plugin) {
        if (fs.existsSync(path.resolve(__dirname, '../../../', plugin))) {
          plugins[plugin] = path.resolve(__dirname, '../../../', plugin)
        }
      })

    // process home npm plugins
    glob
      .sync('zignis-plugin-*', {
        cwd: path.resolve(process.env.HOME, '.zignis', 'node_modules')
      })
      .map(function (plugin) {
        if (fs.existsSync(path.resolve(process.env.HOME, '.zignis', 'node_modules', plugin))) {
          plugins[plugin] = path.resolve(process.env.HOME, '.zignis', 'node_modules', plugin)
        }
      })

    // process home npm scope plugins
    glob
      .sync('@*/zignis-plugin-*', {
        cwd: path.resolve(process.env.HOME, '.zignis', 'node_modules')
      })
      .map(function (plugin) {
        if (fs.existsSync(path.resolve(process.env.HOME, '.zignis', 'node_modules', plugin))) {
          plugins[plugin] = path.resolve(process.env.HOME, '.zignis', 'node_modules', plugin)
        }
      })

    // process cwd npm plugins
    glob
      .sync('zignis-plugin-*', {
        cwd: path.resolve(process.cwd(), 'node_modules')
      })
      .map(function (plugin) {
        if (fs.existsSync(path.resolve(process.cwd(), 'node_modules', plugin))) {
          plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
        }
      })

    // process cwd npm scope plugins
    glob
      .sync('@*/zignis-plugin-*', {
        cwd: path.resolve(process.cwd(), 'node_modules')
      })
      .map(function (plugin) {
        if (fs.existsSync(path.resolve(process.cwd(), 'node_modules', plugin))) {
          plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
        }
      })

    const config = getApplicationConfig()
    if (fs.existsSync(config.pluginDir)) {
      // process local plugins
      glob
        .sync('zignis-plugin-*', {
          cwd: path.resolve(process.cwd(), config.pluginDir)
        })
        .map(function (plugin) {
          if (fs.existsSync(path.resolve(process.cwd(), config.pluginDir, plugin))) {
            plugins[plugin] = path.resolve(process.cwd(), config.pluginDir, plugin)
          }
        })
    }

    // process plugin project
    if (fs.existsSync(path.resolve(process.cwd(), 'package.json'))) {
      const pkgConfig = require(path.resolve(process.cwd(), 'package.json'))
      if (pkgConfig.name && /^(@[^/]+\/)?zignis-plugin-/.test(pkgConfig.name)) {
        plugins[pkgConfig.name] = path.resolve(process.cwd())
      }
    }

    cacheInstance.set('plugins', plugins)
  }

  return plugins
}

/**
 * Get application zignis config only.
 */
const getApplicationConfig = function (cwd) {
  try {
    const configPath = findUp.sync(['.zignisrc.json'], {
      cwd
    })
    let applicationConfig = configPath ? require(configPath) : {}
    if (configPath) {
      applicationConfig.applicationDir = path.dirname(configPath)
      if (fs.existsSync(path.resolve(applicationConfig.applicationDir, 'package.json'))) {
        applicationConfig = Object.assign(
          {},
          applicationConfig,
          require(path.resolve(applicationConfig.applicationDir, 'package.json'))
        )
      }
    }
    return applicationConfig
  } catch (e) {
    error(`Application .zignisrc.json can not be parsed!`)
  }
}

/**
 * Get commbined config from whole environment.
 */
const getCombinedConfig = function () {
  let pluginConfigs = null

  if (_.isNil(pluginConfigs)) {
    if (fs.existsSync(path.resolve(process.env.HOME, '.zignis', '.zignisrc.json'))) {
      pluginConfigs = require(path.resolve(process.env.HOME, '.zignis', '.zignisrc.json'))
    } else {
      pluginConfigs = {}
    }

    const plugins = getAllPluginsMapping()
    Object.keys(plugins).map(plugin => {
      if (fs.existsSync(path.resolve(plugins[plugin], '.zignisrc.json'))) {
        const pluginConfig = require(path.resolve(plugins[plugin], '.zignisrc.json'))
        pluginConfigs = _.merge(pluginConfigs, pluginConfig)
      }
    })

    const configPath = findUp.sync(['.zignisrc.json'])
    let rcConfig = configPath ? require(configPath) : {}

    pluginConfigs = _.merge(pluginConfigs, rcConfig)
  }

  return pluginConfigs
}

/**
 * Print message with format and color.
 * @param {mix} message Message to log
 */
const log = function (message) {
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
const error = function (message, exit = true, errorCode = 1) {
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
const warn = function (message, exit = false, errorCode = 0) {
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
const info = function (message, exit = false, errorCode = 0) {
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
const success = function (message, exit = false, errorCode = 0) {
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
const md5 = function (s) {
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
const splitComma = function (input) {
  return splitByChar(input, ',')
}

/**
 * Split input by a specific char and blank.
 * @example
 * const = Utils.splitByChar('a, b , c=d', '=')
 * @param {string} input
 * @returns {array} input separated by comma
 */
const splitByChar = function (input, char) {
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
const outputTable = function (columns, caption, borderOptions = {}) {
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
const parsePackageNames = function (input) {
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
const loadPackageInfo = function (pkg, paths) {
  const packagePath = findUp.sync('package.json', {
    cwd: pkg ? path.dirname(require.resolve(pkg, { paths })) : process.cwd()
  })
  return packagePath ? require(packagePath) : {}
}

/**
 * Execute command, because npm install running info can not be catched by shelljs, temporarily use this one
 * @param {string} command Command to exec
 * @param {object} options Options stdio default is [0, 1, 2]
 */
const exec = function (command, options = {}) {
  if (!options.stdio) {
    options.stdio = [0, 1, 2]
  }
  return execSync(command, options)
}

/**
 * Sleep a while of ms
 * @param {integer} ms
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const delay = sleep

/**
 * Zignis utils functions and references to common modules.
 * @module Utils
 */
module.exports = {
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
  exec,
  sleep,
  getInternalCache,
  getCache
}
