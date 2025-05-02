import { spawn } from 'child_process'
import { existsSync } from 'node:fs'
import path from 'path'
import shell from 'shelljs'

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'semo'
export const command = ['list', '$0']
export const desc = 'List configs'
export const aliases = ['ls', 'l']

export const builder = function (yargs: any) {
  yargs.option('watch', {
    describe: 'Watch config change, maybe only work on Mac',
    alias: ['w'],
  })
}

export const handler = async function (argv: any) {
  const scriptName = argv.scriptName
  let configPath: string
  if (argv.global) {
    configPath = process.env.HOME
      ? path.resolve(
          process.env.HOME,
          '.' + scriptName,
          '.' + scriptName + 'rc.yml'
        )
      : ''
  } else {
    configPath = path.resolve(process.cwd(), '.' + scriptName + 'rc.yml')
  }

  if (!configPath || !existsSync(configPath)) {
    argv.$error('Config file not found.')
    return
  }

  if (argv.watch) {
    if (!shell.which('watch')) {
      argv.$error('watch mode depends on watch command which is not found.')
      return
    }
    spawn(`watch cat ${configPath}`, {
      stdio: 'inherit',
      shell: true,
    })
  } else {
    spawn(`cat ${configPath} | less -r`, {
      stdio: 'inherit',
      shell: true,
    })
  }
}
