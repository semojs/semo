import { Utils } from '@semo/core'

export const command = 'make <component>'
export const desc = 'Generate component sample code'
export const aliases = ['generate', 'g']

export const builder = function(yargs) {
  const argv: any = Utils.getInternalCache().get('argv') || {}
  const scriptName = argv.scriptName || 'semo'
  yargs.demandCommand(1, 'You need at least one command before moving on')
  Utils.extendSubCommand('make', scriptName, yargs, __dirname)
}

export const handler = function(argv) {}
