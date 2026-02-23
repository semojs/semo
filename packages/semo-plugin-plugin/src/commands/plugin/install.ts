import { ArgvExtraOptions } from '@semo/core'

export const command = 'install <plugin...>'
export const desc = 'Install plugins'
export const aliases = 'i'

export const builder = function (yargs: any) {
  yargs.option('scope', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('force', { describe: 'Force reinstall' })
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

  argv.$core.installPackage(argv.plugin, 'home-plugin-cache', true, argv.force)
}
