import { ArgvExtraOptions, success, info } from '@semo/core'

export const plugin = 'semo'
export const command = ['cache', '$0']
export const desc = 'Generate plugin manifest cache'

export const builder = function (yargs: any) {
  yargs.option('global', {
    alias: 'g',
    type: 'boolean',
    default: false,
    describe: 'Generate global manifest instead of local',
  })
  yargs.option('local', {
    alias: 'l',
    type: 'boolean',
    default: false,
    describe:
      'Only scan plugins in current project (skip global and home plugins)',
  })
}

export const handler = async function (argv: ArgvExtraOptions) {
  const plugins = await argv.$core.generateManifest({
    global: argv.global,
    local: argv.local,
  })
  const count = Object.keys(plugins).length
  const target = argv.global ? 'global' : 'local'
  if (count > 0) {
    success(`Generated ${target} manifest with ${count} plugin(s).`)
  } else {
    info(`Generated ${target} manifest with no plugins.`)
  }
}
