import repl from 'repl'
import { Utils } from '@semo/core'

let r // repl instance
let v // yargs argv

const importPackage = (name, force = false) => {
  return Utils.importPackage(name, 'repl-package-cache', true, force)
}

const reload = async () => {
  const scriptName = v.scriptName || 'semo'
  let pluginsReturn = await Utils.invokeHook(
    `${scriptName}:repl`,
    Utils._.isBoolean(v.hook)
      ? {
        reload: true,
        mode: 'group'
      }
      : {
          mode: 'group',
          include: Utils.splitComma(v.hook),
          reload: true
        }
  )

  pluginsReturn = Utils._.omitBy(pluginsReturn, Utils._.isEmpty)
  r.context.Semo.hooks = Utils.formatRcOptions(pluginsReturn)

  if (v.extract && v.extract.length > 0) {
    v.extract.forEach(keyPath => {
      r.context = Object.assign(r.context, Utils._.get(r.context, keyPath) || {})
    })
  }

  const hookReplCommands = await Utils.invokeHook('semo:repl_command')
  Object.keys(hookReplCommands).filter(command => {
    return !(['break', 'clear', 'editor', 'exit', 'help', 'history', 'load', 'reload', 'save'].includes(command))
  }).forEach(command => {
    r.defineCommand(command, hookReplCommands[command])
  }) 

  console.log(Utils.chalk.green('Hooked files reloaded.'))
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
  var originalEval = cli.eval

  // @ts-ignore
  cli.eval = function coEval(cmd, context, filename, callback) {
    if (cmd.match(/^await\s+/) || cmd.match(/.*?await\s+/) && cmd.match(/^\s*\{/)) {
      if (cmd.match(/=/)) {
        cmd = '(async function() { (' + cmd + ') })()'
      } else {
        cmd = '(async function() { let _ = ' + cmd + '; return _;})()'
      }
    } else if (cmd.match(/\W*await\s+/)) {
      cmd = '(async function() { (' + cmd.replace(/^\s*(var|let|const)\s+/, '') + ') })()'
    }

    function done(val: any) {
      return callback(null, val)
    }

    originalEval.call(cli, cmd, context, filename, function(err, res) {
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
export const command = 'repl'
export const aliases = 'r'
export const desc = 'Play with REPL'

async function openRepl(context: any): Promise<any> {
  const { Semo } = context
  const argv = Semo.argv
  r = repl.start({
    prompt: argv.prompt,
    ignoreUndefined: true
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
    }
  })

  r.defineCommand('shell', {
    help: 'Execute shell commands',
    async action(cmd) {
      this.clearBufferedCommand();
      try {
        Utils.exec(cmd)
      } catch (e) {}
      this.displayPrompt();
    }
  })

  const hookReplCommands = await Utils.invokeHook('semo:repl_command')
  Object.keys(hookReplCommands).filter(command => {
    return !(['break', 'clear', 'editor', 'exit', 'help', 'history', 'load', 'reload', 'save'].includes(command))
  }).forEach(command => {
    r.defineCommand(command, hookReplCommands[command])
  })

  const Home = process.env.HOME + `/.${argv.scriptName}`
  Utils.fs.ensureDirSync(Home)
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

export const builder = function(yargs) {
  yargs.option('hook', {
    describe: 'If or not load all plugins repl hook'
  })

  yargs.option('prompt', {
    describe: 'Prompt for input. default is >>>'
  })

  yargs.option('extract', {
    describe: 'Auto extract k/v from Semo object by key path'
  })
}

export const handler = async function(argv: any) {
  const { Utils } = argv.$semo
  const scriptName = argv.scriptName || 'semo'
  argv.hook = Utils.pluginConfig('hook', false)
  argv.prompt = Utils.pluginConfig('prompt', '>>> ')
  argv.extract = Utils.pluginConfig('extract', '')
  argv.extract = Utils._.castArray(argv.extract)
  v = argv
  try {
    let context:any = Object.assign({ await: true }, { Semo: { 
      Utils, 
      argv, 
      'import': importPackage,
      extract,
      reload,
      run: Utils.run,
    }})

    if (argv.hook) {
      let pluginsReturn = await Utils.invokeHook(
        `${scriptName}:repl`,
        Utils._.isBoolean(argv.hook)
          ? {
            mode: 'group'
          }
          : {
              include: Utils.splitComma(argv.hook),
              mode: 'group'
          }
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

      context.Semo.hooks = Utils.formatRcOptions(shortenKeysPluginsReturn)
    }

    if (argv.extract && argv.extract.length > 0) {
      argv.extract.forEach(keyPath => {
        context = Object.assign(context, Utils._.get(context, keyPath) || {})
      })
    }

    return await openRepl(context)
  } catch(e) {
    Utils.error(e.stack)
  }
}
