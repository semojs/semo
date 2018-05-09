const path = require('path')
const fs = require('fs')
const Utils = require('../common/utils')

exports.command = 'status [key]'
exports.aliases = 'st'
exports.desc = 'Show Zignis status'

exports.builder = function (yargs) {
}

exports.handler = function (argv) {
  console.log(argv)
  const plugins = Utils.getAllPluginsMapping()
  const columns = []

  switch (argv.key) {
    case 'plugins':
      Object.keys(plugins).map((plugin) => columns.push([plugin, plugins[plugin]]))
      break
    default:
      if (argv.key) {

      } else {
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
          home: process.env.HOME,
          cwd: process.cwd(),
          plugins: Object.keys(plugins).join(', ')
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
      }
  }

  Utils.outputTable(columns)
}
