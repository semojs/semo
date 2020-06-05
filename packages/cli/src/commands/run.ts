import { Utils } from '@semo/core'
import path from 'path'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'run <PLUGIN> [COMMAND...]'
export const desc = 'Run any plugin command directly'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('UPGRADE', { describe: 'force upgrade plugin cache' })
  yargs.option('SCOPE', { default: '', describe: 'Set plugin npm scope' })
  // yargs.commandDir('run')
}

export const handler = async function (argv: any) {
  const scriptName= argv.scriptName || 'semo'

  if (argv.PLUGIN.indexOf(`${scriptName}-plugin-`) === -1) {
    argv.PLUGIN = `${scriptName}-plugin-${argv.PLUGIN}`
  }

  if (argv.SCOPE) {
    argv.PLUGIN = `@${argv.SCOPE}/${argv.PLUGIN}`
  }

  let plugin
  try {
    plugin = Utils.importPackage(argv.PLUGIN, 'run-plugin-cache', true, argv.UPGRADE)
  } catch (e) {
    Utils.error('Plugin not found')
  }

  if (!argv.COMMAND || argv.COMMAND.length === 0) {
    // If command option not provided, it's a conversion that you can call the module exported handler mothod
    // If handler not exist, run command will failed
    if (plugin.handler) {
      await plugin.handler(argv)
    } else {
      Utils.error('Default handler not found.')
      return
    }
  } else {
    const rc = Utils.loadPluginRc(argv.PLUGIN, 'run-plugin-cache')

    let command
    try {
      command = require(path.resolve(rc.dirname, rc.commandDir, argv.COMMAND.join('/')))
    } catch (e) {
      Utils.error('Command not found')
    }

    await command.handler(argv)
  }
}
