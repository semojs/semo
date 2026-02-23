import { ArgvExtraOptions, fatal, jsonLog } from '@semo/core'

export const plugin = 'hook'
export const command = 'info <hook> [module]'
export const desc = 'Show hookinfo'

export const builder = function (_yargs: any) {}

export const handler = async function (
  argv: ArgvExtraOptions | { [key: string]: any }
) {
  if (!argv.hook) {
    fatal('A hook is required.')
  }

  if (argv.hook.startsWith('hook_')) {
    argv.hook = argv.hook.substring(5)
  }

  let hookInfo: any
  if (!argv.module) {
    hookInfo = await argv.$core.invokeHook(argv.hook, { mode: 'group' }, argv)
  } else {
    hookInfo = await argv.$core.invokeHook(
      argv.hook,
      {
        include: Array.isArray(argv.module) ? argv.module : [argv.module],
        mode: 'replace',
      },
      argv
    )
  }
  jsonLog(hookInfo)
}
