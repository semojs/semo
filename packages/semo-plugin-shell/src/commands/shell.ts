import repl from 'repl'
import fs from 'fs-extra'
import { Utils } from '@semo/core'

let r: any // repl instance

export const plugin = 'shell'
export const command = 'shell'
export const desc = 'Quick shell'
export const aliases = 'sh'

function corepl(cli: repl.REPLServer) {
  // @ts-ignore
  cli.eval = function coEval(cmd: string, context, filename, callback) {
    const { argv } = context
    cmd = cmd.trim()

    if (!cmd) {
      return callback()
    }

    if (cmd.match(/^prefix[\s|=]+/) || cmd.trim() === 'prefix') {
      let prefix = Utils.splitByChar(cmd, '=')
      prefix.shift()
      argv.prefix = prefix.join(' ').trim()
      Utils.success(
        `Prefix has been changed to: ${
          argv.prefix || '[empty], so you can run any shell commands now.'
        }`,
      )

      if (argv.prefix) {
        r._initialPrompt = `${argv.prefix}:${argv.prompt}`
      } else {
        r._initialPrompt = `${argv.prompt}`
      }
      return callback()
    }

    const patternScriptShell = new RegExp(
      `^${argv.scriptName}\\s+(shell|sh)\\s+`,
    )
    if (`${argv.prefix} ${cmd}`.match(patternScriptShell)) {
      Utils.warn('Recursive call shell not allowed!')
      return callback()
    }

    const patternScript = new RegExp(`^${argv.scriptName}\\s+`)
    if (`${argv.prefix} ${cmd}`.match(patternScript)) {
      cmd = `${argv.prefix} ${cmd} --exec-mode`
    } else {
      cmd = `${argv.prefix} ${cmd}`
    }

    try {
      cmd && Utils.exec(cmd)
    } catch (e) {
      if (argv.debug) {
        Utils.error(e.stack, false)
      } else {
        Utils.error(e.message, false)
      }
    }

    return callback()
  }

  return cli
}

async function openRepl(context: any): Promise<any> {
  const { argv } = context
  const prefix = argv.prefix || ''

  r = repl.start({
    prompt: prefix ? `${prefix}:${argv.prompt}` : argv.prompt,
    completer: line => {
      const completions =
        '.break .clear .exit .save .load .editor prefix'.split(' ')
      const hits = completions.filter(c => c.startsWith(line))
      // 如果没有匹配，则显示所有补全。
      return [hits.length ? hits : completions, line]
    },
  })

  const Home = process.env.HOME + `/.${argv.scriptName}`
  fs.ensureDirSync(Home)
  Utils.replHistory(r, `${Home}/.${argv.scriptName}_shell_history`)

  // @ts-ignore
  // context即为REPL中的上下文环境
  r.context = Object.assign(r.context, context)

  corepl(r)
}

export const builder = function (yargs: any) {
  yargs.option('prompt', {
    describe: 'Prompt for input.',
  })

  yargs.option('prefix', {
    describe: 'Make input command a little bit faster.',
  })

  yargs.option('debug', {
    describe: 'Debug mode, show error stack',
  })
}

export const handler = async function (argv) {
  const scriptName = argv.scriptName || 'semo'

  const { Utils } = argv.$semo
  argv.prefix = Utils.pluginConfig('prefix', scriptName)
  argv.prompt = Utils.pluginConfig('prompt', '$ ')
  argv.debug = Utils.pluginConfig('debug', false)

  try {
    let context = { argv }
    await openRepl(context)
    return false
  } catch (e) {
    Utils.error(e.stack)
  }

  return true
}
