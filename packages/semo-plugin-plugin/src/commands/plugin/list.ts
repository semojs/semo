import {
  Argv,
  ArgvExtraOptions,
  colorize,
  info,
  outputTable,
  warn,
} from '@semo/core'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'path'

const require = createRequire(import.meta.url)

export const command = ['list', '$0']
export const desc = 'List all plugins'
export const aliases = ['l', 'ls']

export const builder = function (yargs: Argv) {
  yargs.option('remote', { describe: 'List remote plugins' })
}

function cutstr(str: string, len: number): string {
  let displayWidth = 0
  let result = ''
  for (const char of str) {
    displayWidth++
    if (char.charCodeAt(0) > 127) {
      displayWidth++
    }
    result += char
    if (displayWidth >= len) {
      return result + '...'
    }
  }
  return str
}

export const handler = async function (argv: ArgvExtraOptions) {
  const plugins = argv.$core.allPlugins
  const config = argv.$core.combinedConfig

  if (!argv.remote) {
    if (Object.keys(plugins).length === 0) {
      warn('No plugins found.')
      info(
        `Use ${colorize('green', 'plugin install')} sub command to install plugins.`
      )

      return
    }

    const headers = ['Plugin', 'Version', 'Location', 'Status'].map((item) =>
      colorize('green', item)
    )
    const rows = [headers]
    for (const [plugin, pluginPath] of Object.entries(plugins)) {
      let pluginVersion
      if (existsSync(path.resolve(pluginPath, 'package.json'))) {
        const pkgConfig: any = require(path.resolve(pluginPath, 'package.json'))
        pluginVersion = pkgConfig.version || 'Unknown'
      }

      let pluginLocation
      if (process.env.HOME && pluginPath.startsWith(process.env.HOME)) {
        pluginLocation = pluginPath.replace(process.env.HOME, '~')
      } else {
        pluginLocation = pluginPath
      }

      rows.push([
        plugin,
        pluginVersion || 'Unknown',
        pluginLocation,
        'Installed',
      ])
    }
    outputTable(rows)
  } else {
    const headers = ['Plugin', 'Version', 'Description', 'Status'].map((item) =>
      colorize('green', item)
    )
    const rows = [headers]

    const response = await fetch(
      'https://api.npms.io/v2/search?from=0&q=semo-plugin&size=100'
    )
    const data = (await response.json()) as { results: any[] }
    let { results } = data
    results = [
      ...results
        .filter((item) => Boolean(plugins[item.package.name]))
        .sort((a, b) => a.package.name.localeCompare(b.package.name)),
      ...results
        .filter((item) => !Boolean(plugins[item.package.name]))
        .sort((a, b) => a.package.name.localeCompare(b.package.name)),
    ]

    for (const item of results) {
      const hasUpdate = config.pluginConfigs[item.package.name]
        ? item.package.version !==
          config.pluginConfigs[item.package.name].version
        : false
      rows.push([
        item.package.name,
        item.package.version,
        cutstr(item.package.description, 50),
        plugins[item.package.name]
          ? 'Installed' + (hasUpdate ? colorize('yellow', '(update)') : '')
          : 'Not installed',
      ])
    }
    outputTable(rows)
  }
}
