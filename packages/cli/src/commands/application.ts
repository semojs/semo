import { Utils } from '@semo/core'

export const command = 'application'
export const desc = 'Application command namespace.'
export const aliases = 'app'

export const builder = function(yargs) {
  const argv: any = Utils.getInternalCache().get('argv')
  const scriptName = argv.scriptName || 'semo'
  Utils.extendSubCommand('application', scriptName, yargs, __dirname)
}

export const handler = function(argv) {}
