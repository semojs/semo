import { Utils } from '@semo/core'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'plugin'
export const desc = 'Plugin management tool'
export const aliases = 'p'
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  Utils.extendSubCommand('plugin', 'semo-plugin-plugin', yargs, __dirname)
}

export const handler = async function (argv: any) {
  if (argv._.length === 1) {
    Utils.info(
      `The ${Utils.color.bold(
        Utils.color.green('plugin')
      )} command is for managing semo plugins.`
    )
    Utils.info(
      `Use ${Utils.color.green('plugin help')} to see it's sub commands`
    )
  }
}
