import { Utils } from '@semo/core'
import path from 'path'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'list'
export const desc = 'list'
export const aliases = ['l', 'ls']
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
}

export const handler = async function (argv: any) {
  const plugins = Utils.getAllPluginsMapping()

  const headers = ['Plugin', 'Version', 'Location', 'Status'].map(item => Utils.chalk.green(item))
  const rows = [headers]
  Object.keys(plugins).forEach(plugin => {
    let pluginVersion
    if (Utils.fileExistsSyncCache(path.resolve(plugins[plugin], 'package.json'))) {
      const pkgConfig: any = require(path.resolve(plugins[plugin], 'package.json'))
      pluginVersion = pkgConfig.version || 'Unknown'
    }

    let pluginLocation
    if (process.env.HOME && plugins[plugin].indexOf(process.env.HOME) === 0) {
      pluginLocation = plugins[plugin].replace(process.env.HOME, '~')
    } else {
      pluginLocation = plugins[plugin]
    }

    rows.push([plugin, pluginVersion, pluginLocation, 'Enabled'])
  })

  Utils.outputTable(rows)
}
