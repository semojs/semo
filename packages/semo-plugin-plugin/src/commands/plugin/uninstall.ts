import { Argv, ArgvExtraOptions } from '@semo/core'
import _ from 'lodash'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'uninstall <plugin...>'
export const desc = 'Uninstall plugins'
export const aliases = 'un'

export const builder = function (yargs: Argv) {
  yargs.option('scope', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('local', {
    default: false,
    describe:
      'Uninstall plugin from local directory, otherwise uninstall from global directory',
  })
}

export const handler = async function (
  argv: ArgvExtraOptions & { [key: string]: any }
) {
  const scriptName = argv.scriptName || 'semo'

  argv.plugin = _.castArray(argv.plugin)
  argv.plugin = argv.plugin.map((plugin) => {
    if (plugin.indexOf(`${scriptName}-plugin-`) === -1) {
      plugin = `${scriptName}-plugin-${plugin}`
    }

    if (argv.scope) {
      plugin = `@${argv.scope}/${plugin}`
    }

    return plugin
  })

  argv.$core.uninstallPackage(argv.plugin, 'home-plugin-cache', true)
}
