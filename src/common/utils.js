const path = require('path')
const fs = require('fs')
const glob = require('glob')
const table = require('table').table
const findUp = require('find-up')
const _ = require('lodash')

/**
 * Get all plugins path mapping
 * Cwd plugins can override local plugin if use same name
 */
const getAllPluginsMapping = function () {
  const config = getApplicationConfig()
  const plugins = {}

  // process core plugins
  glob.sync('zignis-plugin-*', {
    cwd: path.resolve(__dirname, '../plugins')
  }).map(function (plugin) {
    plugins[plugin] = path.resolve(__dirname, '../plugins', plugin)
  })

  // process npm plugins
  glob.sync('zignis-plugin-*', {
    cwd: path.resolve(process.cwd(), 'node_modules')
  }).map(function (plugin) {
    plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
  })

  if (fs.existsSync(config.pluginDir)) {
    // process local plugins
    glob.sync('zignis-plugin-*', {
      cwd: path.resolve(process.cwd(), config.pluginDir)
    }).map(function (plugin) {
      plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
    })
  }

  return plugins
}

/**
 * Get only application config
 */
const getApplicationConfig = function () {
  const configPath = findUp.sync(['.zignisrc.json'])
  return configPath ? JSON.parse(fs.readFileSync(configPath)) : {}
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
    let rcConfig = configPath ? JSON.parse(fs.readFileSync(configPath)) : {}

    pluginConfigs = Object.assign({}, pluginConfigs, rcConfig)
  }

  return pluginConfigs
}

/**
 * Output a table
 * @param {*} columns table columns
 */
const outputTable = function (columns) {
  // table config
  const config = {
    border: {
      topBody: ``,
      topJoin: ``,
      topLeft: ``,
      topRight: ``,

      bottomBody: ``,
      bottomJoin: ``,
      bottomLeft: ``,
      bottomRight: ``,

      bodyLeft: ``,
      bodyRight: ``,
      bodyJoin: `:`,

      joinBody: ``,
      joinLeft: ``,
      joinRight: ``,
      joinJoin: ``
    }
  }

  console.log(table(columns, config))
}

module.exports = {
  outputTable,
  getAllPluginsMapping,
  getCombinedConfig,
  getApplicationConfig
}
