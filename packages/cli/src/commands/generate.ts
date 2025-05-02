import { Argv, ArgvExtraOptions, colorize, info } from '@semo/core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const plugin = 'semo'
export const command = 'generate [component]'
export const desc = 'Generate component sample code'
export const aliases = ['g', 'gen']

export const builder = async function (yargs: Argv) {
  const argv = (await yargs.argv) as ArgvExtraOptions
  argv.$core.extendSubCommand('generate', argv.$scriptName, yargs, __dirname)
}

export const handler = function (argv: ArgvExtraOptions) {
  if (argv._.length === 1) {
    info(
      `The ${colorize('green', 'generate')} command is for generating code by code template.`
    )
    info(
      `Use ${colorize('green', 'generate help')} to see supported generators.`
    )
  }
}
