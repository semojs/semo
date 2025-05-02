import { outputTable, type ArgvExtraOptions } from '@semo/core'

export const plugin = 'semo'
export const command = 'status'
export const aliases = 'st'
export const desc = 'Show environment status info'

export const builder = function () {}

export const handler = async function (argv: ArgvExtraOptions) {
  const scriptName = argv.scriptName || 'semo'
  try {
    const hookStatus = (await argv.$core?.invokeHook(`${scriptName}:status`, {
      mode: 'group',
    })) as Record<string, Record<string, string>>

    Object.keys(hookStatus).forEach((key) => {
      const kvs = hookStatus[key] ? hookStatus[key] : {}
      const columns: string[][] = []
      if (Object.keys(kvs).length > 0) {
        Object.keys(kvs).map((k) => columns.push([k, kvs[k]]))
        outputTable(columns, key === scriptName ? '' : key)
      }
    })
  } catch (e) {
    console.log(e)
  }
}
