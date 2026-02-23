import { Argv, ArgvExtraOptions } from '@semo/core'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const plugin = 'semo'
export const command = 'manifest'
export const desc = 'Manage plugin manifest cache'

export const builder = async function (yargs: Argv) {
  const argv = (await yargs.argv) as ArgvExtraOptions
  argv.$core?.extendSubCommand('manifest', argv.scriptName, yargs, __dirname)
}

export const handler = async function () {}
