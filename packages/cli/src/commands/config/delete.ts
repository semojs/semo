import { Utils } from '@semo/core'
import path from 'path'

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'semo'
export const command = 'delete <configKey>'
export const desc = 'Delete configs by key'
export const aliases = 'del'
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('delete')
}

export const handler = async function (argv: any) {
  if (Utils._.isString(argv.configKey)) {
    argv.configKey = argv.configKey.split('.')
  }

  const scriptName= argv.scriptName || 'semo'
  let configPath
  if (argv.global) {
    configPath = process.env.HOME ? path.resolve(process.env.HOME, '.' + scriptName, '.' + scriptName + 'rc.yml') : ''
  } else {
    configPath = path.resolve(process.cwd(), '.' + scriptName + 'rc.yml')
  }

  if (!configPath || !Utils.fs.existsSync(configPath)) {
    Utils.error('Config file not found.')
    return
  }

  const rcFile = Utils.fs.readFileSync(configPath, 'utf8')
  const config = Utils.yaml.parseDocument(rcFile)
  const tmpConfigObject = Utils._.set({}, argv.configKey, 1)

  // Recursively find and change
  walk(config.contents, tmpConfigObject)

  Utils.fs.writeFileSync(configPath, config.toString())
  console.log(Utils.chalk.green(`${configPath} updated!`))
}


const walk = (map: any, configKey) => {
  const currentKey = Object.keys(configKey)[0]
  if (map.items) {
    for (let pairKey in map.items) {
      const pair = map.items[pairKey]
      if (pair.key.value === currentKey) {
        if (!Utils._.isObject(configKey[pair.key.value])) {
          map.items.splice(pairKey, 1)
        } else if (pair.value.items) {
          walk(pair.value, configKey[pair.key.value])
        }
      }
    }
  }

  return
}