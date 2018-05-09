
const path = require('path')
const fs = require('fs')
const Utils = require('../common/utils')

exports.command = 'make'
exports.desc = 'Generate component sample code'

exports.builder = function (yargs) {
  const plugins = Utils.getAllPluginsMapping()
  const config = Utils.getCombinedConfig()
  // Load plugin commands
  if (plugins) {
    Object.keys(plugins).map(function (plugin) {
      if (fs.existsSync(path.resolve(plugins[plugin], 'src/extends/zignis/commands', 'make'))) {
        yargs.commandDir(path.resolve(plugins[plugin], 'src/extends/zignis/commands', 'make'))
      }
    })
  }

  // Load application commands
  if (config.extendDir && fs.existsSync(path.resolve(process.cwd(), `${config.extendDir}/zignis/commands`, 'make'))) {
    yargs.commandDir(path.resolve(process.cwd(), `${config.extendDir}/zignis/commands`, 'make'))
  }

  return yargs.commandDir('make')
}

exports.handler = function (argv) {}
