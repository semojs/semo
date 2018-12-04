const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const { table, getBorderCharacters } = require('table')
const findUp = require('find-up')
const _ = require('lodash')
const colorize = require('json-colorizer')
const stringify = require('json-stringify-pretty-compact')
const chalk = require('chalk')
const seedrandom = require('seedrandom')
const day = require('dayjs')
const co = require('co')
const shell = require('shelljs')

/**
 * Run hook in all valid plugins and return the combined results.
 * Plugins implement hook in `module.exports`, could be generator function or promise function or non-function
 * For non-function, it will be used as hook data directly, likely to be returned by function
 * @example
 * const hookReturn = yield Utils.invokeHook('hook')
 * @param {string} hook Hook name, suggest plugin defined hook include a prefix, e.g. `zhike:hook`
 * @param {string} mode Hook mode, could be `assign`, `merge`, `push`, `replace`, `group`, default is assign.
 */
const invokeHook = function (hook, mode = 'assign') {
  return co(function * () {
    const plugins = getAllPluginsMapping()
    const appConfig = getApplicationConfig()
    let pluginsReturn
    switch (mode) {
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

    for (let i = 0; i < Object.keys(plugins).length; i++) {
      let plugin = Object.keys(plugins)[i]
      try {
        let pluginEntry = 'index.js'
        if (fs.existsSync(path.resolve(plugins[plugin], 'package.json'))) {
          const pkgConfig = require(path.resolve(plugins[plugin], 'package.json'))
          if (pkgConfig.main) {
            pluginEntry = pkgConfig.main
          }
        }

        // 模块 entry 不存在则不加载
        if (fs.existsSync(path.resolve(plugins[plugin], pluginEntry))) {
          const loadedPlugin = require(path.resolve(plugins[plugin]))
          if (loadedPlugin[hook]) {
            let pluginReturn
            if (_.isFunction(loadedPlugin[hook])) {
              pluginReturn = yield loadedPlugin[hook](pluginsReturn) || {}
            } else {
              pluginReturn = loadedPlugin[hook]
            }

            switch (mode) {
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
    // Execute application level hook
    if (appConfig && appConfig.hookDir && fs.existsSync(path.resolve(appConfig.hookDir, 'index.js'))) {
      let plugin = 'application'
      try {
        const loadedPlugin = require(path.resolve(appConfig.hookDir, 'index.js'))
        if (loadedPlugin[hook]) {
          let pluginReturn
          if (_.isFunction(loadedPlugin[hook])) {
            pluginReturn = yield loadedPlugin[hook](pluginsReturn) || {}
          } else {
            pluginReturn = loadedPlugin[hook]
          }
          switch (mode) {
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
      } catch (e) {
        if (!e.code || e.code !== 'MODULE_NOT_FOUND') {
          throw new Error(e.stack)
        } else {
          error(e.message, 0)
        }
      }
    }

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
  yargs.commandDir(path.resolve(basePath, currentCommand))

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
  const plugins = {}

  // process core plugins
  glob
    .sync('zignis-plugin-*', {
      cwd: path.resolve(__dirname, '../plugins')
    })
    .map(function (plugin) {
      plugins[plugin] = path.resolve(__dirname, '../plugins', plugin)
    })

  // process same directory plugins
  glob
    .sync('zignis-plugin-*', {
      cwd: path.resolve(__dirname, '../../../')
    })
    .map(function (plugin) {
      plugins[plugin] = path.resolve(__dirname, '../../../', plugin)
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
    if (pkgConfig.name && pkgConfig.name.indexOf('zignis-plugin-') === 0) {
      plugins[pkgConfig.name] = path.resolve(process.cwd())
    }
  }

  return plugins
}

/**
 * Get application zignis config only.
 */
const getApplicationConfig = function () {
  try {
    const configPath = findUp.sync(['.zignisrc.json'])
    return configPath ? require(configPath) : {}
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

    if (fs.existsSync(path.resolve(process.cwd(), 'package.json'))) {
      pluginConfigs = _.merge(pluginConfigs, require(path.resolve(process.cwd(), 'package.json')))
    }

    const configPath = findUp.sync(['.zignisrc.json'])
    let rcConfig = configPath ? require(configPath) : {}

    pluginConfigs = _.merge(pluginConfigs, rcConfig)
  }

  return pluginConfigs
}

/**
 * Print message with format and color.
 * @param {mix} message Message to log
 * @param {string} label Label for describing message
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
const error = function (message, errorCode = 1) {
  console.log(chalk.red(message))
  if (errorCode) {
    process.exit(errorCode)
  }
}

/**
 * Print warn message with yellow color.
 * @param {mix} message Error message to log
 * @param {string} label Error log label
 */
const warn = function (message) {
  console.log(chalk.yellow(message))
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
 * Delay a while.
 * @param {integer} ms
 * @return {Promise}
 */
const delay = function (ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms)
  })
}

/**
 * Split input by comma and blank.
 * @example
 * const = Utils.splitComma('a, b , c,d')
 * @param {string} input
 * @returns {array} input separated by comma
 */
const splitComma = function (input) {
  return input.replace(/,/g, ' ').split(/\s+/)
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
    console.log(chalk.green(caption))
  }
  console.log(table(columns, config))
}

/**
 * Get a random number in a range.
 * @param {integer} min
 * @param {integer} max
 */
const random = (min, max) => {
  if (max < min) throw new Error('Input max must bigger than min')
  return (Math.floor(seedrandom()() * (max - min + 1)) % (max - min + 1)) + min
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
    cwd: path.dirname(require.resolve(pkg, { paths }))
  })
  return packagePath ? require(packagePath) : {}
}

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

  // custom functions
  md5,
  delay,
  splitComma,
  log,
  warn,
  error,
  random,
  outputTable,
  invokeHook,
  extendSubCommand,
  getAllPluginsMapping,
  getCombinedConfig,
  getApplicationConfig,
  parsePackageNames,
  loadPackageInfo
}
