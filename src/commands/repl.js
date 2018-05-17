const chalk = require('chalk')
const path = require('path')
const fs = require('fs')
const repl = require('repl')
const co = require('co')

const Utils = require('../common/utils')

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
      cmd = 'co(function *() { _ = ' + cmd + '; _ ? Utils.log(_) : null;})'
    } else if (cmd.match(/\W*yield\s+/)) {
      cmd = 'co(function *() {' + cmd.replace(/^\s*var\s+/, '') + '});'
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
}

exports.handler = function (argv) {
  co(function * () {
    const plugins = Utils.getAllPluginsMapping()
    let pluginsReturn = {}

    for (let i = 0; i < Object.keys(plugins).length; i++) {
      let plugin = Object.keys(plugins)[i]
      if (fs.existsSync(path.resolve(plugins[plugin], 'index.js'))) {
        const loadedPlugin = require(path.resolve(plugins[plugin], 'index.js'))
        if (loadedPlugin.repl && typeof loadedPlugin.repl === 'function') {
          let pluginReturn = yield loadedPlugin.repl()
          pluginsReturn = Object.assign(pluginsReturn, pluginReturn)
        }
      }
    }

    return yield openRepl(pluginsReturn)
  })
}
