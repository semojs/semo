import { Utils } from '@semo/core'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'install <pluginName>'
export const desc = 'Install plugin'
export const aliases = 'i'
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('scope', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('local', { describe: 'Install plugin to current project, otherwise install to global directory' })
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
    Utils.installPackage(argv.plugin, '', false)
  } else {
    Utils.installPackage(argv.plugin, '', true)
  }
}
