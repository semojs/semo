import { ArgvExtraOptions, error, jsonLog } from '@semo/core'
import _ from 'lodash'

export const plugin = 'hook'
export const disabled = false // Set to true to disable this command temporarily
export const command = 'info <hook> [module]'
export const desc = 'Show hookinfo'

export const builder = function (_yargs: any) {}

export const handler = async function (
  argv: ArgvExtraOptions | { [key: string]: any }
) {
  if (!argv.hook) {
    error('A hook is required.')
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
        include: _.castArray(argv.module),
        mode: 'replace',
      },
      argv
    )
  }
  jsonLog(hookInfo)
}
