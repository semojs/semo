import { Utils } from '@semo/core'

export const plugin = 'semo'
export const command = 'generate <component>'
export const desc = 'Generate component sample code'
export const aliases = ['g']

export const builder = function (yargs) {
  const argv: any = Utils.getInternalCache().get('argv') || {}
  const scriptName = argv.scriptName || 'semo'

  Utils.extendSubCommand('generate', scriptName, yargs, __dirname)
}

export const handler = function (argv) {
  if (argv._.length === 1) {
    Utils.info(
      `The ${Utils.color.bold(
        Utils.color.green('generate')
      )} command is for generating code by code template.`
    )
    Utils.info(
      `Use ${Utils.color.green('generate help')} to see supported generators.`
    )
  }
}
