import { Argv, ArgvExtraOptions, error, exec, warn } from '@semo/core'
import { existsSync } from 'node:fs'
import path from 'path'
import shell from 'shelljs'

export const plugin = 'semo'
export const command = 'plugin <name>'
export const desc = 'Generate a plugin structure'
export const aliases = ['p']

export const builder = function (yargs: Argv) {
  yargs.option('force', {
    describe: 'force creation, remove existed one',
    alias: 'f',
  })
}

export const handler = function (
  argv: ArgvExtraOptions & { [key: string]: any }
) {
  const pluginDir = argv.pluginMakeDir || argv.pluginDir
  if (!pluginDir || !existsSync(pluginDir)) {
    error(
      '"pluginDir" missing in config file or not exist in current directory!'
    )
  }

  const namePattern = /[a-z][a-z0-9-]+/
  if (!namePattern.test(argv.name)) {
    error('Plugin name invalid!')
  }

  const scriptName = argv.scriptName || 'semo'
  const pluginPath = path.resolve(
    pluginDir,
    `${scriptName}-plugin-${argv.name}`
  )
  if (existsSync(pluginPath)) {
    if (argv.force) {
      warn(
        `Existed ${scriptName}-plugin-${argv.name} is deleted before creating a new one!`
      )
      shell.rm('-rf', pluginPath)
    } else {
      error(`Destination existed, command abort!`)
    }
  }

  shell.mkdir('-p', pluginPath)
  shell.cd(pluginPath)
  if (!shell.which(scriptName)) {
    error(`Script ${scriptName} not found!`)
  }
  shell.exec('npm init --yes', () => {
    exec(`${scriptName} init --pm npm --plugin`)
  })
}
