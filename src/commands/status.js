const path = require('path')
const fs = require('fs')
const co = require('co')
const Utils = require('../common/utils')

exports.command = 'status'
exports.aliases = 'st'
exports.desc = 'Show environment status info'

exports.builder = function (yargs) {}

exports.handler = function (argv) {
  co(function * () {
    const plugins = Utils.getAllPluginsMapping()
    const pluginsColumns = []
    const columns = []

    Object.keys(plugins).map(plugin => pluginsColumns.push([plugin, plugins[plugin]]))

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

    kvs = Object.assign(kvs, yield Utils.invokeHook('status'))

    Object.keys(kvs).map(k => columns.push([k, kvs[k]]))

    Utils.outputTable(columns, 'Basic:')

    if (pluginsColumns.length > 0) {
      Utils.outputTable(pluginsColumns, 'Plugins:')
    }

    process.exit(0)
  })
}
