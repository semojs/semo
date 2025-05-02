import {
  ArgvExtraOptions,
  colorize,
  error,
  Hook,
  outputTable,
} from '@semo/core'
import _ from 'lodash'

export const plugin = 'hook'
export const command = ['list', '$0']
export const desc = 'Show hook list'
export const aliases = ['ls']

export const builder = function (_yargs) {}

export const handler = async function (argv: ArgvExtraOptions) {
  const scriptName = argv.scriptName || 'semo'
  try {
    const hookInfo = await argv.$core.invokeHook(
      `${scriptName}:hook`,
      {
        mode: 'group',
      },
      argv
    )

    const columns = [
      ['Hook', 'Package', 'Description'].map((item) => colorize('green', item)),
    ]
    Object.keys(hookInfo).map((k) => {
      let hookHandler: any
      if (
        hookInfo[k] instanceof Hook ||
        (hookInfo[k].getHook && _.isFunction(hookInfo[k].getHook))
      ) {
        hookHandler = hookInfo[k].getHook(k)
      } else {
        hookHandler = hookInfo[k]
      }

      Object.keys(hookHandler).map((hook) => {
        columns.push([`hook_${hook}`, k, hookHandler[hook]])
      })
    })
    outputTable(columns)
  } catch (e) {
    error(e.stack)
  }
}
