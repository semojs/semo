import { ArgvExtraOptions, error, exec } from '@semo/core'
import _ from 'lodash'
import { openSync, unlinkSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import shell from 'shelljs'

export const noblank = true // run call another command so disable one blank line
export const plugin = 'semo'
export const disabled = false // Set to true to disable this command temporarily
export const command = 'run [plugin]'
export const desc = 'Run any plugin command directly'

export const builder = function (yargs: any) {
  yargs.option('force', {
    describe: 'Force upgrade plugin cache',
    alias: 'F',
    boolean: true,
    default: false,
  })
  yargs.option('scope', { default: '', describe: 'Set plugin npm scope' })
  yargs.option('with', { describe: 'Set plugin dependent plugins' })
}

export const handler = async function (
  argv: ArgvExtraOptions & { [key: string]: any }
) {
  const scriptName = argv.scriptName || 'semo'

  // Populate command string
  let pluginShort: string
  if (argv.plugin) {
    if (argv.plugin.indexOf(`${scriptName}-plugin-`) === -1) {
      argv.plugin = `${scriptName}-plugin-${argv.plugin}`
    }

    if (argv.scope) {
      argv.plugin = `@${argv.scope}/${argv.plugin}`
    }

    try {
      argv.$core.installPackage(
        argv.plugin,
        'run-plugin-cache',
        true,
        argv.force
      )
    } catch {
      error(`Plugin ${argv.plugin} not found or entry not exist`)
    }

    pluginShort = argv.plugin.substring(
      argv.plugin.indexOf(`${scriptName}-plugin-`) +
        `${scriptName}-plugin-`.length
    )
  }

  argv.with = argv.with ? _.castArray(argv.with) : []

  if (argv.with && argv.with.length > 0) {
    argv.with.forEach((dep: string) => {
      if (dep.indexOf(`${scriptName}-plugin-`) === -1) {
        dep = `${scriptName}-plugin-${dep}`
      }

      if (argv.scope) {
        dep = `@${argv.scope}/${dep}`
      }

      try {
        argv.$core.installPackage(dep, 'run-plugin-cache', true, argv.force)
      } catch {
        error(`Plugin ${dep} not found or entry not exist`)
      }
    })
  }

  // Pass SEMO_PLUGIN_DIR
  const extraPluginDirEnvName = _.upperCase(scriptName) + '_PLUGIN_DIR'
  const runPluginDir = path.resolve(
    String(process.env.HOME),
    `.${scriptName}`,
    'run-plugin-cache',
    'node_modules'
  )

  let command = argv._
  command.shift()
  if (command.length === 0 && pluginShort) {
    command = [pluginShort]
  }
  command = command.concat(argv['--'] || [])

  const fifoPath = path.join(os.tmpdir(), `${scriptName}-stdin-${Date.now()}`)

  try {
    writeFileSync(fifoPath, argv.$input || '')
    if (shell.which(scriptName)) {
      argv.$debugCoreChannel(
        'run',
        `Running: ${extraPluginDirEnvName}=${runPluginDir} ${scriptName} ${command.join(
          ' '
        )}`
      )
      exec(
        `${extraPluginDirEnvName}=${runPluginDir} ${scriptName} ${command.join(' ')}`,
        {
          stdio: [openSync(fifoPath, 'r'), 'inherit', 'inherit'],
          shell: true,
        }
      )
    } else {
      argv.$debugCoreChannel(
        'run',
        `Running: ${extraPluginDirEnvName}=${runPluginDir} npx @semo/cli ${command.join(
          ' '
        )}`
      )
      exec(
        `${extraPluginDirEnvName}=${runPluginDir} npx @semo/cli ${command.join(
          ' '
        )}`,
        {
          stdio: [openSync(fifoPath, 'r'), 'inherit', 'inherit'],
          shell: true,
        }
      )
    }
  } catch (e) {
    if (argv.verbose) {
      error(e)
    } else {
      error(e.message)
    }
  } finally {
    unlinkSync(fifoPath)
  }
}
