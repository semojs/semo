import {
  Argv,
  ArgvExtraOptions,
  colorize,
  info,
  outputTable,
  warn,
} from '@semo/core'
import { existsSync } from 'fs'
import path from 'path'
import shell from 'shelljs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const disabled = false // Set to true to disable this command temporarily
export const command = ['list', '$0']
export const desc = 'List all plugins'
export const aliases = ['l', 'ls']
// export const middleware = (argv) => {}

export const builder = function (yargs: Argv) {
  yargs.option('remote', { describe: 'List remote plugins' })
}

function cutstr(str, len) {
  let str_length = 0
  let str_len = 0
  let str_cut = new String()
  str_len = str.length
  for (let i = 0; i < str_len; i++) {
    const a = str.charAt(i)
    str_length++
    if (escape(a).length > 4) {
      //中文字符的长度经编码之后大于4
      str_length++
    }
    str_cut = str_cut.concat(a)
    if (str_length >= len) {
      str_cut = str_cut.concat('...')
      return str_cut
    }
  }
  //如果给定字符串小于指定长度，则返回源字符串；
  if (str_length < len) {
    return str
  }
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
    Object.keys(plugins).forEach((plugin) => {
      let pluginVersion
      if (existsSync(path.resolve(plugins[plugin], 'package.json'))) {
        const pkgConfig: any = require(
          path.resolve(plugins[plugin], 'package.json')
        )
        pluginVersion = pkgConfig.version || 'Unknown'
      }

      let pluginLocation
      if (process.env.HOME && plugins[plugin].indexOf(process.env.HOME) === 0) {
        pluginLocation = plugins[plugin].replace(process.env.HOME, '~')
      } else {
        pluginLocation = plugins[plugin]
      }

      rows.push([
        plugin,
        pluginVersion || 'Unknown',
        pluginLocation,
        'Installed',
      ])
    })
    outputTable(rows)
  } else {
    const headers = ['Plugin', 'Version', 'Description', 'Status'].map((item) =>
      colorize('green', item)
    )
    const rows = [headers]

    const searched = shell.exec(
      'curl -s "https://api.npms.io/v2/search?from=0&q=semo-plugin&size=100"',
      { silent: true }
    )

    let { results } = JSON.parse(searched.stdout ? searched.stdout : '')
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
