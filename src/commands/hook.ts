import yargs from 'yargs'
import { Utils } from '..'

exports.command = 'hook'
exports.desc = 'Show hook info'

exports.builder = function(yargs: yargs.Argv) {}

exports.handler = function(argv: yargs.Arguments) {
  Utils.co(function*() {
    const hookInfo = yield Utils.invokeHook('hook', {
      mode: 'group'
    })
    const columns = [['Hook', 'Package', 'Description']]
    Object.keys(hookInfo).map(k => {
      Object.keys(hookInfo[k]).map(hook => {
        let realHook
        if (k === 'zignis') {
          realHook = hook
        } else {
          let pluginShortName = k.substring('zignis-plugin-'.length)
          realHook = hook.indexOf(`${pluginShortName}_`) === 0 ? hook : `${pluginShortName}_${hook}`
        }
        columns.push([`hook_${realHook}`, k, hookInfo[k][hook]])
      })
    })
    Utils.log(Utils.table(columns))
  }).catch(e => Utils.error(e.stack))
}
