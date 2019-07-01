import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import yargs from 'yargs'
import { Utils } from '../..'

exports.command = 'command <name> [description]'
exports.desc = 'Generate a command template'

exports.builder = function(yargs: yargs.Argv) {
  yargs.option('extend', {
    default: false,
    describe: 'generate command in extend directory, e.g. extend=zignis'
  })

  yargs.option('plugin', {
    default: false,
    describe: 'generate command in plugin directory, e.g. plugin=xxx'
  })

  yargs.option('yield', {
    default: false,
    describe: 'use yield style for generator and promoise'
  })
}

exports.handler = function(
  argv: yargs.Arguments & {
    extend: string
    plugin: string
    name: string
    commandDir: string
  }
) {
  let commandDir: string
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

  Utils.fs.ensureDirSync(commandFileDir)

  if (fs.existsSync(commandFilePath)) {
    Utils.error(chalk.red('Command file exist!'))
  }

  const name = argv.name.split('/').pop()

  let handerTpl
  if (argv.yield) {
    handerTpl = `exports.handler = function (argv) {
  Utils.co(function * () {
    console.log('Start to draw your dream code!')
    Utils.info('Finished successfully!')
  }).catch(e => Utils.error(e.stack))
}`
  } else {
    handerTpl = `exports.handler = async function (argv) {
  console.log('Start to draw your dream code!')
  Utils.info('Finished successfully!', true)
}`
  }

  const code = `
const { Utils } = require('zignis')

exports.command = '${name}'
exports.desc = '${argv.description || name}'
// exports.aliases = ''

exports.builder = function (yargs) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('${name}')
}

${handerTpl}
`
  if (!fs.existsSync(commandFilePath)) {
    fs.writeFileSync(commandFilePath, code)
    console.log(chalk.green(`${commandFilePath} created!`))
  }

  // TODO: check zignis installed or not, if not ask if add, check yarn.lock, if exist use yarn or use npm
}
