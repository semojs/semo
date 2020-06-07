import { Utils } from '@semo/core'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'info <hook>'
export const desc = 'Show hookinfo'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('info')
}

export const handler = async function (argv: any) {
  if (argv.hook.startsWith('hook_')) {
    argv.hook = argv.hook.substring(5)
  }
  const hookInfo = await Utils.invokeHook(argv.hook, { mode: 'group' })
  Utils.log(hookInfo)
}
