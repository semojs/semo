import {
  ArgvExtraOptions,
  colorize,
  error,
  Hook,
  outputTable,
} from '@semo/core'

export const plugin = 'hook'
export const command = ['list', '$0']
export const desc = 'Show hook list'
export const aliases = ['ls']

export const builder = function (_yargs: any) {}

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
    for (const [k, hookValue] of Object.entries(
      hookInfo as Record<string, any>
    )) {
      let hookHandler: any
      if (
        hookValue instanceof Hook ||
        (hookValue.getHook && typeof hookValue.getHook === 'function')
      ) {
        hookHandler = hookValue.getHook(k)
      } else {
        hookHandler = hookValue
      }

      for (const [hook, desc] of Object.entries(hookHandler)) {
        columns.push([`hook_${hook}`, k, desc as string])
      }
    }
    outputTable(columns)
  } catch (e: unknown) {
    error(e instanceof Error ? e.stack || e.message : String(e))
  }
}
