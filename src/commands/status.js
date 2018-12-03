const path = require('path')
const fs = require('fs')
const co = require('co')
const { Utils } = require('../../')

exports.command = 'status'
exports.aliases = 'st'
exports.desc = 'Show environment status info'

exports.builder = function (yargs) {}

exports.handler = function (argv) {
  co(function * () {
    // basic information
    const columns = []
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

    Object.keys(kvs).map(k => columns.push([k, kvs[k]]))
    Utils.outputTable(columns, 'Core Information')

    // plugin information
    const plugins = Utils.getAllPluginsMapping()
    const pluginsStatus = yield Utils.invokeHook('status', 'group')
    // const pluginsColumns = []
    // Object.keys(plugins).map(plugin => pluginsColumns.push([plugin, plugins[plugin]]))
    // if (pluginsColumns.length > 0) {
    //   Utils.outputTable(pluginsColumns, 'Active Plugins')
    // }

    Object.keys(plugins).forEach(plugin => {
      const pkgConfig = require(path.resolve(plugins[plugin], 'package.json'))
      const columns = []
      if (pkgConfig.version) {
        columns.push(['version', pkgConfig.version])
      }

      if (pluginsStatus && pluginsStatus[plugin]) {
        Object.keys(pluginsStatus[plugin]).map(function (key) {
          columns.push([key, pluginsStatus[plugin][key]])
        })
      }

      if (plugins[plugin].indexOf(process.env.HOME) === 0) {
        columns.push(['location', plugins[plugin].replace(process.env.HOME, '~')])
      } else {
        columns.push(['location', plugins[plugin]])
      }

      Utils.outputTable(columns, `Plugin Information: [${plugin}]`)
    })

    process.exit(0)
  }).catch(function (e) {
    Utils.error(e.stack)
  })
}
