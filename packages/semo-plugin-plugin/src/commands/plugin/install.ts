import { Utils } from '@semo/core'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'install <plugin...>'
export const desc = 'Install plugins'
export const aliases = 'i'
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('scope', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('force', { describe: 'Force reinstall' })
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

  Utils.installPackage(argv.plugin, 'home-plugin-cache', true, argv.force)
}
