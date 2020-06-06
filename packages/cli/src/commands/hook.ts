import { Utils } from '@semo/core'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'hook'
export const desc = 'Hook management'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  const argv: any = Utils.getInternalCache().get('argv') || {}
  const scriptName = argv.scriptName || 'semo'

  Utils.extendSubCommand('hook', scriptName, yargs, __dirname)
}

export const handler = async function (argv: any) {
  if (argv._.length === 1) {
    Utils.info(`The ${Utils.chalk.bold.green('hook')} command is for checking hooks.`)
    Utils.info(`Use ${Utils.chalk.green('hook help')} to see supported operations.`)
  }
}
