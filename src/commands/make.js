
const Utils = require('../common/utils')

exports.command = 'make'
exports.desc = 'Generate component sample code'

exports.builder = function (yargs) {
  Utils.extendSubCommand('make', 'zignis', yargs)
}

exports.handler = function (argv) {}
