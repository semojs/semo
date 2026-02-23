import {
  Argv,
  ArgvExtraOptions,
  error,
  renderTemplate,
  success,
} from '@semo/core'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const plugin = 'semo'
export const command = 'command <name> [description]'
export const desc = 'Generate a command template'
export const aliases = 'c'

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

export const handler = async function (
  argv: ArgvExtraOptions & { [key: string]: any }
) {
  if (argv.typescript) {
    argv.format = 'typescript'
  }
  const scriptName = argv.scriptName || 'semo'
  let commandDir: string
  if (argv.extend) {
    let extendName = argv.extend
    if (
      extendName !== scriptName &&
      !extendName.startsWith(`${scriptName}-plugin-`)
    ) {
      extendName = `${scriptName}-plugin-${extendName}`
    }
    commandDir = `${
      argv.extendMakeDir || argv.extendDir
    }/${extendName}/src/commands`
  } else if (argv.plugin) {
    let pluginName = argv.plugin
    if (!pluginName.startsWith(`${scriptName}-plugin-`)) {
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
    return
  }

  const commandFilePath = path.resolve(
    commandDir,
    `${argv.name}.${argv.format === 'typescript' ? 'ts' : 'js'}`
  )
  const commandFileDir = path.dirname(commandFilePath)

  mkdirSync(commandFileDir, { recursive: true })

  if (existsSync(commandFilePath)) {
    error('Command file exist!')
    return
  }

  const name = argv.name.split('/').pop()

  const templatePath = path.resolve(
    __dirname,
    '../../../templates/command',
    `${argv.format}.hbs`
  )
  const code = await renderTemplate(templatePath, {
    name,
    description: argv.description || name,
  })

  writeFileSync(commandFilePath, code)
  success(`${commandFilePath} created!`)
}
