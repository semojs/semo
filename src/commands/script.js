const co = require('co')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const { Utils } = require('../../')

exports.command = 'script [file]'
exports.aliases = 'scr'
exports.desc = 'Execute a script'

exports.builder = function (yargs) {
  const parsedArgv = require('yargs-parser')(process.argv.slice(2))
  let filePath = parsedArgv._[1]
  if (!fs.existsSync(filePath)) {
    filePath = path.resolve(process.cwd(), filePath)
  } else {
    filePath = path.resolve(filePath)
  }

  const scriptModule = require(filePath)
  if (_.isFunction(scriptModule.builder)) {
    scriptModule.builder(yargs)
  }

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

    const scriptModule = require(filePath)
    if (!_.isFunction(scriptModule.handler)) {
      throw new Error('Script handler not exist!')
    }
    yield scriptModule.handler(argv, () => (argv.hook ? Utils.invokeHook('components') : {}))
  }).catch(e => Utils.error(e.stack))
}
