#!/usr/bin/env node

import { Utils } from '.'
import path from 'path'
import updateNotifier from 'update-notifier'
// import pkg from '../package.json'
import yargs from 'yargs'
import yParser from 'yargs-parser'

const pkg = Utils.loadCorePackageInfo()
updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 * 7 }).notify({
  defer: false,
  isGlobal: true
})

const cache = Utils.getInternalCache()
let parsedArgv = yParser(process.argv.slice(2))
cache.set('argv', parsedArgv) // set argv first time
let appConfig = Utils.getApplicationConfig()
yargs.config(appConfig)
parsedArgv = Utils._.merge(appConfig, parsedArgv)
cache.set('argv', parsedArgv) // set argv second time
cache.set('yargs', yargs)

const plugins = Utils.getAllPluginsMapping()
const config = Utils.getCombinedConfig()
const packageConfig = Utils.loadPackageInfo()

if (!parsedArgv.scriptName) {
  yargs.hide('script-name').option('script-name', {
    default: 'zignis',
    describe: 'Rename script name.',
    type: 'string'
  })
} else {
  if (!Utils._.isString(parsedArgv.scriptName)) {
    Utils.error('--script-name must be string, should be used only once.')
  }
  yargs.scriptName(parsedArgv.scriptName)
}

yargs.hide('plugin-prefix').option('plugin-prefix', {
  default: 'zignis',
  describe: 'Set plugin prefix.'
})

let scriptName = parsedArgv.scriptName || 'zignis'
const opts = {
  // Give each command an ability to disable temporarily
  visit: (command) => {
    return command.disabled === true ? false : command
  }
}
if (!parsedArgv.disableCoreCommand) {
  // Load local commands
  yargs.commandDir('commands', opts)
}

// Load extra commands by --command-dir option
if (parsedArgv.commandDir) {
  if (parsedArgv.commandDir[0] !== '/') {
    parsedArgv.commandDir = path.resolve(process.cwd(), parsedArgv.commandDir)
  }

  if (Utils.fileExistsSyncCache(path.resolve(parsedArgv.commandDir))) {
    yargs.commandDir(parsedArgv.commandDir, opts)
  }
}

// Load plugin commands
if (plugins) {
  Object.keys(plugins).map(function(plugin) {
    if (
      config.pluginConfigs[plugin] &&
      config.pluginConfigs[plugin].commandDir &&
      Utils.fileExistsSyncCache(path.resolve(plugins[plugin], config.pluginConfigs[plugin].commandDir))
    ) {
      yargs.commandDir(path.resolve(plugins[plugin], config.pluginConfigs[plugin].commandDir), opts)
    }
  })
}

// Load application commands
if (
  packageConfig.name !== scriptName &&
  appConfig.commandDir &&
  Utils.fileExistsSyncCache(path.resolve(process.cwd(), appConfig.commandDir))
) {
  yargs.commandDir(path.resolve(process.cwd(), appConfig.commandDir), opts)
}

;(async () => {
  try {
    // @ts-ignore
    // Register global middlewares
    yargs.middleware((argv, yargs) => {
      let commandPath = yargs.getContext().fullCommands.slice().map(cmd => cmd.split(' ')[0])
      let commandDefault

      if (argv.commandDefault && commandPath.length >= 1) {
        while (commandPath.length >= 1) {
          commandDefault = Utils._.get(argv.commandDefault, commandPath)
          if (!Utils._.isObject(commandDefault) || Utils._.isArray(commandDefault)) {
            commandPath.pop()
            continue
          }
          break
        }
      }

      argv = commandDefault ? Utils._.merge(argv, commandDefault, parsedArgv) : argv
      cache.set('argv', argv) // set argv third time

      return argv
    })

    if (!parsedArgv.getYargsCompletions) {
      let beforeHooks = await Utils.invokeHook('beforeCommand')
      Object.keys(beforeHooks).map(function(hook) {
        beforeHooks[hook](parsedArgv, yargs)
      })
    }

    if (!parsedArgv.disableCoreCommand && !parsedArgv.disableCore) {
      yargs.hide('disable-core-command').option('disable-core-command', {
        alias: 'disable-core',
        describe: 'Disable core commands.'
      })

      if (!parsedArgv.disableCompletionCommand && !parsedArgv.disableCompletion) {
        yargs.hide('disable-completion-command').option('disable-completion-command', {
          alias: 'disable-completion',
          describe: 'Disable completion command.'
        })
  
        if (!parsedArgv.hideCompletionCommand && !parsedArgv.hideCompletion) {
          yargs.hide('hide-completion-command').option('hide-completion-command', {
            alias: 'hide-completion',
            describe: 'Hide completion command.'
          })
          yargs.completion('completion', 'Generate completion script')
        } else {
          // @ts-ignore, @types/yargs type def not correct
          yargs.completion('completion', false)
        }
      }
    }

    if (!parsedArgv.disableGlobalPlugin && !parsedArgv.disableGlobalPlugins) {
      yargs.hide('disable-global-plugin').option('disable-global-plugin', {
        alias: 'disable-global-plugins',
        describe: 'Disable global plugins.'
      })
    }

    if (!parsedArgv.disableHomePlugin && !parsedArgv.disableHomePlugins) {
      yargs.hide('disable-home-plugin').option('disable-home-plugin', {
        alias: 'disable-home-plugins',
        describe: 'Disable home plugins.'
      })
    }

    if (!parsedArgv.hideEpilog) {
      yargs.hide('hide-epilog').option('hide-epilog', {
        describe: 'Hide epilog.'
      })
      yargs.hide('set-epilog').option('set-epilog', {
        default: false,
        describe: 'Set epilog.'
      })

      yargs.epilog(((epilog: string | string[]): string => {
        if (epilog && Utils._.isString(epilog)) {
          return epilog
        } else if (Utils._.isArray(epilog)) {
          let pop = epilog.pop()
          if (pop) {
            return pop
          }
        }

        return 'Find more information at https://zignis.js.org'
      })(parsedArgv.setEpilog))
    }

    if (!parsedArgv.setVersion) {
      yargs.hide('set-version').option('set-version', {
        describe: 'Set version.'
      })
    } else {
      yargs.version(parsedArgv.setVersion)
    }

    yargs.hide('node-env-key').option('node-env-key', {
      default: 'NODE_ENV',
      alias: 'node-env',
      describe: 'Set node env key'
    })

    // eslint-disable-next-line
    yargs
      .help()
      .alias('h', 'help')
      .exitProcess(false)
      .recommendCommands()
      .wrap(Math.min(120, yargs.terminalWidth())).argv

    if (!parsedArgv.getYargsCompletions) {
      let afterHooks = await Utils.invokeHook('afterCommand')
      Object.keys(afterHooks).map(function(hook) {
        afterHooks[hook](parsedArgv, yargs)
      })
    }
  } catch (e) {
    if (!e.name || e.name !== 'YError') {
      Utils.error(e.stack)
    }
  }
})()
