import { ArgvExtraOptions, error, info, success } from '@semo/core'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'path'
import { rimraf } from 'rimraf'

export const disabled = false
export const plugin = 'semo'
export const command = 'cleanup [type]'
export const desc = 'Cleanup internal caches.'
export const aliases = 'clean'

export const builder = function (yargs: any) {
  yargs.option('yes', { describe: 'Confirm to cleanup.', alias: 'y' })
}

export const handler = async function (argv: ArgvExtraOptions) {
  const appConfig = argv.$core.appConfig
  const scriptName = argv.scriptName || 'semo'

  const cleanupSteps: Record<string, string> = {}
  const coreCleanupStepKeys: string[] = []

  if (process.env.HOME) {
    const homeBase = path.resolve(process.env.HOME, '.' + scriptName)
    const coreCleanupSteps: Record<string, string> = {
      manifest: path.resolve(homeBase, 'cache', 'plugin-manifest.json'),
      cache: path.resolve(homeBase, 'cache'),
      'home-plugin-cache': path.resolve(homeBase, 'home-plugin-cache'),
      'run-plugin-cache': path.resolve(homeBase, 'run-plugin-cache'),
      'repl-package-cache': path.resolve(homeBase, 'repl-package-cache'),
      'repl-history': path.resolve(homeBase, `.${scriptName}_repl_history`),
      'shell-history': path.resolve(homeBase, `.${scriptName}_shell_history`),
    }

    for (const [key, val] of Object.entries(coreCleanupSteps)) {
      coreCleanupStepKeys.push(key)
      if (existsSync(val)) {
        cleanupSteps[key] = val
      }
    }
  }

  const hookAppCleanup = await argv.$core.invokeHook(`${scriptName}:cleanup`, {
    include: ['application'],
  })
  if (hookAppCleanup && typeof hookAppCleanup === 'object') {
    for (const [key, cachePath] of Object.entries(hookAppCleanup)) {
      if (
        typeof cachePath === 'string' &&
        appConfig.applicationDir &&
        cachePath.includes(appConfig.applicationDir) &&
        !coreCleanupStepKeys.includes(key) &&
        existsSync(cachePath)
      ) {
        cleanupSteps[key] = cachePath
      }
    }
  }

  if (Object.keys(cleanupSteps).length === 0) {
    info('Nothing to cleanup.')
    return
  }

  if (!argv.type) {
    const choices = Object.keys(cleanupSteps)
      .map((key) => {
        const result = spawnSync('du', ['-sh', cleanupSteps[key]], {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        })
        const size = result.status === 0 ? result.stdout.split('\t')[0] : '??'
        return { name: `${key} ${size}`, value: key }
      })
      .concat([{ name: '** CLEANUP ALL ABOVE **', value: 'all' }])

    argv.type = await argv.$prompt.select({
      message: 'Please choose a cache type to cleanup(remove):',
      choices,
    })
  } else {
    const availableTypes = Object.keys(cleanupSteps).concat(['all'])
    if (!availableTypes.includes(argv.type as string)) {
      error('Invalid cleanup type.')
      return
    }
  }

  if (!argv.yes) {
    argv.yes = await argv.$prompt.confirm({
      message: `Confirm cleanup ${argv.type}? The operation can not be reversed!`,
      default: false,
    })
  }

  if (argv.yes) {
    // When cleaning 'all', skip 'manifest' since it's inside 'cache' directory
    for (const key of Object.keys(cleanupSteps)) {
      if (argv.type === 'all' && key === 'manifest') continue
      if (argv.type === key || argv.type === 'all') {
        rimraf.sync(cleanupSteps[key], { glob: false })
        success(`${key} has been cleanup!`)
      }
    }
  } else {
    info('Nothing has been cleanup!')
  }
}
