import { Argv, ArgvExtraOptions } from '@semo/core'

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

  argv.plugin = Array.isArray(argv.plugin) ? argv.plugin : [argv.plugin]
  argv.plugin = argv.plugin.map((plugin) => {
    if (!plugin.includes(`${scriptName}-plugin-`)) {
      plugin = `${scriptName}-plugin-${plugin}`
    }

    if (argv.scope) {
      plugin = `@${argv.scope}/${plugin}`
    }

    return plugin
  })

  argv.$core.uninstallPackage(argv.plugin, 'home-plugin-cache', true)
}
