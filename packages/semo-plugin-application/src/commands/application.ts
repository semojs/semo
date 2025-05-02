import { Argv, ArgvExtraOptions, colorize, info } from '@semo/core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const command = 'application'
export const desc = 'Application command namespace'
export const aliases = 'app'

export const builder = async function (yargs: Argv) {
  const argv = (await yargs.argv) as ArgvExtraOptions
  argv.$core?.extendSubCommand(
    'application',
    'semo-plugin-application',
    yargs,
    __dirname
  )
}

export const handler = function (argv) {
  if (argv._.length === 1) {
    info(
      `The ${colorize('green', 'application')} command is where your project level commands are located.`
    )
    info(
      `Use ${colorize(
        'green',
        'semo generate application/COMMAND --extend=semo-plugin-application'
      )} to add your application command.`
    )
    info(
      `Then ${colorize('green', 'semo application COMMAND')} to run your command.`
    )
  }
}
