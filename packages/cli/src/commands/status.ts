import { error, outputTable, type ArgvExtraOptions } from '@semo/core'

export const plugin = 'semo'
export const command = 'status'
export const aliases = 'st'
export const desc = 'Show environment status info'

export const builder = function () {}

export const handler = async function (argv: ArgvExtraOptions) {
  const scriptName = argv.scriptName || 'semo'
  try {
    const hookStatus = (await argv.$core.invokeHook(`${scriptName}:status`, {
      mode: 'group',
    })) as Record<string, Record<string, string>>

    for (const [key, kvs] of Object.entries(hookStatus)) {
      if (!kvs || Object.keys(kvs).length === 0) continue
      const columns: string[][] = []
      for (const [k, v] of Object.entries(kvs)) {
        columns.push([k, v])
      }
      outputTable(columns, key === scriptName ? '' : key)
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    error(msg)
  }
}
