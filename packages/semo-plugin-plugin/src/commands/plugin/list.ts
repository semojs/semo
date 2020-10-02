import { Utils } from '@semo/core'
import path from 'path'

export const disabled = false // Set to true to disable this command temporarily
export const command = ['list', '$0']
export const desc = 'List all plugins'
export const aliases = ['l', 'ls']
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('remote', { describe: 'List remote plugins' })
}

function cutstr(str, len) {
  let str_length = 0;
  let str_len = 0;
  let str_cut = new String();
  str_len = str.length;
  for (let i = 0; i < str_len; i++) {
    let a = str.charAt(i);
    str_length++;
    if (escape(a).length > 4) {
      //中文字符的长度经编码之后大于4  
      str_length++;
    }
    str_cut = str_cut.concat(a);
    if (str_length >= len) {
      str_cut = str_cut.concat("...");
      return str_cut;
    }
  }
  //如果给定字符串小于指定长度，则返回源字符串；  
  if (str_length < len) {
    return str;
  }
}

export const handler = async function (argv: any) {
  const { Utils } = argv.$semo
  const plugins = Utils.getAllPluginsMapping(argv)
  const config = Utils.getCombinedConfig(argv)

  if (!argv.remote) {
    if (Object.keys(plugins).length === 0) {
      Utils.warn('No plugins found.')
      Utils.info(`Use ${Utils.chalk.bold.green('plugin install')} sub command to install plugins.`)
      // Utils.info(`Use ${Utils.chalk.bold.green('plugin list --remote')} to see available plugins.`)
  
      return
    }
    
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

      rows.push([plugin, pluginVersion, pluginLocation, 'Installed'])
    })
    Utils.outputTable(rows)
  } else {
    const headers = ['Plugin', 'Version', 'Description', 'Status'].map(item => Utils.chalk.green(item))
    const rows = [headers]
    

    let searched = await Utils.shell.exec('curl -s "https://api.npms.io/v2/search?from=0&q=semo-plugin&size=100"', { silent:true })

    let { results } = JSON.parse(searched.stdout ? searched.stdout : '')
    results = [
      ...results.filter(item => Boolean(plugins[item.package.name])).sort((a, b) => a.package.name.localeCompare(b.package.name))
,
      ...results.filter(item => !Boolean(plugins[item.package.name])).sort((a, b) => a.package.name.localeCompare(b.package.name))

    ]

    for (let item of results) {
      const hasUpdate = config.pluginConfigs[item.package.name] ? item.package.version !== config.pluginConfigs[item.package.name].version : false
      rows.push([
        item.package.name,
        item.package.version,
        cutstr(item.package.description, 50),
        plugins[item.package.name] ? 'Installed' + (hasUpdate ? Utils.chalk.yellow('(update)') : '') : 'Not installed']
      )
    }
    Utils.outputTable(rows)
  }

}
