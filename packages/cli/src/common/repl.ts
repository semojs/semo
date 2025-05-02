import {
  ArgvExtraOptions,
  error,
  formatRcOptions,
  splitComma,
  success,
} from '@semo/core'
import {
  closeSync,
  createWriteStream,
  existsSync,
  openSync,
  readFileSync,
  statSync,
} from 'fs'
import yargsParser from 'yargs-parser'
import { ensureDirSync } from 'fs-extra'
import _ from 'lodash'
import repl, { REPLServer } from 'repl'
import shell from 'shelljs'
import { Context } from 'vm'

/**
 * Keep repl history
 *
 */
export const replHistory = function (
  repl: REPLServer & { [key: string]: any },
  file: string
) {
  try {
    statSync(file)
    repl.history = readFileSync(file, 'utf-8').split('\n').reverse()
    repl.history.shift()
    repl.historyIndex = -1 // will be incremented before pop
  } catch {}

  const fd = openSync(file, 'a')
  const wstream = createWriteStream(file, {
    fd,
  })
  wstream.on('error', function (err) {
    throw err
  })

  repl.addListener('line', function (code) {
    if (code && code !== '.history') {
      wstream.write(code + '\n')
    } else {
      repl.historyIndex++
      repl.history.pop()
    }
  })

  process.on('exit', function () {
    closeSync(fd)
  })

  repl.defineCommand('history', {
    help: 'Show the history',
    action: function () {
      const out: any = []
      repl.history.forEach(function (v) {
        out.push(v)
      })
      repl.output.write(out.reverse().join('\n') + '\n')
      repl.displayPrompt()
    },
  })
}

export const reload = async (
  repl: repl.REPLServer,
  argv: ArgvExtraOptions & { [key: string]: any }
) => {
  const scriptName = argv.scriptName || 'semo'
  let pluginsReturn = await argv.$core.invokeHook(
    `${scriptName}:repl`,
    _.isBoolean(argv.hook)
      ? {
          reload: true,
          mode: 'group',
        }
      : {
          mode: 'group',
          include: splitComma(argv.hook),
          reload: true,
        }
  )

  pluginsReturn = _.omitBy(pluginsReturn, _.isEmpty)
  repl.context.Semo.hooks = formatRcOptions(pluginsReturn)

  if (argv.extract && argv.extract.length > 0) {
    argv.extract.forEach((keyPath: string) => {
      const extracted = _.get(repl.context, keyPath) || {}
      Object.keys(extracted).forEach((key) => {
        repl.context[key] = extracted[key]
      })
    })
  }

  const hookReplCommands = await argv.$core.invokeHook('semo:repl_command')
  Object.keys(hookReplCommands)
    .filter((command) => {
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
    .forEach((command) => {
      repl.defineCommand(command, hookReplCommands[command])
    })

  success('Hooked files reloaded.')
}

export const extract = (
  repl: repl.REPLServer,
  obj: Record<string, any>,
  keys: string[] | string = [],
  newObjName: string = ''
) => {
  if (!keys || keys.length === 0) {
    // If keys empty, extract all keys from obj
    Object.keys(obj).forEach((key) => {
      const value = _.get(obj, `${key}`)
      if (value) {
        Object.defineProperty(repl.context, key, {
          value,
        })
      }
    })
  } else {
    const keysCast = _.castArray(keys)

    keysCast.forEach((key) => {
      const splitExtractKey = key.split('.')
      const finalExtractKey = splitExtractKey.at(-1)
      const value = _.get(obj, `${key}`)
      if (value) {
        if (!newObjName) {
          Object.defineProperty(repl.context, finalExtractKey, {
            value,
          })
        } else {
          if (!repl.context[newObjName]) {
            repl.context[newObjName] = {}
          }
          Object.defineProperty(repl.context[newObjName], finalExtractKey, {
            value,
          })
        }
      }
    })
  }
}

export async function openRepl(context: Record<string, any>): Promise<any> {
  const { Semo } = context
  const argv = Semo.argv
  const r = repl.start({
    prompt: argv.prompt,
    ignoreUndefined: true,
  })

  r.defineCommand('reload', {
    help: 'Reload hooked files',
    async action() {
      this.clearBufferedCommand()
      try {
        await reload(r, argv)
      } catch (e) {
        error(e.message)
      }
      this.displayPrompt()
    },
  })

  r.defineCommand('shell', {
    help: 'Execute shell commands',
    async action(cmd) {
      this.clearBufferedCommand()
      try {
        shell.exec(cmd)
      } catch {}
      this.displayPrompt()
    },
  })

  const requireAction = async function (input: string) {
    // @ts-ignore
    this.clearBufferedCommand()
    try {
      const opts = yargsParser(input)

      const packages = {}
      for (const part of opts._) {
        if (_.isString(part)) {
          const split = part.split(':')
          if (split.length === 1) {
            packages[part] = part
          } else if (split.length > 1) {
            packages[split[0]] = split[1]
          }
        }
      }

      for (const pack in packages) {
        const imported = importPackage(argv)(pack)
        Object.defineProperty(r.context, packages[pack], { value: imported })
      }
    } catch {}

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

  const hookReplCommands = await argv.$core.invokeHook('semo:repl_command')
  Object.keys(hookReplCommands)
    .filter((command) => {
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
    .forEach((command) => {
      r.defineCommand(command, hookReplCommands[command])
    })

  const Home = process.env.HOME + `/.${argv.scriptName}`
  ensureDirSync(Home)
  if (!existsSync(Home)) {
    shell.exec(`mkdir -p ${Home}`)
  }
  replHistory(r, `${Home}/.${argv.scriptName}_repl_history`)

  // @ts-ignore
  // context即为REPL中的上下文环境
  r.context = Object.assign(r.context, context)
  r.context.Semo.repl = r
  r.context.Semo.extract = (
    obj,
    keys: string[] | string = [],
    newObjName: string = ''
  ) => {
    extract(r, obj, keys, newObjName)
  }

  corepl(r)
}

export const corepl = (cli: repl.REPLServer) => {
  const originalEval = cli.eval

  // @ts-ignore
  cli.eval = function coEval(
    cmd: string,
    context: Context,
    filename: string,
    callback: (err: Error | null, result: any) => void
  ) {
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

    originalEval.call(
      cli,
      cmd,
      context,
      filename,
      function (err: Error | null, res: any) {
        if (err || !res || typeof res.then !== 'function') {
          return callback(err, res)
        } else {
          return res.then(done, callback)
        }
      }
    )
  }

  return cli
}

export const importPackage = (argv: ArgvExtraOptions) => {
  return (name: string, force = false) => {
    return argv.$core.importPackage(name, 'repl-package-cache', true, force)
  }
}
