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
    describe: 'generate command in extend directory'
  })

  yargs.option('plugin', {
    default: false,
    alias: 'P',
    describe: 'generate command in plugin directory'
  })

  yargs.option('yield', {
    alias: 'Y',
    describe: 'use yield style for generator and promoise'
  })

  yargs.option('typescript', {
    alias: 'ts',
    describe: 'generate typescript style code, will ignore yield option'
  })
}

export const handler = function(argv: any) {
  const scriptName = argv.scriptName || 'zignis'
  let commandDir: string
  if (argv.extend) {
    let extendName = argv.extend
    if (extendName !== scriptName && extendName.indexOf(`${scriptName}-plugin-`) !== 0) {
      extendName = `${scriptName}-plugin-${extendName}`
    }
    commandDir = `${argv.extendMakeDir || argv.extendDir}/${extendName}/src/commands`
  } else if (argv.plugin) {
    let pluginName = argv.plugin
    if (pluginName.indexOf(`${scriptName}-plugin-`) !== 0) {
      pluginName = `${scriptName}-plugin-${pluginName}`
    }
    commandDir = `${argv.pluginMakeDir || argv.pluginDir}/${pluginName}/src/commands`
  } else {
    commandDir = argv.commandMakeDir || argv.commandDir
  }

  if (!commandDir) {
    Utils.error(chalk.red('"commandDir" missing in config file!'))
  }

  const commandFilePath = path.resolve(commandDir, `${argv.name}.${argv.typescript ? 'ts' : 'js'}`)
  const commandFileDir = path.dirname(commandFilePath)

  Utils.fs.ensureDirSync(commandFileDir)

  if (Utils.fileExistsSyncCache(commandFilePath)) {
    Utils.error(chalk.red('Command file exist!'))
  }

  const name = argv.name.split('/').pop()

  let handerTpl, code
  if (argv.typescript) {
    code = `import { Utils } from '${scriptName}'

export const command = '${name}'
export const desc = '${argv.description || name}'
// export const aliases = ''

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('${name}')
}

export const handler = async function (argv: any) {
  console.log('Start to draw your dream code!')
}
`
  } else {
    if (argv.yield) {
      handerTpl = `exports.handler = function (argv) {
  Utils.co(function * () {
    console.log('Start to draw your dream code!')
  }).catch(e => Utils.error(e.stack))
}`
    } else {
    handerTpl = `exports.handler = async function (argv) {
  console.log('Start to draw your dream code!')
}`
    }
  
    code = `const { Utils } = require('${scriptName}')

exports.command = '${name}'
exports.desc = '${argv.description || name}'
// exports.aliases = ''

exports.builder = function (yargs) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('${name}')
}

${handerTpl}
`
  }
  
  if (!Utils.fileExistsSyncCache(commandFilePath)) {
    fs.writeFileSync(commandFilePath, code)
    console.log(chalk.green(`${commandFilePath} created!`))
  }

  // TODO: check zignis installed or not, if not ask if add, check yarn.lock, if exist use yarn or use npm
}
