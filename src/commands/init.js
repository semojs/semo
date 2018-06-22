
const inquirer = require('inquirer')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const co = require('co')
const shell = require('shelljs')

exports.command = 'init'
exports.desc = 'init basic zignis config file and directories'

exports.builder = function (yargs) {
}

exports.handler = function (argv) {
  let defaultZignisrc = argv.plugin ? {
    commandDir: 'src/commands',
    extendDir: 'src/extends'
  } : {
    commandDir: 'bin/zignis/commands',
    pluginDir: 'bin/zignis/plugins',
    extendDir: 'bin/zignis/extends'
  }

  let currentPath = path.resolve(process.cwd())

  return co(function * () {
    const override = fs.existsSync(`${currentPath}/.zignisrc.json`) ? yield inquirer.prompt([
      {
        type: 'confirm',
        name: 'override',
        message: '.zignisrc.json exists, override?',
        default: false
      }]) : true

    if (override === false) {
      console.log(chalk.yellow('init aborted!'))
      return
    }

    fs.writeFileSync(`${currentPath}/.zignisrc.json`, JSON.stringify(defaultZignisrc, null, 2))
    console.log(chalk.green('default .zignisrc created!'))

    const dirs = Object.keys(defaultZignisrc)
    dirs.forEach((dir) => {
      if (!fs.existsSync(`${currentPath}/${defaultZignisrc[dir]}`)) {
        shell.exec(`mkdir -p ${currentPath}/${defaultZignisrc[dir]}`)
        console.log(chalk.green(`${currentPath}/${defaultZignisrc[dir]} created!`))
      }
    })
  })
}
