import { Utils } from '@semo/core'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'uninstall <plugin...>'
export const desc = 'Uninstall plugins'
export const aliases = 'un'
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('scope', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('local', {
    default: false,
    describe:
      'Uninstall plugin from local directory, otherwise uninstall from global directory',
  })
  // yargs.commandDir('install')
}

export const handler = async function (argv: any) {
  const scriptName = argv.scriptName || 'semo'

  argv.plugin = Utils._.castArray(argv.plugin)
  argv.plugin = argv.plugin.map(plugin => {
    if (plugin.indexOf(`${scriptName}-plugin-`) === -1) {
      plugin = `${scriptName}-plugin-${plugin}`
    }

    if (argv.scope) {
      plugin = `@${argv.scope}/${plugin}`
    }

    return plugin
  })

  Utils.uninstallPackage(argv.plugin, 'home-plugin-cache', true)
}
