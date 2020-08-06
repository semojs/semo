import { Utils } from '@semo/core'
import path from 'path'

const debug = Utils.debug('semo:')

export const noblank = true // run call another command so disable one blank line
export const plugin = 'semo'
export const disabled = false // Set to true to disable this command temporarily
export const command = 'run <plugin>'
export const desc = 'Run any plugin command directly'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('force', { describe: 'Force upgrade plugin cache', alias: 'F' })
  yargs.option('scope', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('with', { describe: 'Set plugin dependent plugins' })
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

  argv.with = argv.with ? Utils._.castArray(argv.with) : []

  if (argv.with && argv.with.length > 0) {
    argv.with.forEach(dep => {
      if (dep.indexOf(`${scriptName}-plugin-`) === -1) {
        dep = `${scriptName}-plugin-${dep}`
      }
    
      if (argv.scope) {
        dep = `@${argv.scope}/${dep}`
      }
  
      try {
        Utils.installPackage(dep, 'run-plugin-cache', true, argv.force)
      } catch (e) {
        Utils.error(`Plugin ${dep} not found or entry not exist`)
      }
    })
  }

  try {
    Utils.installPackage(argv.plugin, 'run-plugin-cache', true, argv.force)
  } catch (e) {
    Utils.error(`Plugin ${argv.plugin} not found or entry not exist`)
  }

  // Pass SEMO_PLUGIN_DIR
  let extraPluginDirEnvName = Utils._.upperCase(scriptName) + '_PLUGIN_DIR'
  let runPluginDir = path.resolve(String(process.env.HOME), `.${scriptName}`, 'run-plugin-cache', 'node_modules')

  // Populate command string
  let pluginShort = argv.plugin.substring(argv.plugin.indexOf(`${scriptName}-plugin-`) + `${scriptName}-plugin-`.length)
  let command = argv._
  command.shift()
  if (command.length === 0) {
    command = [pluginShort]
  }
  command = command.concat(argv['--'] || [])

  if (Utils.shell.which('semo')) {
    debug(`Running: ${extraPluginDirEnvName}=${runPluginDir} semo ${command.join(' ')}`)
    Utils.exec(`${extraPluginDirEnvName}=${runPluginDir} semo ${command.join(' ')}`)
  } else {
    debug(`Running: ${extraPluginDirEnvName}=${runPluginDir} npx @semo/cli ${command.join(' ')}`)
    Utils.exec(`${extraPluginDirEnvName}=${runPluginDir} npx @semo/cli ${command.join(' ')}`)
  }
}

