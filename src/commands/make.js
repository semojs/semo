
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
      if (fs.existsSync(path.resolve(plugins[plugin], 'src/commands', 'make'))) {
        yargs.commandDir(path.resolve(plugins[plugin], 'src/commands', 'make'))
      }
    })
  }

  // Load application commands
  if (config.commandDir) {
    yargs.commandDir(path.resolve(process.cwd(), config.commandDir, 'make'))
  }



  return yargs.commandDir('make')
}

exports.handler = function (argv) {}
