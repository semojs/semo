const fs = require('fs')
const path = require('path')

const shell = require('shelljs')
const chalk = require('chalk')
const _ = require('lodash')

const Utils = require('../common/utils')

exports.command = 'new <name> [repo] [branch]'
exports.aliases = 'n'
exports.desc = 'Create a new project from specific repo'

exports.builder = function (yargs) {
  yargs.default('repo', _.get(Utils.getCombinedConfig(), 'commandDefault.new.repo') || '')
  yargs.default('branch', _.get(Utils.getCombinedConfig(), 'commandDefault.new.branch') || 'master')
}

exports.handler = function (argv) {
  if (!argv.repo) {
    console.error('Repo url is nessary')
    process.exit(1)
  }

  if (fs.existsSync(path.resolve(process.cwd(), argv.name)) && argv.force) {
    console.log(chalk.yellow(`Existed ${argv.name} is deleted before downloading a new one`))
    shell.rm('-rf', path.resolve(process.cwd(), argv.name))
  }

  console.log(chalk.green(`Downloading from ${argv.repo}`))
  shell.exec(`git clone ${argv.repo} ${argv.name} --branch ${argv.branch} --progress`, function (code, stdout, stderr) {
    if (!code) {
      console.log(chalk.green('Succeeded!'))
      shell.rm('-rf', path.resolve(process.cwd(), `${argv.name}/.git`))
      console.log(chalk.green('.git directory removed!'))
      shell.cd(argv.name)
      if (shell.test('-f', 'yarn.lock')) {
        console.log(chalk.green('yarn.lock detected, running yarn install'))
        shell.exec('yarn')
      } else {
        console.log(chalk.green('yarn.lock not detected, running npm install'))
        shell.exec('npm install')
      }
    }
  })
}
