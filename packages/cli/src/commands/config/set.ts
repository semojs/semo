import { deepSet } from '@semo/core'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'path'
import yaml, { Document } from 'yaml'
import { resolveConfigPath } from './utils.js'

export const plugin = 'semo'
export const command =
  'set <configKey> <configValue> [configComment] [configType]'
export const desc = 'Set config by key'

export const builder = function (yargs: any) {
  yargs.positional('configType', {
    default: 'string',
    choices: ['string', 'number', 'int', 'integer', 'boolean', 'bool'],
  })
}

export const handler = async function (argv: any) {
  switch (argv.configType) {
    case 'bool':
    case 'boolean':
      argv.configValue = argv.configValue === 'true' || argv.configValue === '1'
      break
    case 'int':
    case 'integer':
    case 'number':
      argv.configValue = Number(argv.configValue)
      break
    case 'string':
      argv.configValue = String(argv.configValue)
      break
  }

  if (typeof argv.configKey === 'string') {
    argv.configKey = argv.configKey.split('.')
  }

  const configPath = resolveConfigPath(argv.scriptName, argv.global)

  if (!argv.global && !existsSync(configPath)) {
    argv.$error(
      'Config file not found. You need to create config file manually to prove you know what you are doing.'
    )
    return
  }

  if (argv.global && !configPath) {
    argv.$error('Global config file path not recognized.')
    return
  }

  if (argv.global && configPath && !existsSync(path.dirname(configPath))) {
    mkdirSync(path.dirname(configPath), { recursive: true })
  }

  let config
  if (existsSync(configPath)) {
    const rcFile = readFileSync(configPath, 'utf8')
    config = yaml.parseDocument(rcFile)
  } else {
    config = yaml.parseDocument('')
    config.commentBefore = ` THIS IS SEMO(@semo/cli)'s RC FILE.
 YOU CAN EDIT THIS FILE MANUALLY OR USE semo config COMMAND.
 RUN semo config help TO SEE RELATED COMMANDS.
`
    config.add(config.createNode({}, undefined))
  }

  const tmpConfigObject = deepSet(
    {},
    argv.configKey.join('.'),
    argv.configValue
  )
  walk(config.contents, tmpConfigObject, config, argv.configComment)

  writeFileSync(configPath, config.toString())
  argv.$success(`${configPath} updated!`)
}

const walk = (
  map: any,
  configKey: Record<string, any>,
  config: Document,
  comment: string
) => {
  const currentKey = Object.keys(configKey)[0]

  let found = false
  if (map && map.items && map.items.length > 0) {
    for (const pair of map.items) {
      if (pair.key.value === currentKey) {
        found = true
        if (
          !(
            typeof configKey[pair.key.value] === 'object' &&
            configKey[pair.key.value] !== null
          )
        ) {
          pair.value.value = configKey[pair.key.value]
          if (comment) {
            pair.value.comment = comment
          }
        } else if (pair.value.items) {
          walk(pair.value, configKey[pair.key.value], config, comment)
        }
      }
    }
  }

  if (!found) {
    const pair = config.createPair(currentKey, configKey[currentKey])
    walkComment(pair.value, configKey[currentKey], comment)

    if (map && Array.isArray(map.items)) {
      map.items.push(pair)
    } else {
      config.add(pair)
    }
  }
}

const walkComment = (
  map: any,
  configKey: Record<string, any>,
  comment: string
) => {
  if (typeof configKey === 'string') {
    if (comment) {
      map.comment = comment
    }
  } else {
    const nextKey = Object.keys(configKey)[0]

    if (map && map.items && map.items.length > 0) {
      for (const pair of map.items) {
        if (pair.key.value === nextKey) {
          walkComment(pair.value, configKey[pair.key.value], comment)
        }
      }
    }
  }
}
