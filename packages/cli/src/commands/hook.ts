import { Utils } from '@semo/core'

export const command = 'hook'
export const desc = 'Show hook info'

export const builder = function(yargs) {}

export const handler = async function(argv: any) {
  try {
    const hookInfo = await Utils.invokeHook('hook', {
      mode: 'group'
    })
    const columns = [['Hook', 'Package', 'Description']]
    Object.keys(hookInfo).map(k => {
      Object.keys(hookInfo[k]).map(hook => {
        let realHook
        if (k === argv.scriptName) {
          realHook = hook
        } else {
          let pluginShortName = k.substring(`${argv.scriptName}-plugin-`.length)
          realHook = hook.indexOf(`${pluginShortName}_`) === 0 ? hook : `${pluginShortName}_${hook}`
        }
        columns.push([`hook_${realHook}`, k, hookInfo[k][hook]])
      })
    })
    Utils.log(Utils.table(columns))
  } catch (e) {
    Utils.error(e.stack)
  }
}
