const co = require('co')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const { Utils } = require('../../')

exports.command = 'script [file]'
exports.aliases = 'scr'
exports.desc = 'Execute a script'

exports.builder = function (yargs) {
  yargs.option('hook', {
    default: false,
    describe: 'if or not load all plugins components hook'
  })
}

exports.handler = function (argv) {
  argv.hook = argv.hook || _.get(Utils.getCombinedConfig(), 'commandDefault.script.hook') || false
  co(function * () {
    let filePath = argv.file
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve(process.cwd(), argv.file)
    } else {
      filePath = path.resolve(argv.file)
    }

    yield require(filePath)(argv, () => (argv.hook ? Utils.invokeHook('components') : {}))
  }).catch(e => Utils.error(e.stack))
}
