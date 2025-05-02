import _ from 'lodash'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'path'
import yaml, { Document } from 'yaml'

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'semo'
export const command =
  'set <configKey> <configValue> [configComment] [configType]'
export const desc = 'Set config by key'

export const builder = function (yargs: any) {
  yargs.positional('configType', {
    default: 'string',
    choices: ['string', 'number', 'int', 'integer', 'boolean', 'bool'],
  })
  // yargs.option('option', { default, describe, alias })
}

function ensureDirSync(dirPath: string) {
  try {
    mkdirSync(dirPath, { recursive: true })
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
}

export const handler = async function (argv: any) {
  switch (argv.configType) {
    case 'bool':
    case 'boolean':
      argv.configValue = Boolean(argv.configValue)
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

  if (_.isString(argv.configKey)) {
    argv.configKey = argv.configKey.split('.')
  }

  const scriptName = argv.$scriptName
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

  if (!argv.global && !existsSync(configPath)) {
    argv.$error(
      'Config file not found. you need to create config file manually to prove you know what you are doing.'
    )
    return
  }

  if (argv.global && !configPath) {
    argv.$error('Global config file path not recognized.')
    return
  }

  if (argv.global && configPath && !existsSync(path.dirname(configPath))) {
    ensureDirSync(path.dirname(configPath))
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
    // config.contents = config.createNode({}, undefined)
  }

  const tmpConfigObject = _.set({}, argv.configKey, argv.configValue)

  // Recursively find and change
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
        if (!_.isObject(configKey[pair.key.value])) {
          console.log('pair.value', pair.value)
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

    if (map && _.isArray(map.items)) {
      map.items.push(pair)
    } else {
      // config.contents = pair
      config.add(pair)
    }
  }

  return
}

const walkComment = (
  map: any,
  configKey: Record<string, any>,
  comment: string
) => {
  if (_.isString(configKey)) {
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
