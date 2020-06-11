import path from 'path'
import { Utils } from '@semo/core'
import { spawn } from 'child_process'

export const disabled = false // Set to true to disable this command temporarily
export const command = ['list', '$0']
export const desc = 'List configs'
export const aliases = ['ls', 'l']
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('list')
}

export const handler = async function (argv: any) {
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

  // const rcFile = Utils.fs.readFileSync(configPath, 'utf8')
  // const config = Utils.yaml.parseDocument(rcFile)

//   config.contents.items.forEach(item => {
//     console.log(item.key, item.value)
//   })
// console.log(config.toString())
//   console.log('Start to draw your dream code!')


  spawn(`cat ${configPath} | less -r`, { 
    stdio: 'inherit',
    shell: true
  })
}
