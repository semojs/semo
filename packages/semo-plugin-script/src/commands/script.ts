import { ArgvExtraOptions, Argv, error } from '@semo/core'

import { existsSync } from 'node:fs'
import path from 'path'
import { pathToFileURL } from 'node:url'
import yargsParser from 'yargs-parser'

export const command = 'script [file]'
export const aliases = 'scr'
export const desc = 'Execute a script'

function resolveFilePath(filePath: string): string {
  if (!existsSync(filePath)) {
    return path.resolve(process.cwd(), filePath)
  }
  return path.resolve(filePath)
}

async function loadScript(filePath: string) {
  const fileUrl = pathToFileURL(filePath).href
  return await import(fileUrl)
}

export const builder = async function (yargs: Argv) {
  const parsedArgv = yargsParser(process.argv.slice(2))
  const filePath = resolveFilePath(parsedArgv._[1] as string)

  const scriptModule = await loadScript(filePath)
  const mod = scriptModule.default || scriptModule
  if (typeof mod.builder === 'function') {
    mod.builder(yargs)
  }
  return false
}

export const handler = async function (argv: ArgvExtraOptions) {
  try {
    const filePath = resolveFilePath(argv.file)

    const scriptModule = await loadScript(filePath)
    const mod = scriptModule.default || scriptModule
    if (typeof mod.handler !== 'function') {
      throw new Error('Script handler not exist!')
    }
    await mod.handler(argv)
  } catch (e: unknown) {
    error(e instanceof Error ? e.stack || e.message : String(e))
  }
}
