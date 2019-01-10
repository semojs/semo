const inquirer = require('inquirer')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const co = require('co')
const { Utils } = require('../../')

exports.command = 'init'
exports.desc = 'Init basic zignis config file and directories'
exports.aliases = 'i'

exports.builder = function (yargs) {
  yargs.option('plugin', {
    default: false,
    describe: 'plugin mode'
  })

  yargs.option('force', {
    default: false
  })

  yargs.option('add', {
    default: false,
    describe: 'add npm package to package.json dependencies'
  })

  yargs.option('add-dev', {
    default: false,
    describe: 'add npm package to package.json devDependencies'
  })
}

exports.handler = function (argv) {
  let defaultZignisrc = argv.plugin
    ? {
      commandDir: 'src/commands',
      extendDir: 'src/extends'
    }
    : {
      commandDir: 'bin/zignis/commands',
      pluginDir: 'bin/zignis/plugins',
      extendDir: 'bin/zignis/extends',
      scriptDir: 'bin/zignis/scripts',
      hookDir: 'bin/zignis/hooks'
    }

  let currentPath = path.resolve(process.cwd())

  return co(function * () {
    const override =
      fs.existsSync(`${currentPath}/.zignisrc.json`) && !argv.force
        ? yield inquirer.prompt([
          {
            type: 'confirm',
            name: 'override',
            message: '.zignisrc.json exists, override?',
            default: false
          }
        ])
        : true

    if (override === false) {
      console.log(chalk.yellow('User aborted!'))
      return
    }

    fs.writeFileSync(`${currentPath}/.zignisrc.json`, JSON.stringify(defaultZignisrc, null, 2))
    console.log(chalk.green('Default .zignisrc created!'))

    const dirs = Object.keys(defaultZignisrc)
    dirs.forEach(dir => {
      if (!fs.existsSync(`${currentPath}/${defaultZignisrc[dir]}`)) {
        Utils.exec(`mkdir -p ${currentPath}/${defaultZignisrc[dir]}`)
        console.log(chalk.green(`${currentPath}/${defaultZignisrc[dir]} created!`))
      }
    })

    // add packages
    const addPackage = Utils.parsePackageNames(argv.add)
    const addPackageDev = Utils.parsePackageNames(argv.addDev)
    if (addPackage.length > 0) {
      if (argv.yarn) {
        Utils.exec(`yarn add ${addPackage.join(' ')}`)
      } else {
        Utils.exec(`npm install ${addPackage.join(' ')}`)
      }
    }

    if (addPackageDev.length > 0) {
      if (argv.yarn) {
        Utils.exec(`yarn add ${addPackageDev.join(' ')} -D`)
      } else {
        Utils.exec(`npm install ${addPackageDev.join(' ')} --save-dev`)
      }
    }
  }).catch(e => Utils.error(e.stack))
}
