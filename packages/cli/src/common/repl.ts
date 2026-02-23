import {
  ArgvExtraOptions,
  deepGet,
  error,
  formatRcOptions,
  replHistory,
  splitComma,
  success,
} from '@semo/core'
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'path'
import repl, { REPLServer } from 'repl'
import { Context } from 'vm'
import yargsParser from 'yargs-parser'

const RESERVED_REPL_COMMANDS = [
  'break',
  'clear',
  'editor',
  'exit',
  'help',
  'history',
  'load',
  'reload',
  'save',
]

export const reload = async (
  replServer: REPLServer,
  argv: ArgvExtraOptions & { [key: string]: any }
) => {
  const scriptName = argv.scriptName || 'semo'
  let pluginsReturn = await argv.$core.invokeHook<Record<string, any>>(
    `${scriptName}:repl`,
    typeof argv.hook === 'boolean'
      ? { reload: true, mode: 'group' }
      : { mode: 'group', include: splitComma(argv.hook), reload: true }
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
  replServer.context.Semo.hooks = formatRcOptions(pluginsReturn)

  if (argv.extract && argv.extract.length > 0) {
    for (const keyPath of argv.extract) {
      const extracted = deepGet(replServer.context, keyPath as string) || {}
      for (const [key, value] of Object.entries(
        extracted as Record<string, any>
      )) {
        replServer.context[key] = value
      }
    }
  }

  const hookReplCommands =
    await argv.$core.invokeHook<Record<string, any>>('semo:repl_command')
  for (const [command, handler] of Object.entries(hookReplCommands)) {
    if (!RESERVED_REPL_COMMANDS.includes(command)) {
      replServer.defineCommand(command, handler as any)
    }
  }

  success('Hooked files reloaded.')
}

export const extract = (
  replServer: REPLServer,
  obj: Record<string, any>,
  keys: string[] | string = [],
  newObjName: string = ''
) => {
  if (!keys || keys.length === 0) {
    for (const [key, value] of Object.entries(obj)) {
      if (value) {
        Object.defineProperty(replServer.context, key, { value })
      }
    }
  } else {
    const keysCast = Array.isArray(keys) ? keys : [keys]
    for (const key of keysCast) {
      const splitExtractKey = key.split('.')
      const finalExtractKey = splitExtractKey.at(-1)!
      const value = deepGet(obj, key)
      if (value) {
        if (!newObjName) {
          Object.defineProperty(replServer.context, finalExtractKey, { value })
        } else {
          if (!replServer.context[newObjName]) {
            replServer.context[newObjName] = {}
          }
          Object.defineProperty(
            replServer.context[newObjName],
            finalExtractKey,
            { value }
          )
        }
      }
    }
  }
}

export async function openRepl(context: Record<string, any>): Promise<any> {
  const { Semo } = context
  const argv = Semo.argv as ArgvExtraOptions
  const r = repl.start({
    prompt: argv.prompt as string,
    ignoreUndefined: true,
  })

  r.defineCommand('reload', {
    help: 'Reload hooked files',
    async action() {
      this.clearBufferedCommand()
      try {
        await reload(r, argv)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        error(msg)
      }
      this.displayPrompt()
    },
  })

  r.defineCommand('shell', {
    help: 'Execute shell commands',
    action(cmd) {
      this.clearBufferedCommand()
      try {
        spawnSync(cmd, { stdio: 'inherit', shell: true })
      } catch {}
      this.displayPrompt()
    },
  })

  const requireAction = async function (this: REPLServer, input: string) {
    this.clearBufferedCommand()
    try {
      const opts = yargsParser(input)
      const packages: Record<string, string> = {}
      for (const part of opts._) {
        if (typeof part === 'string') {
          const split = part.split(':')
          packages[split[0]] = split.length > 1 ? split[1] : split[0]
        }
      }
      for (const [pack, alias] of Object.entries(packages)) {
        const imported = await importPackage(argv)(pack)
        Object.defineProperty(r.context, alias, { value: imported })
      }
    } catch {}
    this.displayPrompt()
  }

  r.defineCommand('require', {
    help: 'Require npm packages',
    action: requireAction,
  })

  r.defineCommand('import', {
    help: 'Import npm packages',
    action: requireAction,
  })

  const hookReplCommands =
    await argv.$core.invokeHook<Record<string, any>>('semo:repl_command')
  for (const [command, handler] of Object.entries(hookReplCommands)) {
    if (!RESERVED_REPL_COMMANDS.includes(command)) {
      r.defineCommand(command, handler as any)
    }
  }

  const homeDir = path.resolve(String(process.env.HOME), `.${argv.scriptName}`)
  mkdirSync(homeDir, { recursive: true })
  replHistory(r, path.resolve(homeDir, `.${argv.scriptName}_repl_history`))

  Object.assign(r.context, context)
  r.context.Semo.repl = r
  r.context.Semo.extract = (
    obj: Record<string, any>,
    keys: string[] | string = [],
    newObjName: string = ''
  ) => {
    extract(r, obj, keys, newObjName)
  }

  corepl(r)
}

export const corepl = (cli: REPLServer) => {
  const originalEval = cli.eval

  // @ts-ignore - monkey-patching REPL eval for async/await support
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
