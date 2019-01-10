
const { Utils } = require('../../')

exports.command = 'hook'
exports.desc = 'Show hook info'
// exports.aliases = ''

exports.builder = function (yargs) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('hook')
}

exports.handler = function (argv) {
  Utils.co(function * () {
    const hookInfo = yield Utils.invokeHook('hook', {
      mode: 'group'
    })
    const columns = [['Package', 'Hook', 'Description']]
    Object.keys(hookInfo).map(k => {
      Object.keys(hookInfo[k]).map(hook => {
        const realHook = k === 'zignis' || hook.indexOf(k) === 0 ? hook : `${k}_${hook}`
        columns.push([k, realHook, hookInfo[k][hook]])
      })
    })
    Utils.log(Utils.table(columns))
  }).catch(e => Utils.error(e.stack))
}
