const co = require('co')
const fs = require('fs')
const path = require('path')
const { Utils } = require('../../')

exports.command = 'script [file]'
exports.aliases = 'scr'
exports.desc = 'Execute a script'

exports.builder = function (yargs) {}

exports.handler = function (argv) {
  co(function * () {
    const components = Utils.invokeHook('components')
    let filePath = argv.file
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve(process.cwd(), argv.file)
    }

    yield require(filePath)(argv, () => components)
  }).catch(e => Utils.error(e.stack))
}
