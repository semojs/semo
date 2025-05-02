import { Argv, ArgvExtraOptions } from '@semo/core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'semo'
export const command = 'config [op]'
export const desc = 'Manage rc config'
export const aliases = 'cfg'

export const builder = async function (yargs: Argv) {
  const argv = (await yargs.argv) as ArgvExtraOptions
  yargs.option('global', {
    alias: 'g',
    describe:
      'For reading/writing configs from/to global yml rc file, default is false',
  })
  argv.$core.extendSubCommand('config', argv.$scriptName, yargs, __dirname)
}

export const handler = async function () {}
