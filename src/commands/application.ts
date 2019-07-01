import yargs from 'yargs'
import { Utils } from '..'

exports.command = 'application'
exports.desc = 'Application command namespace.'
exports.aliases = 'app'

exports.builder = function(yargs: yargs.Argv) {
  // yargs.option('option', { default, describe, alias })
  Utils.extendSubCommand('application', 'zignis', yargs, __dirname)
}

exports.handler = function(argv: yargs.Arguments) {}
