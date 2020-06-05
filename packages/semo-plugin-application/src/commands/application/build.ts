import { Utils } from '@semo/core'

export const disabled = false // Set to true to disable this command temporarily
export const command = 'build'
export const desc = 'Build command placeholder'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('build')
}

export const handler = async function (argv: any) {
  Utils.info(`You see this command because this is a placeholder command, will do nothing.`)
  Utils.info(`You can use ${Utils.chalk.green('semo generate command application/build --extend=application')} in your project to override this command.`)
  Utils.info(`If you don't need this command and don't want to see it, you can set ${Utils.chalk.green('disabled = true')} to hide this command.`)
}
