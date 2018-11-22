const fs = require('fs')
const path = require('path')
const Utils = require('../../common/utils')
const shell = require('shelljs')

exports.command = 'plugin <pluginName>'
exports.desc = 'Generate a plugin structure'
// exports.aliases = ''

exports.builder = function (yargs) {
  yargs.option('force', {
    default: false,
    describe: 'force creation, remove existed one',
    alias: 'f'
  })
}

exports.handler = function (argv) {
  if (!argv.pluginDir || !fs.existsSync(argv.pluginDir)) {
    Utils.error('"pluginDir" missing in config file or not exist in current directory!')
  }

  const pluginNamePattern = /[a-z0-9]+/
  if (!pluginNamePattern.test(argv.pluginName)) {
    Utils.error('Plugin name invalid!')
  }

  const pluginPath = path.resolve(argv.pluginDir, `zignis-plugin-${argv.pluginName}`)
  if (fs.existsSync(pluginPath)) {
    if (argv.force) {
      Utils.warn(`Existed zignis-plugin-${argv.pluginName} is deleted before creating a new one!`)
      shell.rm('-rf', pluginPath)
    } else {
      Utils.error(`Destination existed, command abort!`)
    }
  }

  shell.mkdir('-p', pluginPath)
  shell.cd(pluginPath)
  shell.exec('zignis init --plugin --disable-ten-temporarily')
}
