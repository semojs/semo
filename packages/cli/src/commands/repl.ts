import repl from 'repl'
import path from 'path'
import { Utils, UtilsType, COMMON_OBJECT } from '@semo/core'
import yParser from 'yargs-parser'
import fs from 'fs-extra'

let r // repl instance
let v // yargs argv

const importPackage = (name, force = false) => {
  return Utils.importPackage(name, 'repl-package-cache', true, force)
}

const reload = async () => {
  const scriptName = v.scriptName || 'semo'
  let pluginsReturn = await Utils.invokeHook<COMMON_OBJECT>(
    `${scriptName}:repl`,
    Utils._.isBoolean(v.hook)
      ? {
          reload: true,
          mode: 'group',
        }
      : {
          mode: 'group',
          include: Utils.splitComma(v.hook),
          reload: true,
        },
  )

  pluginsReturn = Utils._.omitBy(pluginsReturn, Utils._.isEmpty)
  r.context.Semo.hooks = Utils.formatRcOptions(pluginsReturn)

  if (v.extract && v.extract.length > 0) {
    v.extract.forEach(keyPath => {
      r.context = Object.assign(
        r.context,
        Utils._.get(r.context, keyPath) || {},
      )
    })
  }

  const hookReplCommands =
    await Utils.invokeHook<COMMON_OBJECT>('semo:repl_command')
  Object.keys(hookReplCommands)
    .filter(command => {
      return ![
        'break',
        'clear',
        'editor',
        'exit',
        'help',
        'history',
        'load',
        'reload',
        'save',
      ].includes(command)
    })
    .forEach(command => {
      r.defineCommand(command, hookReplCommands[command])
    })

  console.log(Utils.success('Hooked files reloaded.'))
}

const extract = (obj, keys: string[] | string = []) => {
  const keysCast = Utils._.castArray(keys)
  Object.keys(obj).forEach(key => {
    if (keys.length === 0 || keysCast.includes(key)) {
      Object.defineProperty(r.context, key, { value: obj[key] })
    }
  })
}

