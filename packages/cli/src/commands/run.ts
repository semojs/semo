import { Utils } from '@semo/core'
import path from 'path'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'run [command...]'
export const desc = 'Run any plugin command directly'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('upgrade', { describe: 'force upgrade plugin cache' })
  yargs.option('scope', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('plugin', { default: '', describe: 'Set plugin name' })
  // yargs.commandDir('run')
}

export const handler = async function (argv: any) {
  const scriptName= argv.scriptName || 'semo'
  if (argv.plugin.indexOf(`${scriptName}-plugin-`) === -1) {
    argv.plugin = `${scriptName}-plugin-${argv.plugin}`
  }

  if (argv.scope) {
    argv.plugin = `@${argv.scope}/${argv.plugin}`
  }

  let plugin

  try {
    plugin = Utils.importPackage(argv.plugin, 'run-plugin-cache', true, argv.upgrade)
  } catch (e) {
    Utils.error('Plugin not found')
  }

  if (argv.command.length === 0) {
    // If command option not provided, it's a conversion that you can call the module handler
    // If handler not exist, run command will failed
    if (plugin.handler) {
      await plugin.handler(argv)
    } else {
      Utils.error('Default handler not found.')
      return
    }
  } else {
    const rc = Utils.loadPluginRc(argv.plugin, 'run-plugin-cache')

    let command
    try {
      console.log(path.resolve(rc.dirname, rc.commandDir, argv.command.join('/')))
      command = require(path.resolve(rc.dirname, rc.commandDir, argv.command.join('/')))
    } catch (e) {
      Utils.error('Command not found')
    }

    await command.handler(argv)
  }
}
