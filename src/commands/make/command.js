const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

exports.command = 'command [name] [description]'
exports.desc = 'Generate a command template'

exports.builder = function (yargs) {
}

exports.handler = function (argv) {
  if (!argv.commandFilePath || !fs.existsSync(argv.commandFilePath)) {
    console.log(chalk.red('"commandFilePath" missing in config file or not exist in current directory!'))
    return
  }

  const commandFilePath = path.resolve(argv.commandDir, `${argv.name}.js`)
  if (fs.existsSync(commandFilePath)) {
    console.log(chalk.red('Command file exist!'))
    return
  }

  const name = argv.name.split('/').pop()
  const code = `
exports.command = '${name}'
exports.desc = '${argv.description}'
// exports.alias = ''

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
