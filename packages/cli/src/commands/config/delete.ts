import _ from 'lodash'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'path'
import yaml from 'yaml'

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'semo'
export const command = 'delete <configKey>'
export const desc = 'Delete configs by key'
export const aliases = 'del'

export const builder = function (_yargs: any) {
  // yargs.option('option', { default, describe, alias })
}

export const handler = async function (argv: any) {
  if (_.isString(argv.configKey)) {
    argv.configKey = argv.configKey.split('.')
  }

  const scriptName = argv.scriptName
  let configPath
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

  const rcFile = readFileSync(configPath, 'utf8')
  const config = yaml.parseDocument(rcFile)

  // 检查要删除的配置键是否存在
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

  const tmpConfigObject = _.set({}, argv.configKey, 1)

  // Recursively find and change
  walk(config.contents, tmpConfigObject)

  writeFileSync(configPath, config.toString())
  argv.$success(`${configPath} updated!`)
}

const walk = (map: any, configKey: Record<string, any>) => {
  const currentKey = Object.keys(configKey)[0]
  if (map.items) {
    for (const pairKey in map.items) {
      const pair = map.items[pairKey]
      if (pair.key.value === currentKey) {
        if (!_.isObject(configKey[pair.key.value])) {
          map.items.splice(pairKey, 1)
        } else if (pair.value.items) {
          walk(pair.value, configKey[pair.key.value])
        }
      }
    }
  }

  return
}
