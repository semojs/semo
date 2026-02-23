import { ArgvExtraOptions, success, info } from '@semo/core'
import { existsSync } from 'node:fs'

export const plugin = 'semo'
export const command = ['cleanup', 'clean']
export const desc = 'Remove plugin manifest cache'

export const builder = function (yargs: any) {
  yargs.option('global', {
    alias: 'g',
    type: 'boolean',
    default: false,
    describe: 'Remove global manifest instead of local',
  })
}

export const handler = async function (argv: ArgvExtraOptions) {
  const paths = argv.$core.getManifestPaths()

  if (argv.global) {
    if (existsSync(paths.global)) {
      argv.$core.clearPluginCache()
      success('Global manifest removed.')
    } else {
      info('Global manifest not found, nothing to remove.')
    }
  } else {
    if (existsSync(paths.local)) {
      argv.$core.clearLocalPluginCache()
      success('Local manifest removed.')
    } else {
      info('Local manifest not found, nothing to remove.')
    }
  }
}
