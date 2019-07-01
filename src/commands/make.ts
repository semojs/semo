import yargs from 'yargs'
import { Utils } from '..'

exports.command = 'make <component>'
exports.desc = 'Generate component sample code'
exports.aliases = ['generate', 'g']

exports.builder = function(yargs: yargs.Argv) {
  yargs.demandCommand(1, 'You need at least one command before moving on')
  Utils.extendSubCommand('make', 'zignis', yargs, __dirname)
}

exports.handler = function(argv: yargs.Arguments) {}
