const fs = require('fs')
const path = require('path')

const shell = require('shelljs')
const chalk = require('chalk')
const _ = require('lodash')

const Utils = require('../common/utils')

const getPackageNames = function (input) {
  if (_.isString(input)) {
    return input.split(',')
  }

  if (_.isArray(input)) {
    return _.flatten(input.map(item => item.split(',')))
  }

  return []
}

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

  yargs.option('merge', {
    alias: 'm',
    default: false,
    describe: 'merge config with exist project folder!'
  })

  yargs.option('empty', {
    default: false,
    describe: 'force empty project, ignore repo'
  })

  yargs.option('add', {
    default: false,
    describe: 'add npm package to package.json dependencies'
  })

  yargs.option('add-dev', {
    default: false,
    describe: 'add npm package to package.json devDependencies'
  })

  yargs.option('init', {
    default: false,
    describe: 'init the project use Zignis'
  })
}

exports.handler = function (argv) {
  if (fs.existsSync(path.resolve(process.cwd(), argv.name))) {
    if (argv.force) {
      Utils.warn(`Existed ${argv.name} is deleted before creating a new one!`)
      shell.rm('-rf', path.resolve(process.cwd(), argv.name))
    } else if (!argv.merge) {
      Utils.error(`Destination existed, command abort!`)
    }
  }

  if (argv.merge) {
    shell.cd(argv.name)
  } else {
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

  // add packages
  const addPackage = getPackageNames(argv.add)
  const addPackageDev = getPackageNames(argv.addDev)
  if (addPackage.length > 0) {
    if (argv.yarn) {
      shell.exec(`yarn add ${addPackage.join(' ')}`)
    } else {
      shell.exec(`npm install ${addPackage.join(' ')}`)
    }
  }

  if (addPackageDev.length > 0) {
    if (argv.yarn) {
      shell.exec(`yarn add ${addPackageDev.join(' ')} -D`)
    } else {
      shell.exec(`npm install ${addPackageDev.join(' ')} --save-dev`)
    }
  }

  // init basic zignis structure
  if (argv.init) {
    if (argv.name.indexOf('zignis-plugin-') === 0) {
      shell.exec('zignis init --plugin --disable-ten-temporarily')
    } else {
      shell.exec('zignis init --disable-ten-temporarily')
    }
  }
}
