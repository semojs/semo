import path from 'path'
import { Utils } from '@semo/core'
import rimraf from 'rimraf'

export const disabled = false // Set to true to disable this command temporarily
// export const plugin = '' // Set this for importing plugin config
export const command = 'cleanup [type]'
export const desc = 'Cleanup internal caches.'
export const aliases = 'clean'
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  yargs.option('yes', { describe: 'Confirm to cleanup.', alias: 'y' })
  // yargs.commandDir('cleanup')
}

export const handler = async function (argv: any) {
  const appConfig = Utils.getApplicationConfig()
  const scriptName = argv.scriptName || 'semo'

  let coreCleanupSteps, coreCleanupStepKeys
  let cleanupSteps = {}
  if (process.env.HOME) {
    coreCleanupSteps = {
      'cache': path.resolve(process.env.HOME, '.' + scriptName, 'cache'),
      'home-plugin-cache': path.resolve(process.env.HOME, '.' + scriptName, 'home-plugin-cache'),
      'run-plugin-cache': path.resolve(process.env.HOME, '.' + scriptName, 'run-plugin-cache'),
      'repl-package-cache': path.resolve(process.env.HOME, '.' + scriptName, 'repl-package-cache'),
      'repl-history': path.resolve(process.env.HOME, '.' + scriptName, `.${scriptName}_repl_history`),
      'shell-history': path.resolve(process.env.HOME, '.' + scriptName, `.${scriptName}_shell_history`),
    }

    Object.keys(coreCleanupSteps).forEach(key => {
      if (Utils.fs.existsSync(coreCleanupSteps[key])) {
        cleanupSteps[key] = coreCleanupSteps[key]
      }
    })

    coreCleanupStepKeys = Object.keys(coreCleanupSteps).push('all')
  }

  // Limit only application can hook cleanup
  const hookAppCleanup = await Utils.invokeHook(`${scriptName}:cleanup`, { include: ['application'] })
  Object.keys(hookAppCleanup).forEach(key => {
    let cachePath = hookAppCleanup[key]
    if (cachePath.indexOf(appConfig.applicationDir) > -1 && coreCleanupStepKeys.indexOf(key) === -1) {
      cleanupSteps[key] = hookAppCleanup[key]
    }
  })

  if (!argv.type) {
    const choices = Object.keys(cleanupSteps).map(key => {
      return { 
        name: key + ' ' + Utils.shell.exec(`du -sh ${cleanupSteps[key]}`, { silent: true }).split("\t")[0],
        value: key
      }
    }).concat([{ name: '** CLEANUP ALL ABOVE **', value: 'all'}])
  
    const answers: any = await Utils.inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: `Please choose a cache type to cleanup(remove):`,
        choices: choices
      }
    ])
  
    argv.type = answers.selected
  } else {
    let availableTypes = Object.keys(cleanupSteps).concat(['all'])
    if (availableTypes.indexOf(argv.type) === -1) {
      Utils.error('Invalid cleanup type.')
      return
    }
  }

  if (!argv.yes) {
    let confirm = await Utils.inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: Utils.chalk.yellow(`Confirm cleanup ${argv.type}? The operation can not be reversed!`),
        default: false
      }
    ])

    argv.yes = confirm.confirmed
  }

  if (argv.yes) {
    Object.keys(cleanupSteps).forEach(key => {
      if (argv.type === key || argv.type === 'all') {
        rimraf(cleanupSteps[key], {
          disableGlob: true
        }, () => {
          Utils.success(`${key} has been cleanup!`)
        })
      }
    })
    
  } else {
    Utils.info('Nothing has been cleanup!')
  }
}
