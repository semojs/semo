import path from 'path'
import { Utils } from '@semo/core'
import { spawn } from 'child_process'

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'semo'
export const command = ['list', '$0']
export const desc = 'List configs'
export const aliases = ['ls', 'l']
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('watch', { describe: 'Watch config change, maybe only work on Mac' })
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

  if (argv.watch && Utils.shell.which('watch')) {
    spawn(`watch cat ${configPath}`, { 
      stdio: 'inherit',
      shell: true
    })
  } else {
    spawn(`cat ${configPath} | less -r`, { 
      stdio: 'inherit',
      shell: true
    })
  }
}
