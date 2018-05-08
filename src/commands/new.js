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
  shell.exec(`git clone ${argv.repo} ${argv.name} --branch ${argv.branch} --progress`, function (code, stdout, stderr) {
    if (!code) {
      console.log(chalk.green('Succeeded!'))
      shell.rm('-rf', `${argv.name}/.git`)
      console.log(chalk.green('.git directory removed!'))
      shell.cd(argv.name)
      if (shell.test('-f', 'yarn.lock')) {
        console.log(chalk.green('yarn.lock detected, yarn install running'))
        shell.exec('yarn')
      } else {
        console.log(chalk.green('yarn.lock not detected, npm install running'))
        shell.exec('npm install')
      }
    }
  })
}
