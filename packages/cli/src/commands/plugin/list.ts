import { Utils } from '@semo/core'
import path from 'path'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'list'
export const desc = 'list'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
}

export const handler = async function (argv: any) {
  const plugins = Utils.getAllPluginsMapping()

  const headers = ['Plugin', 'Version', 'Status'].map(item => Utils.chalk.green(item))
  const rows = [headers]
  Object.keys(plugins).forEach(plugin => {
    let pluginVersion
    if (Utils.fileExistsSyncCache(path.resolve(plugins[plugin], 'package.json'))) {
      const pkgConfig: any = require(path.resolve(plugins[plugin], 'package.json'))
      pluginVersion = pkgConfig.version || 'Unknown'
    }
    rows.push([plugin, pluginVersion, 'Enabled'])
  })

  Utils.outputTable(rows)
}
