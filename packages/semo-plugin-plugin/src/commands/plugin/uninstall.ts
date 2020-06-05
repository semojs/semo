import { Utils } from '@semo/core'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'uninstall <plugin>'
export const desc = 'Uninstall plugin'
export const aliases = 'un'
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('scope', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('local', { default: false, describe: 'Uninstall plugin from local directory, otherwise uninstall from global directory' })
  // yargs.commandDir('install')
}

export const handler = async function (argv: any) {
  const scriptName= argv.scriptName || 'semo'

  if (argv.plugin.indexOf(`${scriptName}-plugin-`) === -1) {
    argv.plugin = `${scriptName}-plugin-${argv.plugin}`
  }

  if (argv.scope) {
    argv.plugin = `@${argv.scope}/${argv.plugin}`
  }

  if (argv.local) {
    Utils.uninstallPackage(argv.plugin, '', false)
  } else {
    Utils.uninstallPackage(argv.plugin, '', true)
  }
}
