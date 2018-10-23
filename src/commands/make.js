const Utils = require('../common/utils')

exports.command = 'make'
exports.desc = 'Generate component sample code'
exports.aliases = 'm'

exports.builder = function (yargs) {
  yargs.demandCommand(1, 'You need at least one command before moving on')
  Utils.extendSubCommand('make', 'zignis', yargs)
}

exports.handler = function (argv) {}
