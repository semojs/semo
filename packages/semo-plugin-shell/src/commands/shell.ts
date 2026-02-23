import { ArgvExtraOptions, error } from '@semo/core'
import { openRepl } from '../common/utils.js'

export const plugin = 'shell'
export const command = 'shell'
export const desc = 'Quick shell'
export const aliases = 'sh'

export const builder = function (yargs: any) {
  yargs.option('prompt', {
    describe: 'Prompt for input.',
    default: '$ ',
  })

  yargs.option('prefix', {
    describe: 'Make input command a little bit faster.',
  })

  yargs.option('debug', {
    describe: 'Debug mode, show error stack',
  })
}

export const handler = async function (argv: ArgvExtraOptions) {
  const scriptName = argv.scriptName || 'semo'
  argv.prefix = argv.$core.getPluginConfig('prefix', scriptName)
  argv.prompt = argv.$core.getPluginConfig('prompt', '$ ')
  argv.debug = argv.$core.getPluginConfig('debug', false)

  try {
    const context = { argv }
    await openRepl(context)
    return false
  } catch (e: unknown) {
    error(e instanceof Error ? e.stack || e.message : String(e))
  }

  return true
}
