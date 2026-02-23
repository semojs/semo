import { error, replHistory, splitByChar, success, warn } from '@semo/core'
import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import repl from 'node:repl'

export function corepl(cli: repl.REPLServer) {
  // @ts-ignore
  cli.eval = function coEval(cmd: string, context, filename, callback) {
    const { argv } = context
    cmd = cmd.trim()

    if (!cmd) {
      return callback()
    }

    if (cmd.match(/^prefix[\s|=]+/) || cmd.trim() === 'prefix') {
      const prefix = splitByChar(cmd, '=')
      prefix.shift()
      argv.prefix = prefix.join(' ').trim()
      success(
        `Prefix has been changed to: ${
          argv.prefix || '[empty], so you can run any shell commands now.'
        }`
      )

      // if (argv.prefix) {
      //   cli._initialPrompt = `${argv.prefix}:${argv.prompt}`
      // } else {
      //   cli._initialPrompt = `${argv.prompt}`
      // }
      return callback()
    }

    const patternScriptShell = new RegExp(
      `^${argv.scriptName}\\s+(shell|sh)\\s+`
    )
    if (`${argv.prefix} ${cmd}`.match(patternScriptShell)) {
      warn('Recursive call shell not allowed!')
      return callback()
    }

    const patternScript = new RegExp(`^${argv.scriptName}\\s+`)
    if (`${argv.prefix} ${cmd}`.match(patternScript)) {
      cmd = `${argv.prefix} ${cmd} --exec-mode`
    } else {
      cmd = `${argv.prefix} ${cmd}`
    }

    try {
      if (cmd) {
        execSync(cmd, { stdio: 'inherit' })
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? argv.debug
            ? e.stack || e.message
            : e.message
          : String(e)
      error(msg)
    }

    return callback()
  }

  return cli
}

export async function openRepl(context: any): Promise<any> {
  const { argv } = context
  const prefix = argv.prefix || ''
  const r = repl.start({
    prompt: prefix ? `${prefix}:${argv.prompt}` : argv.prompt,
    completer: (line: string) => {
      const completions =
        '.break .clear .exit .save .load .editor prefix'.split(' ')
      const hits = completions.filter((c) => c.startsWith(line))
      // 如果没有匹配，则显示所有补全。
      return [hits.length ? hits : completions, line]
    },
  })

  const homeDir = path.resolve(process.env.HOME || '', `.${argv.scriptName}`)
  mkdirSync(homeDir, { recursive: true })
  replHistory(r, path.resolve(homeDir, `.${argv.scriptName}_shell_history`))

  for (const [key, value] of Object.entries(context)) {
    r.context[key] = value
  }

  corepl(r)
}
