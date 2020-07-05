export const plugin = 'hook'
export const command = ['list', '$0']
export const desc = 'Show hook list'
export const aliases = ['ls']

export const builder = function(yargs) {}

export const handler = async function(argv: any) {
  const { Utils } = argv.$semo
  const scriptName = argv.scriptName || 'semo'
  try {
    const hookInfo = await Utils.invokeHook(`${scriptName}:hook`, {
      mode: 'group'
    }, argv)

    const columns = [['Hook', 'Package', 'Description'].map(item => Utils.chalk.green(item))]
    Object.keys(hookInfo).map(k => {

      let hookHandler
      if (hookInfo[k] instanceof Utils.Hook || hookInfo[k].getHook && Utils._.isFunction(hookInfo[k].getHook)) {
        hookHandler = hookInfo[k].getHook(k)
      } else {
        hookHandler = hookInfo[k]
      }

      Object.keys(hookHandler).map(hook => {
        let realHook
        if (k === argv.scriptName) {
          realHook = hook
        } else {
          let pluginShortName = k.substring(`${argv.scriptName}-plugin-`.length)
          realHook = hook.indexOf(`${pluginShortName}_`) === 0 ? hook : `${pluginShortName}_${hook}`
        }
        columns.push([`hook_${realHook}`, k, hookHandler[hook]])
      })
    })
    Utils.outputTable(columns)
  } catch (e) {
    Utils.error(e.stack)
  }
}
