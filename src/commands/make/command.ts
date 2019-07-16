import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import yargs from 'yargs'
import { Utils } from '../..'

export const command = 'command <name> [description]'
export const desc = 'Generate a command template'

export const builder = function(yargs: yargs.Argv) {
  yargs.option('extend', {
    default: false,
    alias: 'E',
    describe: 'generate command in extend directory, e.g. extend=zignis'
  })

  yargs.option('plugin', {
    default: false,
    alias: 'P',
    describe: 'generate command in plugin directory, e.g. plugin=xxx'
  })

  yargs.option('yield', {
    default: false,
    alias: 'Y',
    describe: 'use yield style for generator and promoise'
  })
}

export const handler = function(argv: any) {
  let commandDir: string
  if (argv.extend) {
    let extendName = argv.extend
    if (extendName !== 'zignis' && extendName.indexOf('zignis-plugin-') !== 0) {
      extendName = `zignis-plugin-${extendName}`
    }
    commandDir = `${argv.extendMakeDir || argv.extendDir}/${extendName}/src/commands`
  } else if (argv.plugin) {
    let pluginName = argv.plugin
    if (pluginName.indexOf('zignis-plugin-') !== 0) {
      pluginName = `zignis-plugin-${pluginName}`
    }
    commandDir = `${argv.pluginMakeDir || argv.pluginDir}/${pluginName}/src/commands`
  } else {
    commandDir = argv.commandMakeDir || argv.commandDir
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
