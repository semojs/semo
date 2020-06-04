import { Utils } from '@semo/core'

export const command = 'status'
export const aliases = 'st'
export const desc = 'Show environment status info'

export const builder = function(yargs) {
}

export const handler = async function(argv: any) {
  const scriptName = argv.scriptName || 'semo'
  try {
    const hookStatus = await Utils.invokeHook('status', { mode: 'group' })

    Object.keys(hookStatus).forEach((key) => {
      const kvs = hookStatus[key] ? hookStatus[key] : {}
      const columns: string[][] = []
      if (Object.keys(kvs).length > 0) {
        Object.keys(kvs).map(k => columns.push([k, kvs[k]]))
        Utils.outputTable(columns, key === scriptName ? '' : key)
      }
    })

    process.exit(0)
  } catch(e) {
    Utils.error(e.stack)
  }
}
