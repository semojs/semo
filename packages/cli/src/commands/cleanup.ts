import { ArgvExtraOptions, error, info, success } from '@semo/core'
import fs from 'fs-extra'
import path from 'path'
import { rimraf } from 'rimraf'
import shell from 'shelljs'

export const disabled = false // Set to true to disable this command temporarily
export const plugin = 'semo' // Set this for importing plugin config
export const command = 'cleanup [type]'
export const desc = 'Cleanup internal caches.'
export const aliases = 'clean'

export const builder = function (yargs: any) {
  yargs.option('yes', { describe: 'Confirm to cleanup.', alias: 'y' })
}

export const handler = async function (argv: ArgvExtraOptions) {
  const appConfig = argv.$core.appConfig
  const scriptName = argv.scriptName || 'semo'

  let coreCleanupSteps: Record<string, any>, coreCleanupStepKeys: string[]
  const cleanupSteps = {}
  if (process.env.HOME) {
    coreCleanupSteps = {
      cache: path.resolve(process.env.HOME, '.' + scriptName, 'cache'),
      'home-plugin-cache': path.resolve(
        process.env.HOME,
        '.' + scriptName,
        'home-plugin-cache'
      ),
      'run-plugin-cache': path.resolve(
        process.env.HOME,
        '.' + scriptName,
        'run-plugin-cache'
      ),
      'repl-package-cache': path.resolve(
        process.env.HOME,
        '.' + scriptName,
        'repl-package-cache'
      ),
      'repl-history': path.resolve(
        process.env.HOME,
        '.' + scriptName,
        `.${scriptName}_repl_history`
      ),
      'shell-history': path.resolve(
        process.env.HOME,
        '.' + scriptName,
        `.${scriptName}_shell_history`
      ),
    }

    Object.keys(coreCleanupSteps).forEach((key) => {
      if (fs.existsSync(coreCleanupSteps[key])) {
        cleanupSteps[key] = coreCleanupSteps[key]
      }
    })

    coreCleanupStepKeys = Object.keys(coreCleanupSteps)
    coreCleanupStepKeys.push('all')
  }

  // Limit only application can hook cleanup
  const hookAppCleanup = await argv.$core.invokeHook(`${scriptName}:cleanup`, {
    include: ['application'],
  })
  Object.keys(hookAppCleanup).forEach((key) => {
    const cachePath = hookAppCleanup[key]
    if (
      cachePath.indexOf(appConfig.applicationDir) > -1 &&
      coreCleanupStepKeys.indexOf(key) === -1
    ) {
      cleanupSteps[key] = hookAppCleanup[key]
    }
  })

  if (!argv.type) {
    const choices = Object.keys(cleanupSteps)
      .map((key) => {
        return {
          name:
            key +
            ' ' +
            shell
              .exec(`du -sh ${cleanupSteps[key]}`, { silent: true })
              .split('\t')[0],
          value: key,
        }
      })
      .concat([{ name: '** CLEANUP ALL ABOVE **', value: 'all' }])

    const answer: any = await argv.$prompt.select({
      message: 'Please choose a cache type to cleanup(remove):',
      choices,
    })

    argv.type = answer
  } else {
    const availableTypes = Object.keys(cleanupSteps).concat(['all'])
    if (availableTypes.indexOf(argv.type as string) === -1) {
      error('Invalid cleanup type.')
      return
    }
  }

  if (!argv.yes) {
    const confirmed = await argv.$prompt.confirm({
      message: `Confirm cleanup ${argv.type}? The operation can not be reversed!`,
      default: false,
    })

    argv.yes = confirmed
  }

  if (argv.yes) {
    for (const key of Object.keys(cleanupSteps)) {
      if (argv.type === key || argv.type === 'all') {
        rimraf.sync(cleanupSteps[key], {
          glob: false,
        })
        success(`${key} has been cleanup!`)
      }
    }
  } else {
    info('Nothing has been cleanup!')
  }

  return false
}
