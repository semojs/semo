import yargs from 'yargs'
import { Utils } from '..'

export const command = 'make <component>'
export const desc = 'Generate component sample code'
export const aliases = ['generate', 'g']

export const builder = function(yargs: any) {
  const argv: any = Utils.getInternalCache().get('argv') || {}
  const scriptName = argv.scriptName || 'zignis'
  yargs.demandCommand(1, 'You need at least one command before moving on')
  Utils.extendSubCommand('make', scriptName, yargs, __dirname)
}

export const handler = function(argv: yargs.Arguments) {}
