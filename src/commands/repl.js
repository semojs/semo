const chalk = require('chalk')
const repl = require('repl')
const replHistory = require('repl.history')
const fs = require('fs')
const _ = require('lodash')

const { Utils } = require('../../')

exports.command = 'repl'
exports.aliases = 'r'
exports.desc = 'Play with REPL'

function * openRepl (context) {
  const r = repl.start('>>> ')
  const zignisHome = process.env.HOME + '/.zignis'
  if (!fs.existsSync(zignisHome)) {
    Utils.exec(`mkdir -p ${zignisHome}`)
  }
  replHistory(r, `${zignisHome}/.zignis_history`)

  // context即为REPL中的上下文环境
  r.context = Object.assign(r.context, context)

  corepl(r)
}

function corepl (cli) {
  var originalEval = cli.eval

  cli.eval = function coEval (cmd, context, filename, callback) {
    if (['exit', 'quit', 'q'].includes(cmd.replace(/(^\s*)|(\s*$)/g, ''))) {
      console.log(chalk.yellow('Bye!'))
      process.exit(0)
    }

    if (cmd.match(/^yield\s+/)) {
      cmd = 'Utils.co(function *() { let _ = ' + cmd + '; return _;})'
    } else if (cmd.match(/\W*yield\s+/)) {
      cmd = 'Utils.co(function *() {' + cmd.replace(/^\s*(var|let|const)\s+/, '') + '})'
    }

    if (cmd.match(/^await\s+/)) {
      cmd = '(async function() { let _ = ' + cmd + '; return _;})()'
    } else if (cmd.match(/\W*await\s+/)) {
      cmd = '(async function() {' + cmd.replace(/^\s*(var|let|const)\s+/, '') + '})()'
    }

    originalEval.call(cli, cmd, context, filename, function (err, res) {
      if (err || !res || typeof res.then !== 'function') {
        return callback(err, res)
      } else {
        return res.then(done, callback)
      }
    })

    function done (val) {
      return callback(null, val)
    }
  }

  return cli
}

exports.builder = function (yargs) {
  yargs.option('hook', {
    default: false,
    describe: 'if or not load all plugins repl hook'
  })
}

exports.handler = function (argv) {
  argv.hook = argv.hook || _.get(Utils.getCombinedConfig(), 'commandDefault.repl.hook') || false
  Utils.co(function * () {
    let context = { Utils, argv }

    if (argv.hook) {
      const pluginsReturn = yield Utils.invokeHook('repl')
      context = Object.assign(context, pluginsReturn)
    }

    return yield openRepl(context)
  }).catch(e => Utils.error(e.stack))
}
