import { Utils } from '@semo/core'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'config <op>'
export const desc = 'Manage rc config'
export const aliases = 'cfg'
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('global', {
    alias: 'g',
    describe: 'For reading/writing configs from/to global yml rc file, default is false'
  })

  const argv: any = Utils.getInternalCache().get('argv') || {}
  const scriptName = argv.scriptName || 'semo'


  Utils.extendSubCommand('config', scriptName, yargs, __dirname)
}

export const handler = async function (argv: any) {
}
