import { deepGet, deepSet } from '@semo/core'
import { existsSync, readFileSync } from 'node:fs'
import yaml from 'yaml'
import { resolveConfigPath } from './utils.js'

export const plugin = 'semo'
export const command = 'get <configKey>'
export const desc = 'Get configs by key'

export const builder = function (_yargs: any) {}

export const handler = async function (argv: any) {
  if (typeof argv.configKey === 'string') {
    argv.configKey = argv.configKey.split('.')
  }

  const configPath = resolveConfigPath(argv.scriptName, argv.global)

  if (!configPath || !existsSync(configPath)) {
    argv.$error('Config file not found.')
    return
  }

  const rcFile = readFileSync(configPath, 'utf8')
  const config = yaml.parse(rcFile)
  const keyPath = argv.configKey.join('.')
  const found = deepGet(config, keyPath)

  if (found) {
    const tmpConfig = deepSet({}, keyPath, found)
    console.log(yaml.stringify(tmpConfig))
  } else {
    argv.$warn('Config not found by key: ' + keyPath)
  }
}
