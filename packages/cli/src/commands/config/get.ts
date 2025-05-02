import _ from 'lodash'
import { existsSync, readFileSync } from 'node:fs'
import path from 'path'
import yaml from 'yaml'

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'semo'
export const command = 'get <configKey>'
export const desc = 'Get configs by key'

export const builder = function (_yargs: any) {
  // yargs.option('option', { default, describe, alias })
}

export const handler = async function (argv: any) {
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

  if (!configPath || !existsSync(configPath)) {
    argv.$error('Config file not found.')
    return
  }

  const rcFile = readFileSync(configPath, 'utf8')
  const config = yaml.parse(rcFile)
  const found = _.get(config, argv.configKey)

  if (found) {
    const tmpConfig = _.set({}, argv.configKey, found)
    console.log(yaml.stringify(tmpConfig))
  } else {
    argv.$warn('Config not found by key: ' + argv.configKey.join('.'))
  }
}
