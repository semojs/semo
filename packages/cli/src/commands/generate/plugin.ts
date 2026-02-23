import { Argv, ArgvExtraOptions, error, execPromise, warn } from '@semo/core'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'path'

export const plugin = 'semo'
export const command = 'plugin <name>'
export const desc = 'Generate a plugin structure'
export const aliases = 'p'

export const builder = function (yargs: Argv) {
  yargs.option('force', {
    describe: 'force creation, remove existed one',
    alias: 'f',
  })
}

export const handler = async function (
  argv: ArgvExtraOptions & { [key: string]: any }
) {
  const pluginDir = argv.pluginMakeDir || argv.pluginDir
  if (!pluginDir || !existsSync(pluginDir)) {
    error(
      '"pluginDir" missing in config file or not exist in current directory!'
    )
    return
  }

  const namePattern = /^[a-z][a-z0-9-]+$/
  if (!namePattern.test(argv.name)) {
    error('Plugin name invalid!')
    return
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
      rmSync(pluginPath, { recursive: true, force: true })
    } else {
      error(`Destination existed, command abort!`)
      return
    }
  }

  mkdirSync(pluginPath, { recursive: true })

  const result = spawnSync('which', [scriptName], { stdio: 'ignore' })
  if (result.status !== 0) {
    error(`Script ${scriptName} not found!`)
    return
  }

  await execPromise('npm init --yes', { cwd: pluginPath })
  await execPromise(`${scriptName} init --pm npm --plugin`, { cwd: pluginPath })
}
