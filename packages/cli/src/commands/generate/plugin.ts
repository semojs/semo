import path from 'path'
import { Utils } from '@semo/core'

export const plugin = 'semo'
export const command = 'plugin <name>'
export const desc = 'Generate a plugin structure'
export const aliases = ['plug']

export const builder = function(yargs) {
  yargs.option('force', {
    describe: 'force creation, remove existed one',
    alias: 'f'
  })
}

export const handler = function(argv: any) {
  let pluginDir = argv.pluginMakeDir || argv.pluginDir
  if (!pluginDir || !Utils.fileExistsSyncCache(pluginDir)) {
    Utils.error('"pluginDir" missing in config file or not exist in current directory!')
  }

  const namePattern = /[a-z0-9]+/
  if (!namePattern.test(argv.name)) {
    Utils.error('Plugin name invalid!')
  }

  const scriptName = argv.scriptName || 'semo'
  const pluginPath = path.resolve(pluginDir, `${scriptName}-plugin-${argv.name}`)
  if (Utils.fileExistsSyncCache(pluginPath)) {
    if (argv.force) {
      Utils.warn(`Existed ${scriptName}-plugin-${argv.name} is deleted before creating a new one!`)
      Utils.shell.rm('-rf', pluginPath)
    } else {
      Utils.error(`Destination existed, command abort!`)
    }
  }

  Utils.shell.mkdir('-p', pluginPath)
  Utils.shell.cd(pluginPath)
  if (!Utils.shell.which(scriptName)) {
    Utils.error(`Script ${scriptName} not found!`)
  }
  Utils.exec('npm init --yes')
  Utils.exec(`${scriptName} init --plugin`)
}
