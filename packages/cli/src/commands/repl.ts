import repl from 'repl'
import { Utils } from '@semo/core'

function corepl(cli: repl.REPLServer) {
  var originalEval = cli.eval

  // @ts-ignore
  cli.eval = function coEval(cmd, context, filename, callback) {
    if (cmd.trim() === '?') {
      console.log()
      Utils.outputTable(
        [
          ['quit', 'Quit the REPL, alias: exit, q.'],
          ['await', 'Run generator or promise function.'],
          ['?', 'Show this help info.']
        ],
        'Internal commands:'
      )

      console.log()
      return callback()
    }

    if (['exit', 'quit', 'q'].includes(cmd.replace(/(^\s*)|(\s*$)/g, ''))) {
      console.log(Utils.chalk.yellow('Bye!'))
      process.exit(0)
    }

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

export const command = 'repl'
export const aliases = 'r'
export const desc = 'Play with REPL'

async function openRepl(context: any): Promise<any> {
  const { argv } = context
  const r = repl.start({
    prompt: argv.prompt,
  })

  const Home = process.env.HOME + `/.${argv.scriptName}`
  Utils.fs.ensureDirSync(Home)
  if (!Utils.fileExistsSyncCache(Home)) {
    Utils.exec(`mkdir -p ${Home}`)
  }
  Utils.replHistory(r, `${Home}/.${argv.scriptName}_history`)

  // @ts-ignore
  // context即为REPL中的上下文环境
  r.context = Object.assign(r.context, context)

  corepl(r)
}

export const builder = function(yargs) {
  yargs.option('hook', {
    describe: 'if or not load all plugins repl hook'
  })

  yargs.option('prompt', {
    default: '>>> ',
    describe: 'Prompt for input.'
  })
}

export const handler = async function(argv: any) {
  argv.hook = argv.hook || false
  try {
    let context = { Utils, Semo: Utils, argv, await: true, package: (name) => {
      return Utils.importPackage(name, 'repl-package-cache', true, false)
    } }

    if (argv.hook) {
      const pluginsReturn = await Utils.invokeHook(
        'repl',
        Utils._.isBoolean(argv.hook)
          ? {}
          : {
              include: Utils.splitComma(argv.hook)
            }
      )
      context = Object.assign(context, pluginsReturn)
    }

    return await openRepl(context)
  } catch(e) {
    Utils.error(e.stack)
  }
}
