const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const Utils = require('../../common/utils')
const shell = require('shelljs')

exports.command = 'command [name] [description]'
exports.desc = 'Generate a command template'

exports.builder = function (yargs) {
  yargs.option('extend', {
    default: false,
    describe: 'generate command in extend directory, e.g. extend=zignis'
  })

  yargs.option('plugin', {
    default: false,
    describe: 'generate command in plugin directory, e.g. plugin=xxx'
  })

  yargs.option('force', {
    default: false,
    describe: 'force create non-existen directory'
  })
}

exports.handler = function (argv) {
  let commandDir
  if (argv.extend) {
    let extendName = argv.extend
    if (extendName !== 'zignis' && extendName.indexOf('zignis-plugin-') !== 0) {
      extendName = `zignis-plugin-${extendName}`
    }
    commandDir = `${argv.extendDir}/${extendName}/src/commands`
  } else if (argv.plugin) {
    let pluginName = argv.plugin
    if (pluginName.indexOf('zignis-plugin-') !== 0) {
      pluginName = `zignis-plugin-${pluginName}`
    }
    commandDir = `${argv.pluginDir}/${pluginName}/src/commands`
  } else {
    commandDir = argv.commandDir
  }

  if (!commandDir) {
    Utils.error(chalk.red('"commandDir" missing in config file!'))
  }

  const commandFilePath = path.resolve(commandDir, `${argv.name}.js`)
  const commandFileDir = path.dirname(commandFilePath)

  if (!fs.existsSync(commandFileDir)) {
    if (argv.force) {
      shell.mkdir('-p', commandFileDir)
    } else {
      Utils.error(chalk.red(`Command directory: ${commandFileDir} not exist!`))
    }
  }

  if (fs.existsSync(commandFilePath)) {
    Utils.error(chalk.red('Command file exist!'))
  }

  const name = argv.name.split('/').pop()
  const code = `
exports.command = '${name}'
exports.desc = '${argv.description}'
// exports.aliases = ''

exports.builder = function (yargs) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('${name}')
}

exports.handler = function (argv) {
  console.log('Start to draw your dream code!')
}
`
  if (!fs.existsSync(commandFilePath)) {
    fs.writeFileSync(commandFilePath, code)
    console.log(chalk.green(`${commandFilePath} created!`))
  }
}
