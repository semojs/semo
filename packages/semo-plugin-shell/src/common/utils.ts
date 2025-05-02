import { error, splitByChar, success, warn } from '@semo/core'
import { ensureDirSync } from 'fs-extra'
import {
  closeSync,
  createWriteStream,
  openSync,
  readFileSync,
  statSync,
} from 'node:fs'
import repl from 'node:repl'
import { REPLServer } from 'node:repl'
import shell from 'shelljs'

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
        shell.exec(cmd)
      }
    } catch (e) {
      if (argv.debug) {
        error(e.stack)
      } else {
        error(e.message)
      }
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

  const Home = process.env.HOME + `/.${argv.scriptName}`
  ensureDirSync(Home)
  replHistory(r, `${Home}/.${argv.scriptName}_shell_history`)

  Object.keys(context).forEach((key) => {
    r.context[key] = context[key]
  })

  corepl(r)
}
