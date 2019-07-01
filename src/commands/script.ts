import co from 'co'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import yargs from 'yargs'
import yParser from 'yargs-parser'
import { Utils } from '..'

exports.command = 'script [file]'
exports.aliases = 'scr'
exports.desc = 'Execute a script'

exports.builder = function(yargs: yargs.Argv) {
  const parsedArgv = yParser(process.argv.slice(2))
  let filePath = parsedArgv._[1]
  if (!parsedArgv.help) {
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve(process.cwd(), filePath)
    } else {
      filePath = path.resolve(filePath)
    }

    const scriptModule = require(filePath)
    if (_.isFunction(scriptModule.builder)) {
      scriptModule.builder(yargs)
    }
  }
}

exports.handler = function(argv: yargs.Arguments & { file: string }) {
  co(function*() {
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
    yield scriptModule.handler(argv)
  }).catch(e => Utils.error(e.stack))
}
