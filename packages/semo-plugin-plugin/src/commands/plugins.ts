import { Argv, ArgvExtraOptions, colorize, info } from '@semo/core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const disabled = false // Set to true to disable this command temporarily
export const command = 'plugin'
export const desc = 'Plugin management tool'
export const aliases = 'p'

export const builder = async function (yargs: Argv) {
  const argv = (await yargs.argv) as ArgvExtraOptions
  argv.$core?.extendSubCommand('plugin', 'semo-plugin-plugin', yargs, __dirname)
}

export const handler = async function (argv: any) {
  if (argv._.length === 1) {
    info(
      `The ${colorize('green', 'plugin')} command is for managing semo plugins.`
    )
    info(`Use ${colorize('green', 'plugin help')} to see it's sub commands`)
  }
}
