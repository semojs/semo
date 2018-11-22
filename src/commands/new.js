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
  yargs.option('repo', {
    default: _.get(Utils.getCombinedConfig(), 'commandDefault.new.repo') || '',
    describe: 'repo url to clone'
  })

  yargs.option('branch', {
    default: _.get(Utils.getCombinedConfig(), 'commandDefault.new.branch') || 'master',
    describe: 'repo branch to clone'
  })

  yargs.option('yarn', {
    default: false,
    describe: 'use yarn command'
  })

  yargs.option('yes', {
    alias: 'y',
    default: false,
    describe: 'run npm/yarn init with --yes'
  })

  yargs.option('force', {
    alias: 'f',
    default: false,
    describe: 'force download, existed folder will be deleted!'
  })

  yargs.option('empty', {
    default: false,
    describe: 'force empty project, ignore repo'
  })
}

exports.handler = function (argv) {
  if (fs.existsSync(path.resolve(process.cwd(), argv.name))) {
    if (argv.force) {
      console.log(chalk.yellow(`Existed ${argv.name} is deleted before downloading a new one!`))
      shell.rm('-rf', path.resolve(process.cwd(), argv.name))
    } else {
      console.log(chalk.yellow(`Destination existed, command abort!`))
    }
  }

  if (!argv.repo || argv.empty) {
    shell.mkdir('-p', path.resolve(process.cwd(), argv.name))
    shell.cd(argv.name)
    if (argv.yarn) {
      if (argv.yes) {
        shell.exec('yarn init -y')
      } else {
        shell.exec('yarn init')
      }
    } else {
      if (argv.yes) {
        shell.exec('npm init -y')
      } else {
        shell.exec('npm init')
      }
    }
  } else {
    console.log(chalk.green(`Downloading from ${argv.repo}`))
    shell.exec(`git clone ${argv.repo} ${argv.name} --branch ${argv.branch} --progress`, function (
      code,
      stdout,
      stderr
    ) {
      if (!code) {
        console.log(chalk.green('Succeeded!'))
        shell.rm('-rf', path.resolve(process.cwd(), `${argv.name}/.git`))
        console.log(chalk.green('.git directory removed!'))
        shell.cd(argv.name)
        if (argv.yarn) {
          shell.exec('yarn')
        } else {
          shell.exec('npm install')
        }
      }
    })
  }
}
