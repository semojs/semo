import { Utils } from '@semo/core'
import path from 'path'
import fs from 'fs-extra'
import yaml from 'yaml'

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'semo'
export const command = 'get <configKey>'
export const desc = 'Get configs by key'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('get')
}

export const handler = async function (argv: any) {
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

  if (!configPath || !fs.existsSync(configPath)) {
    Utils.error('Config file not found.')
    return
  }

  const rcFile = fs.readFileSync(configPath, 'utf8')
  const config = yaml.parse(rcFile)
  const found = Utils._.get(config, argv.configKey)

  if (found) {
    const tmpConfig = Utils._.set({}, argv.configKey, found)
    console.log(yaml.stringify(tmpConfig))
  } else {
    Utils.warn('Config not found by key: ' + argv.configKey.join('.'))
  }
}
