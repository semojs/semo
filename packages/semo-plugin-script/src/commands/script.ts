import { Argv, error } from '@semo/core'
import _ from 'lodash'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'path'
import yargsParser from 'yargs-parser'

const require = createRequire(import.meta.url)

export const command = 'script [file]'
export const aliases = 'scr'
export const desc = 'Execute a script'

export const builder = async function (yargs: Argv) {
  const parsedArgv = yargsParser(process.argv.slice(2))
  let filePath = parsedArgv._[1] as string
  if (!existsSync(filePath)) {
    filePath = path.resolve(process.cwd(), filePath)
  } else {
    filePath = path.resolve(filePath)
  }

  const scriptModule = require(filePath)
  if (_.isFunction(scriptModule.builder)) {
    scriptModule.builder(yargs)
  }
  return false
}

export const handler = async function (argv) {
  try {
    let filePath = argv.file
    if (!existsSync(filePath)) {
      filePath = path.resolve(process.cwd(), argv.file)
    } else {
      filePath = path.resolve(argv.file)
    }

    const scriptModule = require(filePath)
    if (!_.isFunction(scriptModule.handler)) {
      throw new Error('Script handler not exist!')
    }
    await scriptModule.handler(argv)
  } catch (e) {
    error(e.stack)
  }
}
