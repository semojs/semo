import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolveConfigPath } from './utils.js'

export const plugin = 'semo'
export const command = ['list', '$0']
export const desc = 'List configs'
export const aliases = ['ls', 'l']

export const builder = function (yargs: any) {
  yargs.option('watch', {
    describe: 'Watch config change (requires watch command)',
    alias: ['w'],
  })
}

export const handler = async function (argv: any) {
  const configPath = resolveConfigPath(argv.scriptName, argv.global)

  if (!configPath || !existsSync(configPath)) {
    argv.$error('Config file not found.')
    return
  }

  if (argv.watch) {
    const result = spawnSync('which', ['watch'], { stdio: 'ignore' })
    if (result.status !== 0) {
      argv.$error('watch mode depends on watch command which is not found.')
      return
    }
    spawn('watch', ['cat', configPath], { stdio: 'inherit' })
  } else {
    spawn('less', ['-r', configPath], { stdio: 'inherit' })
  }
}
