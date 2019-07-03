import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import yargs from 'yargs'
import yParser from 'yargs-parser'
import { Utils } from '..'

export const command = 'script [file]'
export const aliases = 'scr'
export const desc = 'Execute a script'

export const builder = function(yargs: yargs.Argv) {
  const parsedArgv = yParser(process.argv.slice(2))
  let filePath = parsedArgv._[1]
  if (!parsedArgv.help && !parsedArgv.h) {
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

export const handler = async function(argv: yargs.Arguments & { file: string }) {
  try {
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
    await scriptModule.handler(argv)
  } catch(e) {
    Utils.error(e.stack)
  }
}
