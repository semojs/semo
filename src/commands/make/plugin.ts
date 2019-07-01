import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
import yargs from 'yargs'
import { Utils } from '../..'

exports.command = 'plugin <name>'
exports.desc = 'Generate a plugin structure'
// exports.aliases = ''

exports.builder = function(yargs: yargs.Argv) {
  yargs.option('force', {
    default: false,
    describe: 'force creation, remove existed one',
    alias: 'f'
  })
}

exports.handler = function(
  argv: yargs.Arguments & {
    pluginDir: string
    name: string
  }
) {
  if (!argv.pluginDir || !fs.existsSync(argv.pluginDir)) {
    Utils.error('"pluginDir" missing in config file or not exist in current directory!')
  }

  const namePattern = /[a-z0-9]+/
  if (!namePattern.test(argv.name)) {
    Utils.error('Plugin name invalid!')
  }

  const pluginPath = path.resolve(argv.pluginDir, `zignis-plugin-${argv.name}`)
  if (fs.existsSync(pluginPath)) {
    if (argv.force) {
      Utils.warn(`Existed zignis-plugin-${argv.name} is deleted before creating a new one!`)
      shell.rm('-rf', pluginPath)
    } else {
      Utils.error(`Destination existed, command abort!`)
    }
  }

  shell.mkdir('-p', pluginPath)
  shell.cd(pluginPath)
  shell.exec('zignis init --plugin --exec-mode')
  shell.exec('npm init --yes')
}
