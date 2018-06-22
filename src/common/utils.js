const path = require('path')
const fs = require('fs')
const glob = require('glob')
const { table, getBorderCharacters } = require('table')
const findUp = require('find-up')
const _ = require('lodash')
const colorize = require('json-colorizer')
const stringify = require('json-stringify-pretty-compact')
const chalk = require('chalk')

const invokeHook = function * (hook) {
  const plugins = getAllPluginsMapping()
  let pluginsReturn = {}
  for (let i = 0; i < Object.keys(plugins).length; i++) {
    let plugin = Object.keys(plugins)[i]
    try {
      const loadedPlugin = require(path.resolve(plugins[plugin]))
      if (loadedPlugin[hook] && typeof loadedPlugin[hook] === 'function') {
        let pluginReturn = yield loadedPlugin[hook](pluginsReturn) || {}
        pluginsReturn = Object.assign(pluginsReturn, pluginReturn)
      }
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw new Error(error)
      }
    }
  }

  return pluginsReturn
}

/**
 * Extend Sub Command
 * @param {String} command 
 * @param {String} module 
 * @param {Object} yargs 
 */
const extendSubCommand = function (command, module, yargs) {
  const plugins = getAllPluginsMapping()
  const config = getCombinedConfig()

  // load default commands
  yargs.commandDir(`../commands/${command}`)
  // yargs.commandDir(path.resolve(__dirname, `../commands/${command}`))

  // Load plugin commands
  if (plugins) {
    Object.keys(plugins).map(function (plugin) {
      if (fs.existsSync(path.resolve(plugins[plugin], `src/extends/${module}/commands`, command))) {
        yargs.commandDir(path.resolve(plugins[plugin], `src/extends/${module}/commands`, command))
      }
    })
  }

  // Load application commands
  if (config.extendDir && fs.existsSync(path.resolve(process.cwd(), `${config.extendDir}/${module}/commands`, command))) {
    yargs.commandDir(path.resolve(process.cwd(), `${config.extendDir}/${module}/commands`, command))
  }
}

/**
 * log method
 * @param {mix} message message to log
 * @param {String} label label for describing message
 */
const log = function (message, label = '') {
  if (_.isArray(message) || _.isObject(message)) {
    console.log(colorize(stringify(message)), label)
  } else {
    console.log(message)
  }
}

/**
 * Get all plugins path mapping
 * Cwd plugins can override local plugin if use same name
 */
const getAllPluginsMapping = function () {
  const plugins = {}

  // process core plugins
  glob.sync('zignis-plugin-*', {
    cwd: path.resolve(__dirname, '../plugins')
  }).map(function (plugin) {
    plugins[plugin] = path.resolve(__dirname, '../plugins', plugin)
  })

  // process home npm plugins
  glob.sync('zignis-plugin-*', {
    cwd: path.resolve(process.env.HOME, '.zignis', 'node_modules')
  }).map(function (plugin) {
    if (fs.existsSync(path.resolve(process.env.HOME, '.zignis', 'node_modules', plugin))) {
      plugins[plugin] = path.resolve(process.env.HOME, '.zignis', 'node_modules', plugin)
    }
  })

  // process npm plugins
  glob.sync('zignis-plugin-*', {
    cwd: path.resolve(process.cwd(), 'node_modules')
  }).map(function (plugin) {
    if (fs.existsSync(path.resolve(process.cwd(), 'node_modules', plugin))) {
      plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
    }
  })

  const config = getApplicationConfig()
  if (fs.existsSync(config.pluginDir)) {
    // process local plugins
    glob.sync('zignis-plugin-*', {
      cwd: path.resolve(process.cwd(), config.pluginDir)
    }).map(function (plugin) {
      if (fs.existsSync(path.resolve(process.cwd(), config.pluginDir, plugin))) {
        plugins[plugin] = path.resolve(process.cwd(), config.pluginDir, plugin)
      }
    })
  }

  return plugins
}

/**
 * Get only application config
 */
const getApplicationConfig = function () {
  try {
    const configPath = findUp.sync(['.zignisrc.json'])
    return configPath ? require(configPath) : {}
  } catch (e) {
    console.log(chalk.red(`.zignisrc format has bad format.`))
  }
}

/**
 * Get commbined config
 */
const getCombinedConfig = function () {
  let pluginConfigs = null

  if (_.isNil(pluginConfigs)) {
    pluginConfigs = {}
    const plugins = getAllPluginsMapping()
    Object.keys(plugins).map((plugin) => {
      if (fs.existsSync(path.resolve(plugins[plugin], '.zignisrc.json'))) {
        const pluginConfig = require(path.resolve(plugins[plugin], '.zignisrc.json'))
        pluginConfigs = Object.assign({}, pluginConfigs, pluginConfig)
      }
    })

    const configPath = findUp.sync(['.zignisrc.json'])
    let rcConfig = configPath ? require(configPath) : {}

    pluginConfigs = Object.assign({}, pluginConfigs, rcConfig)
  }

  return pluginConfigs
}

/**
 * Output a table
 * @param {*} columns table columns
 */
const outputTable = function (columns, caption) {
  // table config
  const config = {
    drawHorizontalLine: () => {
      return false
    },
    columnDefault: {
      paddingLeft: 2,
      paddingRight: 1
    },
    border: Object.assign(getBorderCharacters(`void`), { bodyJoin: `:` })
  }

  if (caption) {
    console.log(chalk.green(caption))
  }
  console.log(table(columns, config))
}

module.exports = {
  _,
  invokeHook,
  extendSubCommand,
  log,
  outputTable,
  getAllPluginsMapping,
  getCombinedConfig,
  getApplicationConfig
}
