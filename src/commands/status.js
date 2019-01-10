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
    const hookStatus = yield Utils.invokeHook('status', { mode: 'group' })
    const columns = []
    let kvs = hookStatus.zignis ? hookStatus.zignis : {}

    Object.keys(kvs).map(k => columns.push([k, kvs[k]]))
    Utils.outputTable(columns, 'Core Information')

    // plugin information
    const plugins = Utils.getAllPluginsMapping()
    Object.keys(plugins).forEach(plugin => {
      if (fs.existsSync(path.resolve(plugins[plugin], 'package.json'))) {
        const pkgConfig = require(path.resolve(plugins[plugin], 'package.json'))
        const columns = []
        if (pkgConfig.version) {
          columns.push(['version', pkgConfig.version])
        }

        if (hookStatus && hookStatus[plugin]) {
          Object.keys(hookStatus[plugin]).map(function (key) {
            columns.push([key, hookStatus[plugin][key]])
          })
        }

        if (plugins[plugin].indexOf(process.env.HOME) === 0) {
          columns.push(['location', plugins[plugin].replace(process.env.HOME, '~')])
        } else {
          columns.push(['location', plugins[plugin]])
        }

        Utils.outputTable(columns, `[${plugin}]`)
      }
    })

    // application information
    if (hookStatus['application']) {
      let plugin = 'application'
      const columns = []
      if (hookStatus && hookStatus[plugin]) {
        Object.keys(hookStatus[plugin]).forEach(function (key) {
          columns.push([key, hookStatus[plugin][key]])
        })
      }
      Utils.outputTable(columns, 'Application Information')
    }

    process.exit(0)
  }).catch(e => Utils.error(e.stack))
}
