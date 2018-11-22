const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

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
}

exports.handler = function (argv) {
  let commandDir
  if (argv.extend) {
    commandDir = `${argv.extendDir}/${argv.extend}/src/commands`
  } else if (argv.plugin) {
    commandDir = `${argv.pluginDir}/zignis-plugin-${argv.plugin}/src/commands`
  } else {
    commandDir = argv.commandDir
  }

  if (!commandDir || !fs.existsSync(commandDir)) {
    console.log(chalk.red('"commandDir" missing in config file or not exist in current directory!'))
    return
  }

  const commandFilePath = path.resolve(commandDir, `${argv.name}.js`)
  if (fs.existsSync(commandFilePath)) {
    console.log(chalk.red('Command file exist!'))
    return
  }

  const name = argv.name.split('/').pop()
  const code = `
exports.command = '${name}'
exports.desc = '${argv.description}'
// exports.aliases = ''

exports.builder = function (yargs) {
  // yargs.option('option', {default, describe, alias})
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
