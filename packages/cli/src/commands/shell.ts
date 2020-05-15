import repl from 'repl'

import { Utils } from '@semo/core'

export const command = 'shell'
export const desc = 'Quick shell'
export const aliases = 'sh'

function corepl(cli: repl.REPLServer) {
  // @ts-ignore
  cli.eval = function coEval(cmd: string, context, filename, callback) {
    const { argv } = context
    cmd = cmd.trim()

    if (['exit', 'quit', 'q'].includes(cmd.replace(/(^\s*)|(\s*$)/g, ''))) {
      Utils.info('Bye.')
      process.exit(0)
    }

    if (!cmd) {
      return callback()
    }

    if (cmd === '?') {
      console.log()
      Utils.outputTable(
        [
          ['quit', 'Quit the shell, alias: exit, q.'],
          ['prefix', 'You can change prefix option at any time.'],
          ['?', 'Show this help info.']
        ],
        'Internal commands:'
      )

      Utils.info(`Current prefix: ${Utils.chalk.yellow(argv.prefix || '[empty]')}`)
      console.log()
      return callback()
    }

    if (cmd.match(/^prefix[\s|=]+/)) {
      let prefix = Utils.splitByChar(cmd, '=')
      prefix.shift()
      argv.prefix = prefix.join(' ').trim()
      Utils.success(
        `Prefix has been changed to: ${argv.prefix || '[empty], so you can run any shell commands now.'}`
      )
      return callback()
    }

    const patternScriptShell = new RegExp(`^${argv.scriptName}\\s+(shell|sh)\\s+`)
    if (
      `${argv.prefix} ${cmd}`.match(patternScriptShell)
    ) {
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
  const r: repl.REPLServer = repl.start({
    prompt: argv.prompt,
    completer: () => {
      // TODO: implments auto completion in REPL by Shell suggestions.
      // For now, it is just for disabling Node completion.
      return []
    }
  })

  const Home = process.env.HOME + `/.${argv.scriptName}`
  Utils.fs.ensureDirSync(Home)
  if (!Utils.fileExistsSyncCache(Home)) {
    Utils.exec(`mkdir -p ${Home}`)
  }
  Utils.replHistory(r, `${Home}/.${argv.scriptName}_shell_history`)

  // @ts-ignore
  // context即为REPL中的上下文环境
  r.context = Object.assign(r.context, context)

  corepl(r)
}

export const builder = function(yargs: any) {
  const argv: any = Utils.getInternalCache().get('argv')
  const scriptName = argv.scriptName || 'semo'

  // Trim leading @ and get org name if exist
  const pkgPureName = Utils._.trimStart(scriptName, '@').split('/')[0]
  
  yargs.option('prompt', {
    default: '$ ',
    describe: 'Prompt for input.'
  })

  yargs.option('prefix', {
    default: pkgPureName,
    describe: 'Make input command a little bit faster.'
  })

  yargs.option('debug', {
    default: false,
    describe: 'Debug mode, show error stack'
  })
}

export const handler = async function(argv) {
  try {
    let context = { argv }
    return await openRepl(context)
  } catch(e) {
    Utils.error(e.stack)
  }
}
