import { Utils } from '@semo/core'

export const plugin = 'hook'
export const disabled = false // Set to true to disable this command temporarily
export const command = 'info <hook> [module]'
export const desc = 'Show hookinfo'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('info')
}

export const handler = async function (argv: any) {
  if (!argv.hook) {
    Utils.error('A hook is required.')
  }

  if (argv.hook.startsWith('hook_')) {
    argv.hook = argv.hook.substring(5)
  }

  let hookInfo
  if (!argv.module) {
    hookInfo = await Utils.invokeHook(argv.hook, { mode: 'group' }, argv)
  } else {
    hookInfo = await Utils.invokeHook(argv.hook, {
      include: Utils._.castArray(argv.module),
      mode: 'replace',
    }, argv)
  }
  Utils.log(hookInfo)
}
