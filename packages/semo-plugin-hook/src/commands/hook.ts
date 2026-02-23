import { Argv, ArgvExtraOptions } from '@semo/core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const command = 'hook'
export const desc = 'Hook management'

export const builder = async function (yargs: Argv) {
  const argv = (await yargs.argv) as ArgvExtraOptions
  argv.$core?.extendSubCommand('hook', 'semo-plugin-hook', yargs, __dirname)
}

export const handler = async function (_argv: ArgvExtraOptions) {}
