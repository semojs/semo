import { Utils } from '@semo/core'
import path from 'path'

export const plugin = 'semo'
export const disabled = false // Set to true to disable this command temporarily
export const command = 'run <PLUGIN> [COMMAND...]'
export const desc = 'Run any plugin command directly'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('UPGRADE', { describe: 'Force upgrade plugin cache', alias: 'UP' })
  yargs.option('SCOPE', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('DEP', { describe: 'Set plugin dependent plugins' })
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

  argv.DEP = argv.DEP ? Utils._.castArray(argv.DEP) : []

  if (argv.DEP && argv.DEP.length > 0) {
    argv.DEP.forEach(dep => {
      if (dep.indexOf(`${scriptName}-plugin-`) === -1) {
        dep = `${scriptName}-plugin-${dep}`
      }
    
      if (argv.SCOPE) {
        dep = `@${argv.SCOPE}/${dep}`
      }
  
      try {
        Utils.installPackage(dep, 'run-plugin-cache', true, argv.UPGRADE)
      } catch (e) {
        Utils.error(`Plugin ${dep} not found or entry not exist`)
      }
    })
  }

  let plugin
  try {
    plugin = Utils.importPackage(argv.PLUGIN, 'run-plugin-cache', true, argv.UPGRADE)
  } catch (e) {
    Utils.error(`Plugin ${plugin} not found or entry not exist`)
  }

  let extraPluginDirEnvName = Utils._.upperCase(scriptName) + '_PLUGIN_DIR'
  let runPluginDir = path.resolve(String(process.env.HOME), `.${scriptName}`, 'run-plugin-cache', 'node_modules')

  process.env[extraPluginDirEnvName] = runPluginDir
  if (!argv.COMMAND || argv.COMMAND.length === 0) {
    // If command option not provided, it's a conversion that you can call the module exported handler mothod
    // If handler not exist, run command will failed
    if (plugin.handler) {
      await plugin.handler(argv)
    } else {
      Utils.error(`Plugin ${plugin}'s default handler not found`)
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