const corepl = (cli: repl.REPLServer) => {
  const originalEval = cli.eval

  // @ts-ignore
  cli.eval = function coEval(cmd, context, filename, callback) {
    if (
      cmd.match(/^await\s+/) ||
      (cmd.match(/.*?await\s+/) && cmd.match(/^\s*\{/))
    ) {
      if (cmd.match(/=/)) {
        cmd = '(async function() { (' + cmd + ') })()'
      } else {
        cmd = '(async function() { let _ = ' + cmd + '; return _;})()'
      }
    } else if (cmd.match(/\W*await\s+/)) {
      cmd =
        '(async function() { (' +
        cmd.replace(/^\s*(var|let|const)\s+/, '') +
        ') })()'
    }

    function done(val: any) {
      return callback(null, val)
    }

    originalEval.call(cli, cmd, context, filename, function (err, res) {
      if (err || !res || typeof res.then !== 'function') {
        return callback(err, res)
      } else {
        return res.then(done, callback)
      }
    })
  }

  return cli
}

export const plugin = 'semo'
export const command = 'repl [replFile]'
export const aliases = 'r'
export const desc = 'Play with REPL'

async function openRepl(context: any): Promise<any> {
  const { Semo } = context
  const argv = Semo.argv
  r = repl.start({
    prompt: argv.prompt,
    ignoreUndefined: true,
  })

  r.defineCommand('reload', {
    help: 'Reload hooked files',
    async action(name) {
      this.clearBufferedCommand()
      try {
        await reload()
      } catch (e) {
        Utils.error(e.message)
      }
      this.displayPrompt()
    },
  })

  r.defineCommand('shell', {
    help: 'Execute shell commands',
    async action(cmd) {
      this.clearBufferedCommand()
      try {
        Utils.exec(cmd)
      } catch (e) {}
      this.displayPrompt()
    },
  })

  const requireAction = async function (input) {
    // @ts-ignore
    this.clearBufferedCommand()
    try {
      const opts = yParser(input)

      const packages = {}
      for (const part of opts._) {
        const split = part.split(':')
        if (split.length === 1) {
          packages[part] = part
        } else if (split.length > 1) {
          packages[split[0]] = split[1]
        }
      }

      for (const pack in packages) {
        const imported = importPackage(pack)
        Object.defineProperty(r.context, packages[pack], { value: imported })
      }
    } catch (e) {}

    // @ts-ignore
    this.displayPrompt()
  }

  // Add require and import command
  r.defineCommand('require', {
    help: 'Require npm packages',
    action: requireAction,
  })

  r.defineCommand('import', {
    help: 'import npm packages',
    action: requireAction,
  })

  const hookReplCommands =
    await Utils.invokeHook<COMMON_OBJECT>('semo:repl_command')
  Object.keys(hookReplCommands)
    .filter(command => {
      return ![
        'break',
        'clear',
        'editor',
        'exit',
        'help',
        'history',
        'load',
        'reload',
        'save',
      ].includes(command)
    })
    .forEach(command => {
      r.defineCommand(command, hookReplCommands[command])
    })

  const Home = process.env.HOME + `/.${argv.scriptName}`
  fs.ensureDirSync(Home)
  if (!Utils.fileExistsSyncCache(Home)) {
    Utils.exec(`mkdir -p ${Home}`)
  }
  Utils.replHistory(r, `${Home}/.${argv.scriptName}_repl_history`)

  // @ts-ignore
  // context即为REPL中的上下文环境
  r.context = Object.assign(r.context, context)
  r.context.Semo.repl = r

  corepl(r)
}

export const builder = function (yargs) {
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

export const handler = async function (argv: any) {
  const VERSION = argv.$semo.VERSION
  const scriptName = argv.scriptName || 'semo'

  argv.hook = Utils.pluginConfig('repl.hook', Utils.pluginConfig('hook', false))
  argv.prompt = Utils.pluginConfig(
    'repl.prompt',
    Utils.pluginConfig('prompt', '>>> '),
  )
  argv.extract = Utils.pluginConfig(
    'repl.extract',
    Utils.pluginConfig('extract', ''),
  )
  argv.require = Utils.pluginConfig('repl.require', []).concat(
    Utils.pluginConfig('require', []),
  )
  argv.import = Utils.pluginConfig('repl.import', []).concat(
    Utils.pluginConfig('import', []),
  )

  const requiredPackages = Utils._.castArray(argv.require)
  const importedPackages = Utils._.castArray(argv.import)
  const concatPackages = Utils._.chain(requiredPackages)
    .concat(importedPackages)
    .uniq()
    .filter()
    .value()
  const packages = {}
  concatPackages.forEach(item => {
    const splited = item.split(':')
    if (splited.length === 1) {
      packages[item] = item
    } else {
      packages[splited[0]] = splited[1]
    }
  })

  if (Utils._.isString(argv.extract)) {
    argv.extract = Utils._.castArray(argv.extract)
  }
  v = argv
  try {
    let context: any = Object.assign(
      { await: true },
      {
        Semo: {
          VERSION,
          Utils,
          argv,
          import: importPackage,
          require: importPackage,
          extract,
          reload,
          run: Utils.run,
        },
      },
    )

    for (const pack in packages) {
      context[packages[pack]] = importPackage(pack)
    }

    if (argv.hook) {
      let pluginsReturn = await Utils.invokeHook<COMMON_OBJECT>(
        `${scriptName}:repl`,
        Utils._.isBoolean(argv.hook)
          ? {
              mode: 'group',
            }
          : {
              include: Utils.splitComma(argv.hook),
              mode: 'group',
            },
      )

      pluginsReturn = Utils._.omitBy(pluginsReturn, Utils._.isEmpty)

      const shortenKeysPluginsReturn = {}
      Object.keys(pluginsReturn).forEach(plugin => {
        let newKey = plugin
        const prefix = scriptName + '-plugin-'
        if (plugin.indexOf(prefix) > -1) {
          newKey = plugin.substring(prefix.length)
        }
        shortenKeysPluginsReturn[newKey] = pluginsReturn[plugin]
      })

      context.Semo.hooks = Utils.formatRcOptions(shortenKeysPluginsReturn) || {}
    }

    if (Utils._.isArray(argv.extract)) {
      if (argv.extract && argv.extract.length > 0) {
        argv.extract.forEach(keyPath => {
          context = Object.assign(
            context,
            Utils._.get(context.Semo.hooks, keyPath) || {},
          )
        })
      }
    } else {
      Object.keys(argv.extract).forEach(key => {
        const extractKeys: string[] = Utils._.castArray(argv.extract[key])
        extractKeys.forEach(extractKey => {
          const splitExtractKey = extractKey.split('.')
          const finalExtractKey = splitExtractKey[splitExtractKey.length - 1]
          context[finalExtractKey] = Utils._.get(
            context.Semo.hooks,
            `${key}.${extractKey}`,
          )
        })
      })
    }

    if (argv.replFile) {
      const replFilePath = path.resolve(process.cwd(), argv.replFile)
      if (argv.replFile && fs.existsSync(replFilePath)) {
        try {
          const replRequired = require(replFilePath)
          if (
            replRequired.handler &&
            Utils._.isFunction(replRequired.handler)
          ) {
            await replRequired.handler(argv, context)
          } else if (Utils._.isFunction(replRequired)) {
            await replRequired(argv, context)
          }
        } catch (e) {}
      }
    }

    await openRepl(context)

    return false
  } catch (e) {
    Utils.error(e.stack)
  }

  return true
}
