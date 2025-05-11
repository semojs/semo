import {
  ArgvExtraOptions,
  error,
  formatRcOptions,
  run,
  splitComma,
  Utils,
} from '@semo/core'
import { existsSync } from 'fs'
import _ from 'lodash'
import path from 'path'
import { Argv } from 'yargs'
import { importPackage, openRepl } from '../common/repl.js'

export const plugin = 'semo'
export const command = 'repl [replFile]'
export const aliases = 'r'
export const desc = 'Play with REPL'
export const middlewares = []

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
  // get options from plugin config
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

  if (argv.extract && _.isString(argv.extract)) {
    argv.extract = _.castArray(argv.extract)
  }

  const scriptName = argv.scriptName || 'semo'

  const requiredPackages = _.castArray(argv.require)
  const importedPackages = _.castArray(argv.import)

  const concatPackages = _.chain(requiredPackages)
    .concat(importedPackages)
    .uniq()
    .filter()
    .value()
  const packages = {}
  concatPackages.forEach((item: string) => {
    const splited = item.split(':')
    if (splited.length === 1) {
      packages[item] = item
    } else {
      packages[splited[0]] = splited[1]
    }
  })

  try {
    const context: any = Object.assign(
      { await: true },
      {
        Semo: {
          argv,
          import: importPackage(argv),
          require: importPackage(argv),
          Utils,
          run,
        },
      }
    )

    for (const pack in packages) {
      context[packages[pack]] = importPackage(argv)(pack)
    }

    if (argv.hook) {
      let pluginsReturn = await argv.$core.invokeHook<Record<string, any>>(
        `${scriptName}:repl`,
        _.isBoolean(argv.hook)
          ? {
              mode: 'group',
            }
          : {
              include: splitComma(argv.hook),
              mode: 'group',
            }
      )

      pluginsReturn = _.omitBy(pluginsReturn, _.isEmpty)

      const shortenKeysPluginsReturn = {}
      Object.keys(pluginsReturn).forEach((plugin) => {
        let newKey = plugin
        const prefix = scriptName + '-plugin-'
        if (plugin.indexOf(prefix) > -1) {
          newKey = plugin.substring(prefix.length)
        }
        shortenKeysPluginsReturn[newKey] = pluginsReturn[plugin]
      })

      context.Semo.hooks = formatRcOptions(shortenKeysPluginsReturn) || {}
    }

    if (_.isArray(argv.extract)) {
      if (argv.extract && argv.extract.length > 0) {
        argv.extract.forEach((keyPath: string) => {
          const splitExtractKey = keyPath.split('.')
          const finalExtractKey = splitExtractKey[splitExtractKey.length - 1]
          if (!context[finalExtractKey]) {
            context[finalExtractKey] = _.get(context, keyPath) || {}
          }
        })
      }
    } else {
      Object.keys(argv.extract).forEach((key) => {
        const extractKeys: string[] = _.castArray(argv.extract[key])
        extractKeys.forEach((extractKey) => {
          const splitExtractKey = extractKey.split('.')
          const finalExtractKey = splitExtractKey[splitExtractKey.length - 1]
          context[finalExtractKey] = _.get(context, `${key}.${extractKey}`)
        })
      })
    }

    if (argv.replFile) {
      const replFilePath = path.resolve(process.cwd(), argv.replFile)
      if (argv.replFile && existsSync(replFilePath)) {
        try {
          const replRequired = await import(replFilePath)
          let replFileReturn = null
          if (replRequired.handler && _.isFunction(replRequired.handler)) {
            replFileReturn = await replRequired.handler(argv, context)
          } else if (_.isFunction(replRequired)) {
            replFileReturn = await replRequired(argv, context)
          }
          if (replFileReturn && _.isObject(replFileReturn)) {
            Object.keys(replFileReturn).forEach((key) => {
              context[key] = replFileReturn[key]
            })
          }
        } catch {}
      }
    }

    await openRepl(context)

    return false
  } catch (e) {
    error(e.stack)
  }

  return true
}
