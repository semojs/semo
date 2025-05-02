import { Argv, ArgvExtraOptions, error, success } from '@semo/core'
import { ensureDirSync } from 'fs-extra'
import { existsSync, writeFileSync } from 'node:fs'
import path from 'path'

export const plugin = 'semo'
export const command = 'command <name> [description]'
export const desc = 'Generate a command template'
export const aliases = ['c']

export const builder = function (yargs: Argv) {
  yargs.option('extend', {
    alias: 'E',
    describe: 'generate command in extend directory',
  })

  yargs.option('plugin', {
    default: false,
    alias: 'P',
    describe: 'generate command in plugin directory',
  })

  yargs.option('typescript', {
    alias: 'ts',
    describe: 'generate typescript style code',
  })

  yargs.option('format', {
    default: 'esm',
    describe: 'command format, support cjs, esm, typescript, esm as default',
    choices: ['cjs', 'esm', 'typescript'],
  })
}

export const handler = function (
  argv: ArgvExtraOptions & { [key: string]: any }
) {
  if (argv.typescript || argv.ts) {
    argv.format = 'typescript'
  }
  const scriptName = argv.scriptName || 'semo'
  let commandDir: string
  if (argv.extend) {
    let extendName = argv.extend
    if (
      extendName !== scriptName &&
      extendName.indexOf(`${scriptName}-plugin-`) === -1
    ) {
      extendName = `${scriptName}-plugin-${extendName}`
    }
    commandDir = `${
      argv.extendMakeDir || argv.extendDir
    }/${extendName}/src/commands`
  } else if (argv.plugin) {
    let pluginName = argv.plugin
    if (pluginName.indexOf(`${scriptName}-plugin-`) !== 0) {
      pluginName = `${scriptName}-plugin-${pluginName}`
    }
    commandDir = `${
      argv.pluginMakeDir || argv.pluginDir
    }/${pluginName}/src/commands`
  } else {
    commandDir = argv.commandMakeDir || argv.commandDir
  }

  if (!commandDir) {
    error('"commandDir" missing in config file!')
  }

  const commandFilePath = path.resolve(
    commandDir,
    `${argv.name}.${argv.format === 'typescript' ? 'ts' : 'js'}`
  )
  const commandFileDir = path.dirname(commandFilePath)

  ensureDirSync(commandFileDir)

  if (existsSync(commandFilePath)) {
    error('Command file exist!')
  }

  const name = argv.name.split('/').pop()

  let code: string

  switch (argv.format) {
    case 'typescript':
      code = `export const command = '${name}'
export const desc = '${argv.description || name}'

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
}

export const handler = async function (argv: any) {
  console.log('Start to draw your dream code!')
}
`
      break
    case 'esm':
      code = `export const command = '${name}'
export const desc = '${argv.description || name}'

export const builder = function (yargs) {
  // yargs.option('option', { default, describe, alias })
}

export const handler = async function (argv) {
  console.log('Start to draw your dream code!')
}
`
      break
    case 'cjs':
      code = `exports.command = '${name}'
exports.desc = '${argv.description || name}'

exports.builder = function (yargs) {
  // yargs.option('option', { default, describe, alias })
}

exports.handler = async function (argv) {
  console.log('Start to draw your dream code!')
}
`
      break
    default:
      error('Unsupported format!')
  }

  if (!existsSync(commandFilePath)) {
    writeFileSync(commandFilePath, code)
    success(`${commandFilePath} created!`)
  }
}
