import { Utils } from '@semo/core'

export const command = 'app'
export const desc = 'Application command namespace.'
export const aliases = 'application'

export const builder = function(yargs) {
  const argv: any = Utils.getInternalCache().get('argv')
  const scriptName = argv.scriptName || 'semo'
  Utils.extendSubCommand('app', scriptName, yargs, __dirname)
}

export const handler = function(argv) {}
