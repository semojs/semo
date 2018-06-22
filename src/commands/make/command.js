const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

exports.command = 'command [name] [description]'
exports.desc = 'Generate a command template'

exports.builder = function (yargs) {
}

exports.handler = function (argv) {
  const commandFile = path.resolve(argv.commandDir, `${argv.name}.js`)
  if (fs.existsSync(commandFile)) {
    console.log(chalk.red('Command file exist!'))
    return
  }

  const code = `
exports.command = '${argv.name}'
exports.desc = '${argv.description}'

exports.builder = function (yargs) {
}

exports.handler = function (argv) {
  console.log('Start to draw your dream code!')
}
`
  fs.writeFileSync(path.resolve(argv.commandDir, `${argv.name}.js`), code)
  console.log(chalk.green('Done!'))
}
