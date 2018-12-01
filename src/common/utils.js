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
 * @param {string} hook
 */
const invokeHook = function*(hook) {
  const plugins = getAllPluginsMapping()
  let pluginsReturn = {}
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
        if (loadedPlugin[hook] && typeof loadedPlugin[hook] === 'function') {
          let pluginReturn = yield loadedPlugin[hook](pluginsReturn) || {}
          pluginsReturn = Object.assign(pluginsReturn, pluginReturn)
        }
      }
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw new Error(error)
      } else {
        console.log(error.message)
      }
    }
  }

  return pluginsReturn
}

/**
 * Extend Sub Command, make it can be extended by other plugins.
 * Often set basePath to `__dirname`.
 * @param {String} command
 * @param {String} module
 * @param {Object} yargs
 * @param {String} basePath
 */
const extendSubCommand = function(command, module, yargs, basePath) {
  const plugins = getAllPluginsMapping()
  const config = getCombinedConfig()

  // load default commands
  yargs.commandDir(path.resolve(basePath, command))

  // Load plugin commands
  if (plugins) {
    Object.keys(plugins).map(function(plugin) {
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
 * Print message with format and color.
 * @param {mix} message message to log
 * @param {string} label label for describing message
 */
const log = function(message, label = '') {
  if (label) {
    console.log(label)
  }

  if (_.isArray(message) || _.isObject(message)) {
    console.log(colorize(stringify(message)))
  } else {
    console.log(message)
  }
}

/**
 * Print error message, and exit process.
 * @param {mix} message error message to log
 * @param {string} label error log label
 * @param {integer} errorCode error code
 */
const error = function(message, label = '', errorCode = 1) {
  if (label) {
    console.log(chalk.red(label))
  }

  console.log(chalk.red(message))
  process.exit(errorCode)
}

/**
 * Print warn message with yellow color.
 * @param {mix} message error message to log
 * @param {string} label error log label
 */
const warn = function(message, label = '') {
  if (label) {
    console.log(chalk.yellow(label))
  }

  console.log(chalk.yellow(message))
}

/**
 * Compute md5.
 * @param {string} s
 */
const md5 = function(s) {
  return crypto
    .createHash('md5')
    .update(s, 'utf8')
    .digest('hex')
}

/**
 * Delay a while.
 * @param {integer} ms
 */
const delay = function(ms) {
  return new Promise(function(resolve) {
    return setTimeout(resolve, ms)
  })
}

/**
 * Split input by comma and blank.
 * @param {string} input
 * @returns {array} input separated by comma
 */
const splitComma = function(input) {
  return input.replace(/,/g, ' ').split(/\s+/)
}

/**
 * Get all plugins path mapping.
 * Same name plugin would be overriden orderly
 */
const getAllPluginsMapping = function() {
  const plugins = {}

  // process core plugins
  glob
    .sync('zignis-plugin-*', {
      cwd: path.resolve(__dirname, '../plugins')
    })
    .map(function(plugin) {
      plugins[plugin] = path.resolve(__dirname, '../plugins', plugin)
    })

  // process same directory plugins
  glob
    .sync('zignis-plugin-*', {
      cwd: path.resolve(__dirname, '../../../')
    })
    .map(function(plugin) {
      plugins[plugin] = path.resolve(__dirname, '../../../', plugin)
    })

  // process home npm plugins
  glob
    .sync('zignis-plugin-*', {
      cwd: path.resolve(process.env.HOME, '.zignis', 'node_modules')
    })
    .map(function(plugin) {
      if (fs.existsSync(path.resolve(process.env.HOME, '.zignis', 'node_modules', plugin))) {
        plugins[plugin] = path.resolve(process.env.HOME, '.zignis', 'node_modules', plugin)
      }
    })

  // process home npm scope plugins
  glob
    .sync('@*/zignis-plugin-*', {
      cwd: path.resolve(process.env.HOME, '.zignis', 'node_modules')
    })
    .map(function(plugin) {
      if (fs.existsSync(path.resolve(process.env.HOME, '.zignis', 'node_modules', plugin))) {
        plugins[plugin] = path.resolve(process.env.HOME, '.zignis', 'node_modules', plugin)
      }
    })

  // process cwd npm plugins
  glob
    .sync('zignis-plugin-*', {
      cwd: path.resolve(process.cwd(), 'node_modules')
    })
    .map(function(plugin) {
      if (fs.existsSync(path.resolve(process.cwd(), 'node_modules', plugin))) {
        plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
      }
    })

  // process cwd npm scope plugins
  glob
    .sync('@*/zignis-plugin-*', {
      cwd: path.resolve(process.cwd(), 'node_modules')
    })
    .map(function(plugin) {
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
      .map(function(plugin) {
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
const getApplicationConfig = function() {
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
const getCombinedConfig = function() {
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
 * Print a simple table.
 * @param {*} columns table columns
 */
const outputTable = function(columns, caption, borderOptions = {}) {
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
  if (max < min) throw new Error('无效参数')
  return (Math.floor(seedrandom()() * (max - min + 1)) % (max - min + 1)) + min
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
  /** [day.js](https://www.npmjs.com/package/dayjs) reference, check [api](https://github.com/iamkun/dayjs/blob/HEAD/docs/en/API-reference.md) documentation.*/
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
  getApplicationConfig
}
