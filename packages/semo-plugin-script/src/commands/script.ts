import path from 'path'
import { Utils } from '@semo/core'
import yParser from 'yargs-parser'

export const command = 'script [file]'
export const aliases = 'scr'
export const desc = 'Execute a script'

export const builder = function (yargs) {
  const parsedArgv = yParser(process.argv.slice(2))
  let filePath = parsedArgv._[1]
  if (!parsedArgv.help && !parsedArgv.h) {
    if (!Utils.fileExistsSyncCache(filePath)) {
      filePath = path.resolve(process.cwd(), filePath)
    } else {
      filePath = path.resolve(filePath)
    }

    const scriptModule = require(filePath)
    if (Utils._.isFunction(scriptModule.builder)) {
      scriptModule.builder(yargs)
    }
  }
}

export const handler = async function (argv) {
  try {
    let filePath = argv.file
    if (!Utils.fileExistsSyncCache(filePath)) {
      filePath = path.resolve(process.cwd(), argv.file)
    } else {
      filePath = path.resolve(argv.file)
    }

    const scriptModule = require(filePath)
    if (!Utils._.isFunction(scriptModule.handler)) {
      throw new Error('Script handler not exist!')
    }
    await scriptModule.handler(argv)
  } catch (e) {
    Utils.error(e.stack)
  }
}
