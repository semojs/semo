const path = require('path')
const fs = require('fs')
const Utils = require('../common/utils')

exports.command = 'status [key]'
exports.aliases = 'st'
exports.desc = 'Show Zignis status'

exports.builder = function (yargs) {
}

exports.handler = function (argv) {
  const plugins = Utils.getAllPluginsMapping()
  const pluginsColumns = []
  const columns = []

  Object.keys(plugins).map((plugin) => pluginsColumns.push([plugin, plugins[plugin]]))

  let kvs = {}

  if (fs.existsSync(path.resolve(process.cwd(), 'package.json'))) {
    const pkgConfig = require(path.resolve(process.cwd(), 'package.json'))
    if (pkgConfig && pkgConfig.version) {
      kvs.version = pkgConfig.version
    }
  }

  kvs = Object.assign(kvs, {
    platform: process.platform,
    arch: process.arch,
    hostname: require('os').hostname(),
    node: process.version,
    zignis: require(path.resolve(__dirname, '../../package.json')).version,
    home: process.env.HOME,
    cwd: process.cwd()
  })

  Object.keys(plugins).map((plugin) => {
    if (fs.existsSync(path.resolve(plugins[plugin], 'index.js'))) {
      const loadedPlugin = require(path.resolve(plugins[plugin], 'index.js'))
      if (typeof loadedPlugin.status === 'function') {
        kvs = Object.assign(kvs, loadedPlugin.status())
      }
    }
  })

  Object.keys(kvs).map((k) => columns.push([k, kvs[k]]))

  Utils.outputTable(columns)

  if (pluginsColumns.length > 0) {
    Utils.outputTable(pluginsColumns, 'Plugins:')
  }
}
