import { Utils } from '@semo/core'
import path from 'path'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'list'
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
  for (var i = 0; i < str_len; i++) {
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
  const plugins = Utils.getAllPluginsMapping(argv)
  if (Object.keys(plugins).length === 0) {
    Utils.warn('No plugins found.')
    Utils.info(`Use ${Utils.chalk.bold.green('plugin install')} sub command to install plugins.`)
    // Utils.info(`Use ${Utils.chalk.bold.green('plugin list --remote')} to see available plugins.`)

    return
  }

  if (!argv.remote) {
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
    Utils.info('Remote plugins list may be unavailable temporarily...')
    console.log()

    const headers = ['Plugin', 'Version', 'Description', 'Status'].map(item => Utils.chalk.green(item))
    const rows = [headers]

    let searched = await Utils.shell.exec('npm search semo-plugin --no-description --registry http://registry.npmjs.org --json', { silent: true, timeout: 30000 })
    let results: any = JSON.parse(searched.stdout ? searched.stdout : '')
    results.length > 0 && results.sort((a, b) => a.name.localeCompare(b.name))
    for (let item of results) {
      rows.push([
        item.name,
        item.version,
        cutstr(item.description, 50),
        plugins[item.name] ? 'Installed' : 'Not installed']
      )
    }
    Utils.outputTable(rows)
  }

}
