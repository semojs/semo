import {
  ArgvExtraOptions,
  deepGet,
  error,
  formatRcOptions,
  run,
  splitComma,
  Utils,
  warn,
} from '@semo/core'
import { existsSync } from 'node:fs'
import path from 'path'
import { Argv } from 'yargs'
import { importPackage, openRepl } from '../common/repl.js'

export const plugin = 'semo'
export const command = 'repl [replFile]'
export const aliases = 'r'
export const desc = 'Play with REPL'

export const builder = function (yargs: Argv) {
  yargs.option('hook', {
    describe: 'If or not load all plugins repl hook',
  })
  yargs.option('prompt', {
    describe: 'Prompt for input. default is >>>',
  })
  yargs.option('extract', {
    describe: 'Auto extract k/v from Semo object by key path',
  })
  yargs.option('import', {
    describe: 'import package, same as require option, e.g. --import=lodash:_',
  })
  yargs.option('require', {
    describe: 'require package, same as import option, e.g. --require=lodash:_',
    alias: 'r',
  })
}

export const handler = async function (argv: ArgvExtraOptions) {
  argv.hook =
    argv.hook ??
    argv.$core.getPluginConfig(
      'repl.hook',
      argv.$core.getPluginConfig('hook', false)
    )
  argv.prompt =
    argv.prompt ??
    argv.$core.getPluginConfig(
      'repl.prompt',
      argv.$core.getPluginConfig('prompt', '>>> ')
    )
  argv.extract =
    argv.extract ??
    argv.$core.getPluginConfig(
      'repl.extract',
      argv.$core.getPluginConfig('extract', '')
    )
  argv.require =
    argv.require ??
    argv.$core
      .getPluginConfig('repl.require', [])
      .concat(argv.$core.getPluginConfig('require', []))
  argv.import =
    argv.import ??
    argv.$core
      .getPluginConfig('repl.import', [])
      .concat(argv.$core.getPluginConfig('import', []))

  if (argv.extract && typeof argv.extract === 'string') {
    argv.extract = [argv.extract]
  }

  const scriptName = argv.scriptName || 'semo'
  const pluginPrefix = scriptName + '-plugin-'

  const requiredPackages = Array.isArray(argv.require)
    ? argv.require
    : [argv.require]
  const importedPackages = Array.isArray(argv.import)
    ? argv.import
    : [argv.import]

  const concatPackages = [
    ...new Set(requiredPackages.concat(importedPackages)),
  ].filter(Boolean)
  const packages: Record<string, string> = {}
  for (const item of concatPackages) {
    const parts = (item as string).split(':')
    packages[parts[0]] = parts.length > 1 ? parts[1] : parts[0]
  }

  try {
    const context: any = {
      await: true,
      Semo: {
        argv,
        import: importPackage(argv),
        require: importPackage(argv),
        Utils,
        run,
      },
    }

    for (const [pack, alias] of Object.entries(packages)) {
      context[alias] = await importPackage(argv)(pack)
    }

    if (argv.hook) {
      let pluginsReturn = await argv.$core.invokeHook<Record<string, any>>(
        `${scriptName}:repl`,
        typeof argv.hook === 'boolean'
          ? { mode: 'group' }
          : { include: splitComma(argv.hook), mode: 'group' }
      )

      pluginsReturn = Object.fromEntries(
        Object.entries(pluginsReturn).filter(
          ([, val]) =>
            !(
              val == null ||
              (typeof val === 'object' && Object.keys(val).length === 0)
            )
        )
      )

      const shortenKeysPluginsReturn: Record<string, any> = {}
      for (const [plugin, value] of Object.entries(pluginsReturn)) {
        const newKey = plugin.startsWith(pluginPrefix)
          ? plugin.substring(pluginPrefix.length)
          : plugin
        shortenKeysPluginsReturn[newKey] = value
      }

      context.Semo.hooks = formatRcOptions(shortenKeysPluginsReturn) || {}
    }

    if (Array.isArray(argv.extract)) {
      for (const keyPath of argv.extract) {
        const splitExtractKey = (keyPath as string).split('.')
        const finalExtractKey = splitExtractKey[splitExtractKey.length - 1]
        if (!context[finalExtractKey]) {
          context[finalExtractKey] = deepGet(context, keyPath as string) || {}
        }
      }
    } else if (argv.extract && typeof argv.extract === 'object') {
      for (const [key, val] of Object.entries(argv.extract)) {
        const extractKeys: string[] = Array.isArray(val) ? val : [val as string]
        for (const extractKey of extractKeys) {
          const splitExtractKey = extractKey.split('.')
          const finalExtractKey = splitExtractKey[splitExtractKey.length - 1]
          context[finalExtractKey] = deepGet(context, `${key}.${extractKey}`)
        }
      }
    }

    if (argv.replFile) {
      const replFilePath = path.resolve(process.cwd(), argv.replFile as string)
      if (existsSync(replFilePath)) {
        try {
          const replRequired = await import(replFilePath)
          let replFileReturn = null
          if (
            replRequired.handler &&
            typeof replRequired.handler === 'function'
          ) {
            replFileReturn = await replRequired.handler(argv, context)
          } else if (typeof replRequired === 'function') {
            replFileReturn = await replRequired(argv, context)
          }
          if (
            replFileReturn &&
            typeof replFileReturn === 'object' &&
            replFileReturn !== null
          ) {
            for (const [key, value] of Object.entries(replFileReturn)) {
              context[key] = value
            }
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          warn(`Failed to load repl file: ${msg}`)
        }
      }
    }

    await openRepl(context)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.stack || e.message : String(e)
    error(msg)
  }
}
