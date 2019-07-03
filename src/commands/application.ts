import yargs from 'yargs'
import { Utils } from '..'

export const command = 'application'
export const desc = 'Application command namespace.'
export const aliases = 'app'

export const builder = function(yargs: yargs.Argv) {
  Utils.extendSubCommand('application', 'zignis', yargs, __dirname)
}

export const handler = function(argv: yargs.Arguments) {}
