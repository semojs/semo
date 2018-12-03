const chalk = require('chalk')
const repl = require('repl')
const co = require('co')

const { Utils } = require('../../')

exports.command = 'repl'
exports.aliases = 'r'
exports.desc = 'Play with REPL'

function * openRepl (pluginsReturn) {
  const r = repl.start('>>> ')

  // context即为REPL中的上下文环境
  r.context.co = co
  r.context.Utils = Utils

  r.context = Object.assign(r.context, pluginsReturn)

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
      cmd = 'co(function *() { let _ = ' + cmd + '; return _;})'
    } else if (cmd.match(/\W*yield\s+/)) {
      cmd = 'co(function *() {' + cmd.replace(/^\s*(var|let|const)\s+/, '') + '})'
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

exports.builder = function (yargs) {}

exports.handler = function (argv) {
  co(function * () {
    const pluginsReturn = yield Utils.invokeHook('repl')
    return yield openRepl(pluginsReturn)
  }).catch(function (e) {
    Utils.error(e.stack)
  })
}
