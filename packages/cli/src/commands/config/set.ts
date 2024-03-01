import { Utils } from '@semo/core'
import path from 'path'
import fs from 'fs-extra'
import yaml from 'yaml'
import { createNode } from 'yaml/dist/util'

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'semo'
export const command =
  'set <configKey> <configValue> [configComment] [configType]'
export const desc = 'Set config by key'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.positional('configType', {
    default: 'string',
    choices: ['string', 'number', 'int', 'integer', 'boolean', 'bool'],
  })
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('get')
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
  }

  if (Utils._.isString(argv.configKey)) {
    argv.configKey = argv.configKey.split('.')
  }

  const scriptName = argv.scriptName || 'semo'
  let configPath
  if (argv.global) {
    configPath = process.env.HOME
      ? path.resolve(
          process.env.HOME,
          '.' + scriptName,
          '.' + scriptName + 'rc.yml',
        )
      : ''
  } else {
    configPath = path.resolve(process.cwd(), '.' + scriptName + 'rc.yml')
  }

  if (!argv.global && !fs.existsSync(configPath)) {
    Utils.error(
      'Config file not found. you need to create config file manually to prove you know what you are doing.',
    )
    return
  }

  if (argv.global && !configPath) {
    Utils.error('Global config file path not recognized.')
    return
  }

  if (argv.global && configPath && !fs.existsSync(path.dirname(configPath))) {
    fs.ensureDirSync(path.dirname(configPath))
  }

  let config
  if (fs.existsSync(configPath)) {
    const rcFile = fs.readFileSync(configPath, 'utf8')
    config = yaml.parseDocument(rcFile)
  } else {
    config = yaml.parseDocument('')

    config.commentBefore = ` THIS IS SEMO(@semo/cli)'s RC FILE.
 YOU CAN EDIT THIS FILE MANUALLY OR USE semo config COMMAND.
 RUN semo config help TO SEE RELATED COMMANDS.
`
    // config.contents = createNode({}, undefined, )
  }

  const tmpConfigObject = Utils._.set({}, argv.configKey, argv.configValue)

  // Recursively find and change
  walk(config.contents, tmpConfigObject, config, argv.configComment)

  fs.writeFileSync(configPath, config.toString())
  console.log(Utils.color.green(`${configPath} updated!`))
}

const walk = (map: any, configKey, config, comment) => {
  const currentKey = Object.keys(configKey)[0]

  let found = false
  if (map && map.items && map.items.length > 0) {
    for (let pair of map.items) {
      if (pair.key.value === currentKey) {
        found = true
        if (!Utils._.isObject(configKey[pair.key.value])) {
          pair.value = configKey[pair.key.value]
          pair.comment = comment
        } else if (pair.value.items) {
          walk(pair.value, configKey[pair.key.value], config, comment)
        }
      }
    }
  }

  if (!found) {
    const pair = config.schema.createPair(currentKey, configKey[currentKey])
    walkComment(pair.value, configKey[currentKey], comment)

    if (map && Utils._.isArray(map.items)) {
      map.items.push(pair)
    } else {
      config.contents = pair
    }
  }

  return
}

const walkComment = (map, configKey, comment) => {
  if (Utils._.isString(configKey)) {
    map.comment = comment
  } else {
    const nextKey = Object.keys(configKey)[0]

    if (map && map.items && map.items.length > 0) {
      for (let pair of map.items) {
        if (pair.key.value === nextKey) {
          walkComment(pair.value, configKey[pair.key.value], comment)
        }
      }
    }
  }
}
