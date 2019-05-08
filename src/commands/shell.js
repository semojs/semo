const replHistory = require('repl.history')
const fs = require('fs')
const repl = require('repl')

const { Utils } = require('../../')

exports.command = 'shell'
exports.desc = 'Shell for Zignis'
exports.aliases = 'sh'

function * openRepl (context) {
  const r = repl.start({
    prompt: context.argv.prompt,
    completer: (line) => {
      // TODO: implments auto completion in REPL by Shell suggestions.
      // For now, it is just for disabling Node completion.
      return []
    }
  })
  const zignisHome = process.env.HOME + '/.zignis'
  if (!fs.existsSync(zignisHome)) {
    Utils.exec(`mkdir -p ${zignisHome}`)
  }
  replHistory(r, `${zignisHome}/.zignis_shell_history`)

  // context即为REPL中的上下文环境
  r.context = Object.assign(r.context, context)

  corepl(r)
}

function corepl (cli) {
  cli.eval = function coEval (cmd, context, filename, callback) {
    if (['exit', 'quit', 'q'].includes(cmd.replace(/(^\s*)|(\s*$)/g, ''))) {
      Utils.info('Bye.')
      process.exit(0)
    }

    if (cmd.match(/^shell\s+/)) {
      Utils.warn('Recursive call shell not allowed!')
      return callback()
    }

    if (cmd.trim() === '?') {
      console.log()
      Utils.outputTable([
        ['quit', 'Quit the shell, alias: exit, q.'],
        ['prefix', 'You can change prefix option at any time.'],
        ['?', 'Show this help info.']
      ], 'Internal commands:')

      Utils.info(`Current prefix: ${Utils.chalk.yellow(context.argv.prefix)}`)
      console.log()
      return callback()
    }

    if (cmd.match(/^prefix[\s|=]+/)) {
      let prefix = Utils.splitByChar(cmd, '=')
      prefix.shift()
      context.argv.prefix = prefix.join(' ').trim()
      Utils.success(`Prefix has been changed to: ${context.argv.prefix || '[empty], so you can run any shell commands now.'}`)
      return callback()
    }

    cmd = `${context.argv.prefix} ${cmd}`.trim()

    try {
      cmd && Utils.exec(cmd)
    } catch (e) {
      if (context.argv.debug) {
        Utils.error(e.stack, false)
      } else {
        Utils.error(e.message, false)
      }
    }

    return callback()
  }

  return cli
}

exports.builder = function (yargs) {
  yargs.option('prompt', {
    default: '$ ',
    describe: 'Prompt for input.'
  })

  yargs.option('prefix', {
    default: 'zignis',
    describe: 'Make input zignis command a little bit faster.'
  })

  yargs.option('debug', {
    default: false,
    describe: 'Debug mode, show error stack'
  })
}

exports.handler = function (argv) {
  Utils.co(function * () {
    let context = { argv }

    return yield openRepl(context)
  }).catch(e => Utils.error(e.stack))
}
