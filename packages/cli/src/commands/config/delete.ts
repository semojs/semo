import { deepSet } from '@semo/core'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import yaml from 'yaml'
import { resolveConfigPath } from './utils.js'

export const plugin = 'semo'
export const command = 'delete <configKey>'
export const desc = 'Delete configs by key'
export const aliases = 'del'

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
  const config = yaml.parseDocument(rcFile)

  const configExists = (map: any, configKey: string[]): boolean => {
    let current = map
    for (const key of configKey) {
      if (!current || !current.items) return false

      const found = current.items.find((item: any) => item.key.value === key)
      if (!found) return false

      current = found.value
    }
    return true
  }

  if (!configExists(config.contents, argv.configKey)) {
    argv.$error(`Config key '${argv.configKey.join('.')}' not found.`)
    return
  }

  if (
    !(await argv.$prompt.confirm({
      message: `Are you sure you want to delete '${argv.configKey.join('.')}'?`,
      default: false,
    }))
  ) {
    argv.$info('User canceled the operation.')
    return
  }

  const tmpConfigObject = deepSet({}, argv.configKey.join('.'), 1)
  walk(config.contents, tmpConfigObject)

  writeFileSync(configPath, config.toString())
  argv.$success(`${configPath} updated!`)
}

const walk = (map: any, configKey: Record<string, any>) => {
  const currentKey = Object.keys(configKey)[0]
  if (map.items) {
    const index = map.items.findIndex(
      (pair: any) => pair.key.value === currentKey
    )
    if (index !== -1) {
      const pair = map.items[index]
      if (
        !(
          typeof configKey[pair.key.value] === 'object' &&
          configKey[pair.key.value] !== null
        )
      ) {
        map.items.splice(index, 1)
      } else if (pair.value.items) {
        walk(pair.value, configKey[pair.key.value])
      }
    }
  }
}
