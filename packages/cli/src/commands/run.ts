import { Utils } from '@semo/core'
import path from 'path'

export const plugin = 'semo'
export const disabled = false // Set to true to disable this command temporarily
export const command = 'run <PLUGIN>'
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

  try {
    Utils.installPackage(argv.PLUGIN, 'run-plugin-cache', true, argv.UPGRADE)
  } catch (e) {
    Utils.error(`Plugin ${plugin} not found or entry not exist`)
  }

  // Pass SEMO_PLUGIN_DIR
  let extraPluginDirEnvName = Utils._.upperCase(scriptName) + '_PLUGIN_DIR'
  let runPluginDir = path.resolve(String(process.env.HOME), `.${scriptName}`, 'run-plugin-cache', 'node_modules')

  // Populate command string
  let pluginShort = argv.PLUGIN.substring(argv.PLUGIN.indexOf(`${scriptName}-plugin-`) + `${scriptName}-plugin-`.length)
  let command = argv._
  command.shift()
  if (command.length === 0) {
    command = [pluginShort]
  }
  command = command.concat(argv['--'] || [])
  Utils.info(`Running: ${extraPluginDirEnvName}=${runPluginDir} semo ${command.join(' ')}`)
  Utils.exec(`${extraPluginDirEnvName}=${runPluginDir} semo ${command.join(' ')}`)
}

