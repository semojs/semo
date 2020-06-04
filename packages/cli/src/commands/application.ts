import { Utils } from '@semo/core'

export const command = 'application'
export const desc = 'Application command namespace.'
export const aliases = 'app'

export const builder = function(yargs) {
  const argv: any = Utils.getInternalCache().get('argv')
  const scriptName = argv.scriptName || 'semo'
  Utils.extendSubCommand('application', scriptName, yargs, __dirname)
}

export const handler = function(argv) {
  if (argv._.length === 1) {
    Utils.info(`The ${Utils.chalk.bold.green('application')} command is where your project level commands are located.`)
    Utils.info(`Use ${Utils.chalk.green('semo generate application/COMMAND')} to add your first application command.`)
    Utils.info(`Then ${Utils.chalk.green('semo application COMMAND')} to run your command.`)
  }
}
