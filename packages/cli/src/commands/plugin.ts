import { Utils } from "@semo/core"

export const disabled = false // Set to true to disable this command temporarily
export const command = 'plugin'
export const desc = 'Plugin management tool'
export const aliases = 'p'
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  const argv: any = yargs.argv || {}
  const scriptName = argv.scriptName || 'semo'

  Utils.extendSubCommand('plugin', scriptName, yargs, __dirname)
}

export const handler = async function (argv: any) {
  if (argv._.length === 1) {
    Utils.info(`The ${Utils.chalk.bold.green('plugin')} command is for managing semo plugins.`)
    Utils.info(`Use ${Utils.chalk.green('semo plugin help')} to see it's sub commands`)
  }
}
