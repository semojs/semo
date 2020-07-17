import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import glob from 'glob'
import { table, getBorderCharacters } from 'table'
import findUp from 'find-up'
import _ from 'lodash'
import yaml from 'yaml'
import colorize from 'json-colorizer'
import stringify from 'json-stringify-pretty-compact'
import chalk from 'chalk'
import day from 'dayjs'
import shell from 'shelljs'
import debug from 'debug'
import fuzzy from 'fuzzy'
import { execSync } from 'child_process'
import objectHash from 'node-object-hash'
import getStdin from 'get-stdin'
import NodeCache from 'node-cache'
import yargs from 'yargs'
import yargsInternal from 'yargs/yargs'

import updateNotifier from 'update-notifier'
import envinfo from 'envinfo'

import { Hook } from './hook'

// @ts-ignore
const yParser = yargsInternal.Parser

const { hash } = objectHash({ sort: true })

let cachedInstance: NodeCache

/**
 * Get Semo internal cache instance
 * @returns {NodeCache}
 */
const getInternalCache = function(): NodeCache {
  if (!cachedInstance) {
    cachedInstance = new NodeCache({
      useClones: false
    })
  }
  return cachedInstance
}
cachedInstance = getInternalCache()

interface CachedNamespaceInstance {
  [propName: string]: NodeCache
}

/**
 * Get Semo cache instance by namespace
 * @param {string} namespace
 * @returns {NodeCache}
 */
const getCache = function(namespace: string): NodeCache {
  if (!namespace) {
    throw Error('Namespace is necessary.')
  }

  let cachedNamespaceInstances: CachedNamespaceInstance | undefined
  cachedNamespaceInstances = cachedInstance.get('cachedNamespaceInstances')

  if (!cachedNamespaceInstances) {
    cachedNamespaceInstances = {}
  }

  if (!cachedNamespaceInstances[namespace]) {
    cachedNamespaceInstances[namespace] = new NodeCache({
      useClones: false
    })
    cachedInstance.set('cachedNamespaceInstances', cachedNamespaceInstances)
  }
  return cachedNamespaceInstances[namespace]
}

/**
 * debug core
 */
const debugCore = function(...args) {
  let debugCache: any = getInternalCache().get('debug')

  if (!debugCache) {
    const argv: any = getInternalCache().get('argv')
    const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'
    debugCache = debug(`${scriptName}-core`)
    debugCache(...args)

    getInternalCache().set('debug', debugCache)
  }

  return debugCache
}

const fileExistsSyncCache = function(filePath) {
  const fileCheckHistory: any = cachedInstance.get('fileCheckHistory') || {}
  if (fileCheckHistory[filePath]) {
    fileCheckHistory[filePath].count++
    return fileCheckHistory[filePath].existed
  }

  const existed = fs.existsSync(filePath)
  fileCheckHistory[filePath] = { count: 1, existed }
  cachedInstance.set('fileCheckHistory', fileCheckHistory)

  return fileCheckHistory[filePath].existed
}

interface IHookOption {
  mode?: 'assign' | 'merge' | 'push' | 'replace' | 'group'
  useCache?: boolean
  include?: boolean | string[]
  exclude?: boolean | string[]
  reload?: boolean
}

/**
 * Run hook in all valid plugins and return the combined results.
 * Plugins implement hook in `module.exports`, could be generator function or promise function or non-function
 * For non-function, it will be used as hook data directly, likely to be returned by function
 * @example
 * const hookReturn = await Utils.invokeHook('semo:hook')
 * @param {string} hook Hook name, suggest plugin defined hook include a prefix, e.g. `prefix:hook`
 * @param {string} options Options
 * @param {string} options.mode Hook mode, could be `assign`, `merge`, `push`, `replace`, `group`, default is assign.
 * @param {bool} options.useCache If or not use cached hook result
 * @param {array} options.include set plugins to be used in invoking
 * @param {array} options.exclude set plugins not to be used in invoking, same ones options.exclude take precedence
 * @param {boolean} options.reload If or not clear module cache before require
 */
const invokeHook = async function (hook: any = null, options: IHookOption = { mode: 'assign' }, argv: any = null) {
  const splitHookName = hook.split(':')
  let moduler, originModuler
  if (splitHookName.length === 1) {
    moduler = ''
    originModuler = ''
    hook = splitHookName[0]
  } else if (splitHookName.length === 2) {
    moduler = splitHookName[0]
    hook = splitHookName[1]

    originModuler = moduler
    moduler = moduler.replace('-', '__').replace('/', '__').replace('@', '')
  } else {
    throw Error('Invalid hook name')
  }

  argv = argv || getInternalCache().get('argv') || {}
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'
  const invokedHookCache: { [propName: string]: any } = cachedInstance.get('invokedHookCache') || {}
  hook = !hook.startsWith('hook_') ? `hook_${hook}` : hook
  options = Object.assign(
    {
      mode: 'assign',
      useCache: false,
      include: [],
      exclude: [],
      opts: {}
    },
    options
  )

  try {
    const cacheKey = `${hook}:${hash(options)}`
    if (options.useCache && invokedHookCache[cacheKey]) {
      return invokedHookCache[cacheKey]
    }

    // Make Application supporting hook invocation
    const appConfig = getApplicationConfig(argv)
    const combinedConfig = getCombinedConfig(argv)

    // Make Semo core supporting hook invocation
    const plugins = argv.coreDir ? Object.assign(
      {},
      {
        [scriptName]: path.resolve(argv.coreDir)
      },
      getAllPluginsMapping(argv)
    ) : getAllPluginsMapping(argv)

    if (appConfig && 
        appConfig.name !== scriptName && 
        appConfig.name !== argv.packageName && 
        !plugins[appConfig.name] && 
        appConfig.applicationDir && appConfig.applicationDir !== argv.coreDir) {
      plugins['application'] = appConfig.applicationDir
    }

    let pluginsReturn
    switch (options.mode) {
      case 'push':
        pluginsReturn = []
        break
      case 'replace':
        pluginsReturn = undefined
        break
      case 'group':
      case 'assign':
      case 'merge':
      default:
        pluginsReturn = {}
        break
    }

    for (let i = 0, length = Object.keys(plugins).length; i < length; i++) {
      let plugin = Object.keys(plugins)[i]

      if (_.isArray(options.include) && options.include.length > 0 && options.include.indexOf(plugin) === -1) {
        continue
      }

      if (_.isArray(options.exclude) && options.exclude.length > 0 && options.exclude.indexOf(plugin) > -1) {
        continue
      }

      try {
        // 寻找插件声明的钩子文件入口
        // 默认是Node模块的入口文件
        // package.rc.hookDir < package[scriptName].hookDir < rcfile.hookDir
        let pluginEntry = 'index.js'
        if (fileExistsSyncCache(path.resolve(plugins[plugin], 'package.json'))) {
          const pkgConfig = require(path.resolve(plugins[plugin], 'package.json'))

          if (pkgConfig.rc) {
            pkgConfig.rc = formatRcOptions(pkgConfig.rc)
            if (pkgConfig.rc.hookDir) {
              if (fileExistsSyncCache(path.resolve(plugins[plugin], pkgConfig.rc.hookDir, 'index.js'))) {
                pluginEntry = path.join(pkgConfig.rc.hookDir, 'index.js')
              }
            }
          }

          if (pkgConfig[scriptName]) {
            pkgConfig[scriptName] = formatRcOptions(pkgConfig[scriptName])
            if (pkgConfig[scriptName].hookDir) {
              if (fileExistsSyncCache(path.resolve(plugins[plugin], pkgConfig[scriptName].hookDir, 'index.js'))) {
                pluginEntry = path.join(pkgConfig[scriptName].hookDir, 'index.js')
              }
            }
          }
        }

        // hookDir
        let hookDir

        switch (plugin) {
          case scriptName:
            let coreRcInfo = parseRcFile(plugin, plugins[plugin])
            hookDir = coreRcInfo && coreRcInfo.hookDir ? coreRcInfo.hookDir : ''
          break

          case 'application':
            if (combinedConfig.hookDir) {
              hookDir = combinedConfig.hookDir
            }
          break

          default:
            if (combinedConfig.pluginConfigs[plugin]) {
              hookDir = combinedConfig.pluginConfigs[plugin].hookDir
            }
          break

        }
        if (hookDir && fileExistsSyncCache(path.resolve(plugins[plugin], hookDir, 'index.js'))) {
          pluginEntry = path.join(hookDir, 'index.js')
        }

        // For application, do not accept default index.js
        if (plugin === 'application' && pluginEntry === 'index.js') {
          continue
        }

        const pluginEntryPath = path.resolve(plugins[plugin], pluginEntry)
        if (fileExistsSyncCache(pluginEntryPath)) {
          if (options.reload && require.cache[pluginEntryPath]) {
            delete require.cache[pluginEntryPath]
          }
          let loadedPlugin = require(pluginEntryPath)
          if (_.isFunction(loadedPlugin)) {
            loadedPlugin = await loadedPlugin(Utils)
          }

          let hookFound = false
          if (moduler) {
            if (!_.isNull(loadedPlugin[`${moduler}__${hook}`]) && !_.isUndefined(loadedPlugin[`${moduler}__${hook}`])) {
              hookFound = true
              let pluginReturn
              if (_.isFunction(loadedPlugin[`${moduler}__${hook}`])) {
                pluginReturn = (await loadedPlugin[`${moduler}__${hook}`](pluginsReturn, options))
              } else {
                pluginReturn = loadedPlugin[`${moduler}__${hook}`]
              }
  
              switch (options.mode) {
                case 'group':
                  pluginReturn = pluginReturn || {}
                  pluginsReturn[plugin] = pluginReturn
                  break
                case 'push':
                  pluginsReturn.push(pluginReturn)
                  break
                case 'replace':
                  pluginsReturn = pluginReturn
                  break
                case 'merge':
                  pluginReturn = pluginReturn || {}
                  pluginsReturn = _.merge(pluginsReturn, pluginReturn)
                  break
                case 'assign':
                default:
                  pluginReturn = pluginReturn || {}
                  pluginsReturn = Object.assign(pluginsReturn, pluginReturn)
                  break
              }
            } else if (loadedPlugin[hook] && loadedPlugin[hook].getHook && _.isFunction(loadedPlugin[hook].getHook)) {
              hookFound = true
              let loadedPluginHook = loadedPlugin[hook].getHook(originModuler)
              let pluginReturn
              if (_.isFunction(loadedPluginHook)) {
                pluginReturn = (await loadedPluginHook(pluginsReturn, options))
              } else {
                pluginReturn = loadedPluginHook
              }
  
              switch (options.mode) {
                case 'group':
                  pluginReturn = pluginReturn || {}
                  pluginsReturn[plugin] = pluginReturn
                  break
                case 'push':
                  pluginsReturn.push(pluginReturn)
                  break
                case 'replace':
                  pluginsReturn = pluginReturn
                  break
                case 'merge':
                  pluginReturn = pluginReturn || {}
                  pluginsReturn = _.merge(pluginsReturn, pluginReturn)
                  break
                case 'assign':
                default:
                  pluginReturn = pluginReturn || {}
                  pluginsReturn = Object.assign(pluginsReturn, pluginReturn)
                  break
              }
            }
          } 
          
          if (!hookFound) {
            if (!_.isNull(loadedPlugin[hook]) && !_.isUndefined(loadedPlugin[hook])) {
              let pluginReturn
              if (_.isFunction(loadedPlugin[hook])) {
                pluginReturn = (await loadedPlugin[hook](pluginsReturn, options))
              } else {
                pluginReturn = loadedPlugin[hook]
              }
  
              switch (options.mode) {
                case 'group':
                  pluginReturn = pluginReturn || {}
                  pluginsReturn[plugin] = pluginReturn
                  break
                case 'push':
                  pluginsReturn.push(pluginReturn)
                  break
                case 'replace':
                  pluginsReturn = pluginReturn
                  break
                case 'merge':
                  pluginReturn = pluginReturn || {}
                  pluginsReturn = _.merge(pluginsReturn, pluginReturn)
                  break
                case 'assign':
                default:
                  pluginReturn = pluginReturn || {}
                  pluginsReturn = Object.assign(pluginsReturn, pluginReturn)
                  break
              }
            }
          }
        }
      } catch (e) {
        if (!e.code || e.code !== 'MODULE_NOT_FOUND') {
          throw new Error(e.stack)
        } else {
          error(e.message, false)
        }
      }
    }

    // hook_alter
    pluginsReturn = invokeHookAlter(hook, pluginsReturn, options, argv)

    invokedHookCache[cacheKey] = pluginsReturn
    cachedInstance.set('invokedHookCache', invokedHookCache)

    return pluginsReturn
  } catch (e) {
    throw new Error(e.stack)
  }
}

/**
 * Run hook_alter in all valid plugins and return altered results 
 * @param {object} hook Hook name
 * @param {object} data need alter data
 * @param {object} options Same as invokeHook 
 */
const invokeHookAlter = async function(hook: any = null, data, options: IHookOption = {}, argv: any = null) {

  const splitHookName = hook.split(':')
  let moduler, originModuler
  if (splitHookName.length === 1) {
    moduler = ''
    originModuler = ''
  } else if (splitHookName.length === 2) {
    moduler = splitHookName[0]
    hook = splitHookName[1]
    originModuler = moduler
    moduler = moduler.replace('-', '__').replace('/', '__').replace('@', '')
  } else {
    throw Error('Invalid hook name')
  }

  argv = argv || getInternalCache().get('argv') || {}
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'
  hook = !hook.startsWith('hook_') ? `hook_${hook}` : hook

  try {
    // Make Application supporting hook invocation
    const appConfig = getApplicationConfig(argv)
    const combinedConfig = getCombinedConfig(argv)

    // Make Semo core supporting hook invocation
    const plugins = argv.coreDir ? Object.assign(
      {},
      {
        [scriptName]: path.resolve(argv.coreDir)
      },
      getAllPluginsMapping(argv)
    ) : getAllPluginsMapping(argv)

    if (appConfig && appConfig.name !== scriptName && !plugins[appConfig.name] && appConfig.applicationDir && appConfig.applicationDir !== argv.coreDir) {
      plugins['application'] = appConfig.applicationDir
    }

    // hook_alter
    for (let i = 0, length = Object.keys(plugins).length; i < length; i++) {
      let plugin = Object.keys(plugins)[i]

      if (_.isArray(options.include) && options.include.length > 0 && options.include.indexOf(plugin) === -1) {
        continue
      }

      if (_.isArray(options.exclude) && options.exclude.length > 0 && options.exclude.indexOf(plugin) > -1) {
        continue
      }

      try {
        // 寻找插件声明的钩子文件入口
        // 默认是Node模块的入口文件
        // package.rc.hookDir < package[scriptName].hookDir < rcfile.hookDir
        let pluginEntry = 'index.js'
        if (fileExistsSyncCache(path.resolve(plugins[plugin], 'package.json'))) {
          const pkgConfig = require(path.resolve(plugins[plugin], 'package.json'))

          if (pkgConfig.rc) {
            pkgConfig.rc = formatRcOptions(pkgConfig.rc)
            if (pkgConfig.rc.hookDir) {
              if (fileExistsSyncCache(path.resolve(plugins[plugin], pkgConfig.rc.hookDir, 'index.js'))) {
                pluginEntry = path.join(pkgConfig.rc.hookDir, 'index.js')
              }
            }
          }

          if (pkgConfig[scriptName]) {
            pkgConfig[scriptName] = formatRcOptions(pkgConfig[scriptName])
            if (pkgConfig[scriptName].hookDir) {
              if (fileExistsSyncCache(path.resolve(plugins[plugin], pkgConfig[scriptName].hookDir, 'index.js'))) {
                pluginEntry = path.join(pkgConfig[scriptName].hookDir, 'index.js')
              }
            }
          }
        }

        // hookDir
        let hookDir

        switch (plugin) {
          case scriptName:
            let coreRcInfo = parseRcFile(plugin, plugins[plugin])
            hookDir = coreRcInfo && coreRcInfo.hookDir ? coreRcInfo.hookDir : ''
          break

          case 'application':
            if (combinedConfig.hookDir) {
              hookDir = combinedConfig.hookDir
            }
          break

          default:
            if (combinedConfig.pluginConfigs[plugin]) {
              hookDir = combinedConfig.pluginConfigs[plugin].hookDir
            }
          break

        }
        if (hookDir && fileExistsSyncCache(path.resolve(plugins[plugin], hookDir, 'index.js'))) {
          pluginEntry = path.join(hookDir, 'index.js')
        }

        // For application, do not accept default index.js
        if (plugin === 'application' && pluginEntry === 'index.js') {
          continue
        }

        const pluginEntryPath = path.resolve(plugins[plugin], pluginEntry)
        if (fileExistsSyncCache(pluginEntryPath)) {
          if (options.reload && require.cache[pluginEntryPath]) {
            delete require.cache[pluginEntryPath]
          }

          let loadedPlugin = require(pluginEntryPath)
          if (_.isFunction(loadedPlugin)) {
            loadedPlugin = await loadedPlugin(Utils)
          }

          let hookFound = false
          const hook_alter = `${hook}_alter`
          if (moduler) {
            if (!_.isNull(loadedPlugin[`${moduler}__${hook_alter}`]) && !_.isUndefined(loadedPlugin[`${moduler}__${hook_alter}`])) {
              hookFound = true
              if (_.isFunction(loadedPlugin[`${moduler}__${hook_alter}`])) {
                data = await loadedPlugin[`${moduler}__${hook_alter}`](data, options)
              } else {
                data = loadedPlugin[`${moduler}__${hook_alter}`]
              }
            } else if (loadedPlugin[hook_alter] && loadedPlugin[hook_alter].getHook && _.isFunction(loadedPlugin[hook_alter].getHook)) {
              hookFound = true
              let loadedPluginHook = loadedPlugin[hook_alter].getHook(originModuler)
              if (_.isFunction(loadedPluginHook)) {
                data = await loadedPluginHook(data, options)
              } else {
                data = loadedPluginHook
              }
            }
          } 
          
          if (!hookFound) {
            if (!_.isNull(loadedPlugin[hook_alter]) && !_.isUndefined(loadedPlugin[hook_alter])) {
              if (_.isFunction(loadedPlugin[hook_alter])) {
                data = await loadedPlugin[hook_alter](data, options)
              } else {
                data = loadedPlugin[hook_alter]
              }
            }
          }
        }
      } catch (e) {
        if (!e.code || e.code !== 'MODULE_NOT_FOUND') {
          throw new Error(e.stack)
        } else {
          error(e.message, false)
        }
      }
    }

    return data
  } catch (e) {
    throw new Error(e.stack)
  }
}

/**
 * Extend command's sub command, it give other plugins an opportunity to extend it's sub command.
 * So if you want other plugins to extend your sub commands, you can use this util function to replace default `yargs.commandDir`
 * @example
 * exports.builder = function (yargs) {
 *   // The first param could be a/b/c if you want to extend subcommand's subcommand
 *   Utils.extendSubCommand('make', 'semo', yargs, __dirname)
 * }
 * @param {String} command Current command name.
 * @param {String} moduler Current plugin name.
 * @param {Object} yargs Yargs reference.
 * @param {String} basePath Often set to `__dirname`.
 */
const extendSubCommand = function(command: string, moduleName: string, yargs: any, basePath: string): void {
  let argv: any = cachedInstance.get('argv') || {}
  if (_.isEmpty(argv)) {
    argv = yargs.getOptions().configObjects[0]
    getInternalCache().set('argv', yargs.getOptions().configObjects[0])
  }

  const plugins = getAllPluginsMapping(argv)
  const config = getCombinedConfig(argv)
  const opts = {
    // Give each command an ability to disable temporarily
    visit: (command) => {
      command.middlewares = command.middlewares ? _.castArray(command.middlewares) : []

      command.middlewares.unshift(async (argv) => {
        if (!command.noblank) {
          // Insert a blank line to terminal
          console.log()
        }
        
        // Give command a plugin level config
        argv['$config'] = {};
        command.plugin = command.plugin || moduleName
        if (command.plugin) {
          command.plugin = command.plugin.startsWith(argv.scriptName + '-plugin-') ? command.plugin.substring(argv.scriptName + '-plugin-'.length) : command.plugin
          
          if (command.plugin && argv['$plugin']) {
            if (argv['$plugin'][command.plugin]) {
              argv['$config'] = formatRcOptions(argv['$plugin'][command.plugin] || {})
            } else if (argv['$plugin'][argv.scriptName + '-plugin-' + command.plugin]) {
              argv['$config'] = formatRcOptions(argv['$plugin'][argv.scriptName + '-plugin-' + command.plugin] || {})
            }
          }
        } 

        argv.$command = command
        argv.$input = await getStdin()
        getInternalCache().set('argv', argv)
      })


      if (command.middleware) {
        command.middlewares = command.middlewares.concat(command.middleware)
      }
      return command.disabled === true ? false : command
    }
  }

  // load default commands
  const currentCommand: string | undefined = command.split('/').pop()
  if (currentCommand && fileExistsSyncCache(path.resolve(basePath, currentCommand))) {
    yargs.commandDir(path.resolve(basePath, currentCommand), opts)
  }

  // Load plugin commands
  if (plugins) {
    Object.keys(plugins).map(function(plugin): void {
      if (config.pluginConfigs[plugin] && config.pluginConfigs[plugin].extendDir) {
        if (
          fileExistsSyncCache(
            path.resolve(plugins[plugin], `${config.pluginConfigs[plugin].extendDir}/${moduleName}/src/commands`, command)
          )
        ) {
          yargs.commandDir(
            path.resolve(plugins[plugin], `${config.pluginConfigs[plugin].extendDir}/${moduleName}/src/commands`, command)
          , opts)
        }
      }
    })
  }

  // Load application commands
  if (
    config.extendDir &&
    fileExistsSyncCache(path.resolve(process.cwd(), `${config.extendDir}/${moduleName}/src/commands`, command))
  ) {
    yargs.commandDir(path.resolve(process.cwd(), `${config.extendDir}/${moduleName}/src/commands`, command), opts)
  }
}

/**
 * Get all plugins path mapping.
 * Same name plugins would be overriden orderly.
 * This function also influences final valid commands and configs.
 */
let configPluginLoaded = false
let enablePluginAutoScan = true 
const getAllPluginsMapping = function(argv: any = {}): { [propName: string]: string } {
  argv = argv || cachedInstance.get('argv') || {}
  let plugins: { [propName: string]: any } = cachedInstance.get('plugins') || {}
  let scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'
  if (_.isEmpty(plugins) && !configPluginLoaded) {
    const registerPlugins = Utils.config('$plugins.register') || {}
    if (!_.isEmpty(registerPlugins)) {
      enablePluginAutoScan = false
    }
    Object.keys(registerPlugins).forEach(plugin => {
      let pluginPath = registerPlugins[plugin]
      if (!plugin.startsWith('.') && plugin.indexOf(scriptName + '-plugin-') === -1) {
        plugin = scriptName + '-plugin-' + plugin
      }

      if (_.isBoolean(pluginPath) && pluginPath) {
        try {
          pluginPath = path.dirname(getPackagePath(plugin, [process.cwd()]))
          plugins[plugin] = pluginPath 
        } catch(e) {
          warn(e.message)
        } 
      } else if (_.isString(pluginPath) && pluginPath.startsWith('/') || pluginPath.startsWith('.') || pluginPath.startsWith('~')) {
        pluginPath = getAbsolutePath(pluginPath)
        plugins[plugin] = pluginPath 
      } else {
        // Means not register for now
      }
    })
    cachedInstance.set('plugins', plugins)
    configPluginLoaded = true

  }

  let pluginPrefix = argv.pluginPrefix || 'semo'
  if (_.isString(pluginPrefix)) {
    pluginPrefix = [pluginPrefix]
  }

  if (!_.isArray(pluginPrefix)) {
    error('invalid --plugin-prefix')
  }

  let topPluginPattern = pluginPrefix.length > 1 
    ? '{' + pluginPrefix.map(prefix => `${prefix}-plugin-*`).join(',') + '}'
    : pluginPrefix.map(prefix => `${prefix}-plugin-*`).join(',')
  let orgPluginPattern = pluginPrefix.length > 1 
    ? '{' + pluginPrefix.map(prefix => `@*/${prefix}-plugin-*`).join(',') + '}'
    : pluginPrefix.map(prefix => `@*/${prefix}-plugin-*`).join(',')

  if (_.isEmpty(plugins) && enablePluginAutoScan) {
    plugins = {}

    // process core plugins
    glob
      .sync(topPluginPattern, {
        noext:true,
        cwd: path.resolve(__dirname, '../plugins')
      })
      .map(function(plugin): void {
        plugins[plugin] = path.resolve(__dirname, '../plugins', plugin)
      })

    // argv.coreDir not always exists, it not plugins list will not include npm global plugins
    if (!argv.disableGlobalPlugin && argv.coreDir) {
      // process core same directory plugins
      glob
        .sync(topPluginPattern, {
          noext:true,
          cwd: path.resolve(argv.coreDir, argv.orgMode ? '../../' : '../')
        })
        .map(function(plugin): void {
          plugins[plugin] = path.resolve(argv.coreDir, argv.orgMode ? '../../' : '../', plugin)
        })

      // process core same directory npm plugins
      glob
        .sync(orgPluginPattern, {
          noext:true,
          cwd: path.resolve(argv.coreDir, argv.orgMode ? '../../' : '../')
        })
        .map(function(plugin): void {
          plugins[plugin] = path.resolve(argv.coreDir, argv.orgMode ? '../../' : '../', plugin)
        })
    }

    if (process.env.HOME && !argv.disableHomePlugin) {
      // Semo home is a special directory 
      if (fileExistsSyncCache(path.resolve(process.env.HOME, '.' + scriptName, `.${scriptName}rc.yml`))) {
        plugins['.' + scriptName] = path.resolve(process.env.HOME, '.' + scriptName)
      }


      // process home npm plugins
      glob
        .sync(topPluginPattern, {
          noext:true,
          cwd: path.resolve(process.env.HOME, `.${scriptName}`, 'home-plugin-cache', 'node_modules')
        })
        .map(function(plugin): void {
          if (process.env.HOME) {
            plugins[plugin] = path.resolve(process.env.HOME, `.${scriptName}`, 'home-plugin-cache', 'node_modules', plugin)
          }
        })

      // process home npm scope plugins
      glob
        .sync(orgPluginPattern, {
          noext:true,
          cwd: path.resolve(process.env.HOME, `.${scriptName}`, 'node_modules')
        })
        .map(function(plugin): void {
          if (process.env.HOME) {
            plugins[plugin] = path.resolve(process.env.HOME, `.${scriptName}`, 'node_modules', plugin)
          }
        })
    }

    // process cwd npm plugins
    glob
      .sync(topPluginPattern, {
        noext:true,
        cwd: path.resolve(process.cwd(), 'node_modules')
      })
      .map(function(plugin) {
        plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
      })

    // process cwd npm scope plugins
    glob
      .sync(orgPluginPattern, {
        noext:true,
        cwd: path.resolve(process.cwd(), 'node_modules')
      })
      .map(function(plugin) {
        plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
      })

    const config = getApplicationConfig()
    const pluginDirs = _.castArray(config.pluginDir)
    pluginDirs.forEach(pluginDir => {
      if (fileExistsSyncCache(pluginDir)) {
        // process local plugins
        glob
          .sync(topPluginPattern, {
            noext:true,
            cwd: path.resolve(process.cwd(), pluginDir)
          })
          .map(function(plugin) {
            plugins[plugin] = path.resolve(process.cwd(), pluginDir, plugin)
          })

        // process local npm scope plugins
        glob
          .sync(orgPluginPattern, {
            noext:true,
            cwd: path.resolve(process.cwd(), pluginDir)
          })
          .map(function(plugin) {
            plugins[plugin] = path.resolve(process.cwd(), pluginDir, plugin)
          })
      }
    })
   

    // process plugin project
    if (fileExistsSyncCache(path.resolve(process.cwd(), 'package.json'))) {
      const pkgConfig = require(path.resolve(process.cwd(), 'package.json'))
      const matchPluginProject = pluginPrefix.map(prefix => `${prefix}-plugin-`).join('|')
      const regExp = new RegExp(`^(@[^/]+\/)?(${matchPluginProject})`)
      if (pkgConfig.name && regExp.test(pkgConfig.name)) {
        plugins[pkgConfig.name] = path.resolve(process.cwd())
      }
    }

    cachedInstance.set('plugins', plugins)
  }

  let extraPluginDirEnvName = _.upperCase(scriptName) + '_PLUGIN_DIR'
  if (extraPluginDirEnvName && process.env[extraPluginDirEnvName] && fileExistsSyncCache(process.env[extraPluginDirEnvName])) {
    let envDir = getAbsolutePath(String(process.env[extraPluginDirEnvName]))

    // process cwd npm plugins
    glob
    .sync(topPluginPattern, {
      noext:true,
      cwd: path.resolve(envDir)
    })
    .map(function(plugin) {
      plugins[plugin] = path.resolve(envDir, plugin)
    })

  // process cwd npm scope plugins
  glob
    .sync(orgPluginPattern, {
      noext:true,
      cwd: path.resolve(envDir)
    })
    .map(function(plugin) {
      plugins[plugin] = path.resolve(envDir, plugin)
    })
  }

  // Second filter for registered or scanned plugins
  const includePlugins = Utils.config('$plugins.include') || []
  const excludePlugins = Utils.config('$plugins.exclude') || []

  if (_.isArray(includePlugins) && includePlugins.length > 0) {
    plugins = _.pickBy(plugins, (pluginPath, plugin) => {
      if (plugin.indexOf(scriptName + '-plugin-') === 0) {
        plugin = plugin.substring((scriptName + '-plugin-').length)
      }
      return includePlugins.includes(plugin) || includePlugins.includes(scriptName + '-plugin-' + plugin)
    })
  }

  if (_.isArray(excludePlugins) && excludePlugins.length > 0) {
    plugins = _.omitBy(plugins, (pluginPath, plugin) => {
      if (plugin.indexOf(scriptName + '-plugin-') === 0) {
        plugin = plugin.substring((scriptName + '-plugin-').length)
      }
      return excludePlugins.includes(plugin) || excludePlugins.includes(scriptName + '-plugin-' + plugin)
    })
  }


  return plugins
}

/**
 * Get absolute path or dir, this func will not judge if exist
 */
const getAbsolutePath = (filePath) => {
  if (filePath[0] === '/') return filePath

  if (filePath[0] === '~') return filePath.replace(/^~/, process.env.HOME)

  return path.resolve(filePath)
}

/**
 * Get application semo config only.
 * 
 * @param cwd
 * @param opts
 *   opts.scriptName: set scriptName
 */
const getApplicationConfig = function(opts: any = {}) {
  let argv: any = cachedInstance.get('argv') || {}
  let scriptName = opts.scriptName ? opts.scriptName : (argv && argv.scriptName ? argv.scriptName : 'semo')
  let applicationConfig

  const configPath = findUp.sync([`.${scriptName}rc.yml`], {
    cwd: opts.cwd
  })

  const nodeEnv = getNodeEnv(argv)
  const configEnvPath = findUp.sync([`.${scriptName}rc.${nodeEnv}.yml`], {
    cwd: opts.cwd
  })

  // Load home config if exists
  const homeSemoYamlRcPath = process.env.HOME ? path.resolve(process.env.HOME, `.${scriptName}`, `.${scriptName}rc.yml`) : ''
  if (homeSemoYamlRcPath && fileExistsSyncCache(homeSemoYamlRcPath)) {
    try {
      const rcFile = fs.readFileSync(homeSemoYamlRcPath, 'utf8')
      applicationConfig = formatRcOptions(yaml.parse(rcFile))
    } catch (e) {
      debugCore('load rc:', e)
      warn(`Global ${homeSemoYamlRcPath} config load failed!`)
    }
  } else {
    applicationConfig = {}
  }

  applicationConfig.applicationDir = opts.cwd ? opts.cwd : configPath ? path.dirname(configPath) : process.cwd()

  // Inject some core config, hard coded
  applicationConfig = Object.assign({}, applicationConfig, opts, {
    coreCommandDir: 'lib/commands'
  })

  // Load application rc, if same dir with core, it's a dup process, rare case.
  if (fileExistsSyncCache(path.resolve(applicationConfig.applicationDir, 'package.json'))) {
    let packageInfo = require(path.resolve(applicationConfig.applicationDir, 'package.json'))

    if (packageInfo.name) {
      applicationConfig.name = packageInfo.name
    }

    if (packageInfo.version) {
      applicationConfig.version = packageInfo.version
    }

    // args > package > current rc
    if (packageInfo.rc) {
      packageInfo.rc = formatRcOptions(packageInfo.rc)
      applicationConfig = Object.assign({}, applicationConfig, packageInfo.rc)
    }
    if (packageInfo[scriptName]) {
      packageInfo[scriptName] = formatRcOptions(packageInfo[scriptName])
      applicationConfig = Object.assign({}, applicationConfig, packageInfo[scriptName])
    }
  }

  // Load current directory main rc config
  if (configPath) {
    let semoRcInfo = {}

    try {
      if (configPath.endsWith('.yml')) {
        const rcFile = fs.readFileSync(configPath, 'utf8')
        semoRcInfo = formatRcOptions(yaml.parse(rcFile))
      } else {
        semoRcInfo = require(configPath)
        semoRcInfo = formatRcOptions(semoRcInfo)
      }
      applicationConfig = _.merge(applicationConfig, semoRcInfo)
    } catch(e) {
      debugCore('load rc:', e)
      warn(`application rc config load failed!`)
    }
  }

  // Load current directory env rc config
  if (configEnvPath) {
    let semoEnvRcInfo = {}

    try {
      if (configEnvPath.endsWith('.yml')) {
        const rcFile = fs.readFileSync(configEnvPath, 'utf8')
        semoEnvRcInfo = formatRcOptions(yaml.parse(rcFile))
      } else {
        semoEnvRcInfo = require(configEnvPath)
        semoEnvRcInfo = formatRcOptions(semoEnvRcInfo)
      }
      applicationConfig = _.merge(applicationConfig, semoEnvRcInfo)
    } catch(e) {
      debugCore('load rc:', e)
      warn(`application env rc config load failed!`)
    }
  }

  if (applicationConfig['$core'] && applicationConfig['$core']['env'] && _.isObject(applicationConfig['$core']['env'])) {
    Object.keys(applicationConfig['$core']['env']).forEach(key => {
      process.env[key] = process.env[key] || applicationConfig['$core']['env'][key]
    })
  }

  return applicationConfig
}

/**
 * Format options keys
 * 
 * Make compatible of param cases and camel cases
 */
const formatRcOptions = (opts) => {
  if (!_.isObject(opts)) {
    throw new Error('Not valid rc options!')
  }
  Object.keys(opts).filter(key => key.indexOf('-') > -1 || key.indexOf('.') > -1).forEach(key => {
    const newKey = key.replace(/--+/g, '-').replace(/^-/g, '').replace(/-([a-z])/g, (m, p1) => p1.toUpperCase()).replace('.', '_')
    opts[newKey] = opts[key]
    // delete opts[key] // sometimes we need original style
  })
  return opts
}

const parseRcFile = function(plugin, pluginPath, argv: any = {}) {
  argv = argv || cachedInstance.get('argv') || {}
  let scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'

  const pluginSemoYamlRcPath = path.resolve(pluginPath, `.${scriptName}rc.yml`)
  let pluginConfig
  if (fileExistsSyncCache(pluginSemoYamlRcPath)) {
    try {
      const rcFile = fs.readFileSync(pluginSemoYamlRcPath, 'utf8')
      pluginConfig = formatRcOptions(yaml.parse(rcFile))
    } catch (e) {
      debugCore('load rc:', e)
      warn(`Plugin ${plugin} .semorc.yml config load failed!`)
      pluginConfig = {}
    }
  }

  return pluginConfig
}

/**
 * Get commbined config from whole environment.
 */
const getCombinedConfig = function(argv: any = {}): { [propName: string]: any } {
  let combinedConfig: { [propName: string]: any } = cachedInstance.get('combinedConfig') || {}
  let pluginConfigs: { [propName: string]: any } = {}

  if (_.isEmpty(combinedConfig)) {
    const plugins = getAllPluginsMapping(argv)
    Object.keys(plugins).map(plugin => {
      let pluginConfig = parseRcFile(plugin, plugins[plugin], argv)

      let pluginConfigPick = _.pick(pluginConfig, ['commandDir', 'extendDir', 'hookDir', plugin])
      combinedConfig = _.merge(combinedConfig, pluginConfigPick)
      pluginConfigs[plugin] = pluginConfig

    })

    const applicatonConfig = getApplicationConfig()
    combinedConfig = _.merge(combinedConfig, applicatonConfig)
    combinedConfig.pluginConfigs = pluginConfigs
    cachedInstance.set('combinedConfig', combinedConfig)
  }

  return combinedConfig || {}
}

/**
 * Print message with format and color.
 * @param {mix} message Message to log
 */
const log = function(message: any) {
  if (_.isArray(message) || _.isObject(message)) {
    console.log(colorize(stringify(message)))
  } else {
    console.log(message)
  }
}

/**
 * Print error message, and exit process.
 * @param {mix} message Error message to log
 * @param {string} label Error log label
 * @param {integer} errorCode Error code
 */
const error = function(message: any, exit = true, errorCode = 1) {
  message = _.isString(message) ? { message } : message
  console.log(chalk.red(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Print warn message with yellow color.
 * @param {mix} message Error message to log
 */
const warn = function(message: any, exit = false, errorCode = 0) {
  message = _.isString(message) ? { message } : message
  console.log(chalk.yellow(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Print info message with green color.
 * @param {mix} message Error message to log
 */
const info = function(message: any, exit = false, errorCode = 0) {
  message = _.isString(message) ? { message } : message
  console.log(chalk.cyan(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Print success message with green color.
 * @param {mix} message Error message to log
 */
const success = function(message: any, exit = false, errorCode = 0) {
  message = _.isString(message) ? { message } : message
  console.log(chalk.green(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Compute md5.
 * @param {string} s
 */
const md5 = function(s: string) {
  return crypto
    .createHash('md5')
    .update(s, 'utf8')
    .digest('hex')
}

/**
 * Split input by comma and blank.
 * @example
 * const = Utils.splitComma('a, b , c,d')
 * @param {string} input
 * @returns {array} input separated by comma
 */
const splitComma = function(input: string) {
  return splitByChar(input, ',')
}

/**
 * Split input by a specific char and blank.
 * @example
 * const = Utils.splitByChar('a, b , c=d', '=')
 * @param {string} input
 * @returns {array} input separated by comma
 */
const splitByChar = function(input: string, char: string) {
  const exp = new RegExp(char, 'g')
  return input.replace(exp, ' ').split(/\s+/)
}

/**
 * Print a simple table.
 * A table style for `semo status`, if you don't like this style, can use Utils.table
 * @param {array} columns Table columns
 * @param {string} caption Table caption
 * @param {object} borderOptions Border options
 */
const outputTable = function(columns: string[][], caption: string = '', borderOptions = {}) {
  // table config
  const config = {
    drawHorizontalLine: () => {
      return false
    },
    columnDefault: {
      paddingLeft: 2,
      paddingRight: 1
    },
    border: Object.assign(getBorderCharacters(`void`), { bodyJoin: `:` }, borderOptions)
  }

  if (caption) {
    info(caption)
  }
  console.log(table(columns, config))
}

/**
 * Parse packages from yargs option
 * @param {*} input yarns option input, could be string or array
 * @returns {array} Package list
 */
const parsePackageNames = function(input: string | string[]) {
  if (_.isString(input)) {
    return splitComma(input)
  }

  if (_.isArray(input)) {
    return _.flatten(input.map(item => splitComma(item)))
  }

  return []
}

/**
 * Load any package's package.json
 * @param {string} pkg package name
 * @param {array} paths search paths
 */
const getPackagePath = function(pkg: string | undefined = undefined, paths: any = []): any {
  const packagePath = findUp.sync('package.json', {
    cwd: pkg ? path.dirname(require.resolve(pkg, { paths })) : process.cwd()
  })
  return packagePath
}

/**
 * Load any package's package.json
 * @param {string} pkg package name
 * @param {array} paths search paths
 */
const loadPackageInfo = function(pkg: string | undefined = undefined, paths: any = []): any {
  const packagePath = getPackagePath(pkg, paths)
  return packagePath ? require(packagePath) : {}
}

/**
 * Load core package.json
 */
const loadCorePackageInfo = function(): any {
  const packagePath = findUp.sync('package.json', {
    cwd: path.resolve('../../', __dirname)
  })
  return packagePath ? require(packagePath) : {}
}

/**
 * Execute command, because npm install running info can not be catched by shelljs, temporarily use this one
 * @param {string} command Command to exec
 * @param {object} options Options stdio default is [0, 1, 2]
 */
const exec = function(command: string, options: any = {}): any {
  debugCore('Utils.exec', { command, options })
  if (!options.stdio) {
    options.stdio = [0, 1, 2]
  }
  return execSync(command, options)
}

/**
 * Get current node env setting
 *
 * You can change the node-env-key in command args or semo rc file
 */
const getNodeEnv = (argv: any = null) => {
  argv = argv || cachedInstance.get('argv') || {}
  const nodeEnvKey = argv.nodeEnvKey || argv.nodeEnv || 'NODE_ENV'
  return process.env[nodeEnvKey] || 'development'
}

/**
 * Shortcut for checking if or not current env is production
 */
const isProduction = () => getNodeEnv() === 'production'

/**
 * Shortcut for checking if or not current env is development
 */
const isDevelopment = () => getNodeEnv() === 'development'

/**
 * Sleep a while of ms
 * @param {integer} ms
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const delay = sleep

/**
 * Keep repl history
 * 
 * repl.history 0.1.4 not compatile with node v12, so find other solution.
 */
const replHistory = function (repl, file) {

  try {
      fs.statSync(file);
      repl.history = fs.readFileSync(file, 'utf-8').split('\n').reverse();
      repl.history.shift();
      repl.historyIndex = -1; // will be incremented before pop
  } catch (e) { }

  let fd = fs.openSync(file, 'a');
  let wstream = fs.createWriteStream(file, {
      fd: fd
  });
  wstream.on('error', function (err) {
      throw err;
  });

  repl.addListener('line', function (code) {
      if (code && code !== '.history') {
          wstream.write(code + '\n');
      } else {
          repl.historyIndex++;
          repl.history.pop();
      }
  });

  process.on('exit', function () {
      fs.closeSync(fd);
  });

  repl.commands['history'] = {
      help: 'Show the history',
      action: function () {
          var out: any = [];
          repl.history.forEach(function (v) {
              out.push(v);
          });
          repl.outputStream.write(out.reverse().join('\n') + '\n');
          repl.displayPrompt();
      }
  };
}

/**
 * Launch dispatcher
 */
const launchDispatcher = (opts: any = {}) => {
  // process.on('warning', e => console.warn(e.stack));
  process.setMaxListeners(0);

  const pkg = loadCorePackageInfo()
  updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 * 7 }).notify({
    defer: false,
    isGlobal: true
  })

  const cache = getInternalCache()
  let parsedArgv = yParser(process.argv.slice(2), {
    'sort-commands': true,
    'populate--': true
  })
  let parsedArgvOrigin = parsedArgv
  cache.set('argv', parsedArgv) // set argv first time
  let appConfig = getApplicationConfig({
    packageName: opts.packageName,
    scriptName: opts.scriptName || 'semo',
    coreDir: opts.coreDir,
    orgMode: opts.orgMode, // Means my package publish under npm orgnization scope
    [`$${opts.scriptName || 'semo'}`]: { Utils: module.exports, VERSION: pkg.version }
  })
  
  yargs.config(appConfig)
  parsedArgv = _.merge(appConfig, parsedArgv)
  cache.set('argv', parsedArgv) // set argv second time
  cache.set('yargs', yargs)

  const plugins = getAllPluginsMapping(parsedArgv)
  const config = getCombinedConfig(parsedArgv)
  const packageConfig = loadPackageInfo()

  if (!parsedArgv.scriptName) {
    yargs.hide('script-name').option('script-name', {
      default: 'semo',
      describe: 'Rename script name.',
      type: 'string'
    })
  } else {
    if (!_.isString(parsedArgv.scriptName)) {
      error('--script-name must be string, should be used only once.')
    }
    yargs.scriptName(parsedArgv.scriptName)
  }

  yargs.hide('plugin-prefix').option('plugin-prefix', {
    default: 'semo',
    describe: 'Set plugin prefix.'
  })

  let scriptName = parsedArgv.scriptName || 'semo'
  const yargsOpts = {
    // Give each command an ability to disable temporarily
    visit: (command, pathTofile, filename) => {
      command.middlewares = command.middlewares ? _.castArray(command.middlewares) : []

      command.middlewares.unshift(async (argv) => {
        if (!command.noblank) {
          // Insert a blank line to terminal
          console.log()
        }

        argv['$config'] = {};
        // Give command a plugin level config
        if (command.plugin) {
          command.plugin = command.plugin.startsWith(appConfig.scriptName + '-plugin-') ? command.plugin.substring(appConfig.scriptName + '-plugin-'.length) : command.plugin
        
          if (command.plugin && argv['$plugin']) {
            if (argv['$plugin'][command.plugin]) {
              argv['$config'] = formatRcOptions(argv['$plugin'][command.plugin] || {})
            } else if (argv['$plugin'][appConfig.scriptName + '-plugin-' + command.plugin]) {
              argv['$config'] = formatRcOptions(argv['$plugin'][appConfig.scriptName + '-plugin-' + command.plugin] || {})
            }
          }
        }

        // argv['$' + scriptName] = { Utils: module.exports }
        argv.$command = command
        argv.$input = await getStdin()
        getInternalCache().set('argv', argv)
      })

      if (command.middleware) {
        command.middlewares = command.middlewares.concat(command.middleware)
      }
      return command.disabled === true ? false : command
    }
  }
  if (!parsedArgv.disableCoreCommand && opts.coreDir && packageConfig.name !== scriptName) {
    // Load local commands
    yargs.commandDir(path.resolve(opts.coreDir, appConfig.coreCommandDir), yargsOpts)
  }

  // Load plugin commands
  if (plugins) {
    Object.keys(plugins).map(function(plugin) {
      if (
        config.pluginConfigs[plugin] &&
        config.pluginConfigs[plugin].commandDir &&
        fileExistsSyncCache(path.resolve(plugins[plugin], config.pluginConfigs[plugin].commandDir))
      ) {
        yargs.commandDir(path.resolve(plugins[plugin], config.pluginConfigs[plugin].commandDir), yargsOpts)
      }
    })
  }

  // Load application commands
  if (
    appConfig.commandDir &&
    fileExistsSyncCache(path.resolve(process.cwd(), appConfig.commandDir))
  ) {
    yargs.commandDir(path.resolve(process.cwd(), appConfig.commandDir), yargsOpts)
  }

  ;(async () => {
    try {
      // @ts-ignore
      // Register global middlewares
      yargs.middleware((argv, yargs) => {
        const commandPath = yargs.getContext().fullCommands.slice().map(cmd => cmd.split(' ')[0])
        let commandDefault

        if (argv.commandDefault && commandPath.length >= 1) {
          while (commandPath.length >= 1) {
            commandDefault = _.get(argv.commandDefault, commandPath)
            if (!_.isObject(commandDefault) || _.isArray(commandDefault)) {
              commandPath.pop()
              continue
            }
            break
          }
        }

        // Insert home rc command default options between default options and cli options
        // So the priority is: command default options < application rc options < home rc options < cli options
        const overrideArgv = {}
        const aliases = yargs.parsed.aliases
        Object.keys(parsedArgvOrigin).filter(key => key !== '_').forEach(key => {
          if (aliases[key] && Array.isArray(aliases[key])) {
            overrideArgv[key] = parsedArgvOrigin[key]
            aliases[key].forEach(alias => {
              overrideArgv[alias] = parsedArgvOrigin[key]
            })
          }
        })

        argv = commandDefault ? _.merge(argv, formatRcOptions(commandDefault), overrideArgv) : argv
        cache.set('argv', argv) // set argv third time

        return argv
      })

      if (!parsedArgv.getYargsCompletions) {
        let beforeHooks = await invokeHook(`${scriptName}:before_command`)
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
          if (epilog && _.isString(epilog)) {
            return epilog
          } else if (_.isArray(epilog)) {
            let pop = epilog.pop()
            if (pop) {
              return pop
            }
          }

          return 'Find more information at https://semo.js.org'
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
        .parserConfiguration({
          'sort-commands': true,
          'populate--': true
        })
        .wrap(Math.min(120, yargs.terminalWidth())).argv

      if (!parsedArgv.getYargsCompletions) {
        let afterHooks = await invokeHook(`${scriptName}:after_command`)
        Object.keys(afterHooks).map(function(hook) {
          afterHooks[hook](parsedArgv, yargs)
        })
      }
    } catch (e) {
      if (!e.name || e.name !== 'YError') {
        error(e.stack)
      }
    }
  })()
}

/**
 * Load plugin rc config
 * 
 * @param name Plugin name
 * @param location plugin installed directory name under ~/.semo
 * @param home if load from HOME directory
 */
const loadPluginRc = (name, location = '', home = true) => {
  const argv: any = getInternalCache().get('argv')
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'

  let downloadDir = home ? process.env.HOME + `/.${scriptName}` : process.cwd()
  downloadDir = location ? downloadDir + `/${location}` : downloadDir
  const downloadDirNodeModulesPath = path.resolve(downloadDir, location)

  fs.ensureDirSync(downloadDir)
  fs.ensureDirSync(downloadDirNodeModulesPath)

  const packagePath = getPackagePath(name, [downloadDirNodeModulesPath])
  const packageDir = path.dirname(packagePath)

  let pluginConfig = parseRcFile(name, packageDir, argv)
  pluginConfig.dirname = packageDir

  return pluginConfig
}

const resolvePackage = (name, location = '', home = true) => {
  const argv: any = getInternalCache().get('argv')
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'

  let downloadDir = home ? process.env.HOME + `/.${scriptName}` : process.cwd()
  downloadDir = location ? downloadDir + `/${location}` : downloadDir
  const downloadDirNodeModulesPath = path.resolve(downloadDir, location)

  fs.ensureDirSync(downloadDir)
  fs.ensureDirSync(downloadDirNodeModulesPath)

  const pkgPath = require.resolve(name, { paths: [downloadDirNodeModulesPath] })
  return pkgPath
}

const installPackage = (name, location = '', home = true, force = false) => {
  const nameArray = _.castArray(name)
  const argv: any = getInternalCache().get('argv')
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'

  let downloadDir = home ? process.env.HOME + `/.${scriptName}` : process.cwd()
  downloadDir = location ? downloadDir + `/${location}` : downloadDir

  fs.ensureDirSync(downloadDir)

  if (!fs.existsSync(path.resolve(downloadDir, 'package.json'))) {
    exec(`cd ${downloadDir} && npm init -y`)
    convertToPrivate(path.resolve(downloadDir, 'package.json'))
  }

  if (force) {
    exec(`npm install ${nameArray.join(' ')} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`)
  }

  nameArray.forEach(pkg => {
    try {
      require.resolve(pkg, { paths: [downloadDir] })
    } catch (err) {
      if (err.code == 'MODULE_NOT_FOUND') {
        exec(`npm install ${pkg} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`)
      }
    }
  })
  

}

const uninstallPackage = (name, location = '', home = true) => {
  const nameArray = _.castArray(name)
  const argv: any = getInternalCache().get('argv')
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'

  let downloadDir = home ? process.env.HOME + `/.${scriptName}` : process.cwd()
  downloadDir = location ? downloadDir + `/${location}` : downloadDir

  fs.ensureDirSync(downloadDir)

  if (!fs.existsSync(path.resolve(downloadDir, 'package.json'))) {
    exec(`cd ${downloadDir} && npm init -y`)
    convertToPrivate(path.resolve(downloadDir, 'package.json'))
  }
  

  exec(`npm uninstall ${nameArray.join(' ')} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`)
}

/**
 * Import a package on runtime
 * 
 * If not exist, will install first,
 * 
 * @param name Package name
 * @param force Force install again
 * @param location node_module directory by location
 * @param home if true save modules to .semo, if false, save to cwd 
 */
const importPackage = (name, location = '', home = true, force = false) => {
  let pkg, pkgPath

  const argv: any = getInternalCache().get('argv')
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'

  let downloadDir = home ? process.env.HOME + `/.${scriptName}` : process.cwd()
  downloadDir = location ? downloadDir + `/${location}` : downloadDir
  const downloadDirNodeModulesPath = path.resolve(downloadDir, 'node_modules')

  fs.ensureDirSync(downloadDir)
  fs.ensureDirSync(downloadDirNodeModulesPath)

  if (!fs.existsSync(path.resolve(downloadDir, 'package.json'))) {
    exec(`cd ${downloadDir} && npm init -y`)
    convertToPrivate(path.resolve(downloadDir, 'package.json'))
  }

  if (force) {
    exec(`npm install ${name} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`)
  }

  try {
    pkgPath = require.resolve(name, { paths: [downloadDir] })    
    pkg = require(pkgPath)
  } catch (err) {
    if (err.code == 'MODULE_NOT_FOUND') {
      exec(`npm install ${name} --prefix ${downloadDir}`)
      pkgPath = require.resolve(name, { paths: [downloadDir] })
      pkg = require(pkgPath)
    }
  }

  return pkg
}

/**
 * convert pakcage.json to private, for internal use
 * @param packageJsonPath package.json file path
 */
const convertToPrivate = (packageJsonPath) => {
  try {
    const pkg = require(packageJsonPath)
    pkg.private = true
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2))
  } catch (e) {
    warn(e.message)
  }
}

/**
 * Get final config value
 * 
 * Only work in command handler, use top level config first than use plugin config
 * 
 * @param key config key
 * @param defaultValue default value
 */
const pluginConfig = (key: string, defaultValue: any = undefined) => {
  const argv: any = getInternalCache().get('argv') || {}
  return !_.isNull(argv[key]) && !_.isUndefined(argv[key]) 
    ? argv[key] 
    : !_.isNull(argv.$config[key]) && !_.isUndefined(argv.$config[key]) 
      ? argv.$config[key]
      : defaultValue
}

/**
 * Get current argv config
 */
const config = (key: any = undefined, defaultValue: any = undefined) => {
  let argv: any = getInternalCache().get('argv') || {}

  if (_.isEmpty(argv)) {
    argv = getApplicationConfig() || {}
    getInternalCache().set('argv', argv)
  }

  return key ? _.get(argv, key, defaultValue) : argv
}

/**
 * Check if obj is a Promise
 * 
 * Copy from `is-promise` npm module
 */
const isPromise = (obj) => {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

/**
 * Used for get deep value from a object or function or Promise
 * 
 * @param func a Promise, a Function or a literal object
 * @param getPath a key path
 */
const run = async (func, getPath = '') => {
  let result
  if (isPromise(func)) {
    result = await func
  } else if (_.isFunction(func)) {
    result = await func()
  } else  if (_.isObject(func)) {
    result = func
  } else {
    throw new Error('invalid func')
  }
  
  if (!getPath) {
    return result
  } else {
    return _.get(result, getPath)
  }
}

/**
 * Attach config info in another file to argv config
 * 
 * This is often for Application usage
 * 
 * @param prefix 
 * @param configPath 
 */
const extendConfig = (extendRcPath: string[] | string, prefix: any = undefined) => {
  let argv: any = getInternalCache().get('argv') || {}

  if (_.isEmpty(argv)) {
    argv = getApplicationConfig() || {}
    getInternalCache().set('argv', argv)
  }

  const extendRcPathArray = _.castArray(extendRcPath)

  extendRcPathArray.forEach(rcPath => {
    rcPath = path.resolve(process.cwd(), rcPath)
    if (rcPath && fileExistsSyncCache(rcPath)) {
      try {
        const rcFile = fs.readFileSync(rcPath, 'utf8')
        const parsedRc = yaml.parse(rcFile)
        let extendRc = formatRcOptions(parsedRc)
        if (prefix) {
          let prefixPart = _.get(argv, prefix)
          let mergePart = _.merge(prefixPart, extendRc)
          argv = _.set(argv, prefix, mergePart)
        } else {
          argv = _.merge(argv, extendRc)
        }
        getInternalCache().set('argv', argv) 
      } catch (e) {
        debugCore('load rc:', e)
        warn(`Global ${rcPath} config load failed!`)
      }
    }

    const nodeEnv = getNodeEnv(argv)
    let extendRcEnvPath = path.resolve(path.dirname(rcPath), `${path.basename(rcPath, '.yml')}.${nodeEnv}.yml`)
    if (extendRcEnvPath && fileExistsSyncCache(extendRcEnvPath)) {
      try {
        const rcFile = fs.readFileSync(extendRcEnvPath, 'utf8')
        const parsedRc = yaml.parse(rcFile)
        let extendRc = formatRcOptions(parsedRc)
        if (prefix) {
          let prefixPart = _.get(argv, prefix)
          let mergePart = _.merge(prefixPart, extendRc)
          argv = _.set(argv, prefix, mergePart)
        } else {
          argv = _.merge(argv, extendRc)
        }
        getInternalCache().set('argv', argv) 
      } catch (e) {
        debugCore('load rc:', e)
        warn(`Global ${extendRcEnvPath} config load failed!`)
      }
    }
  })

  return argv
}

/**
 * Semo utils functions and references to common modules.
 * @module Utils
 */
const Utils = {
  // npm packages
  /** [lodash](https://www.npmjs.com/package/lodash) reference, check [doc](https://lodash.com/docs). */
  _,
  /** [chalk](https://www.npmjs.com/package/chalk) reference */
  chalk,
  /** [chalk](https://www.npmjs.com/package/envinfo) reference */
  envinfo,
  /** [table](https://www.npmjs.com/package/table) reference */
  table,
  /** [day.js](https://www.npmjs.com/package/dayjs) reference, check [api](https://github.com/iamkun/dayjs/blob/HEAD/docs/en/API-reference.md) documentation. */
  day,
  /** [fs-extra](https://www.npmjs.com/package/fs-extra) reference */
  fs,
  /** [shelljs](https://www.npmjs.com/package/shelljs) reference. */
  shell,
  /** [debug](https://www.npmjs.com/package/debug) reference. */
  debug,
  /** [fuzzy](https://www.npmjs.com/package/fuzzy) reference. */
  fuzzy,
  /** [fuzzy](https://www.npmjs.com/package/glob) reference. */
  glob,
  /** [get-stdin](https://www.npmjs.com/package/get-stdin) reference */
  getStdin,
  /** [node-cache](https://www.npmjs.com/package/node-cache) reference */
  NodeCache,
  /** [yargs-parser](https://www.npmjs.com/package/yargs) reference */
  yargs,
  yParser,
  /** [yargs-parser](https://www.npmjs.com/package/yaml) reference */
  yaml,
  

  // custom functions
  md5,
  delay,
  splitComma,
  splitByChar,
  log,
  warn,
  info,
  success,
  error,
  Hook,
  outputTable,
  invokeHook,
  invokeHookAlter,
  extendSubCommand,
  getAllPluginsMapping,
  getCombinedConfig,
  getApplicationConfig,
  parsePackageNames,
  loadPackageInfo,
  loadPluginRc,
  loadCorePackageInfo,
  exec,
  run,
  isPromise,
  sleep,
  config,
  pluginConfig,
  extendConfig,
  getInternalCache,
  getCache,
  getNodeEnv,
  getAbsolutePath,
  isProduction,
  isDevelopment,
  fileExistsSyncCache,
  debugCore,
  formatRcOptions,
  replHistory,
  launchDispatcher,
  importPackage,
  installPackage,
  uninstallPackage,
  resolvePackage,
}

/** [inquirer](https://www.npmjs.com/package/inquirer) reference, with autocomplete plugin */
Object.defineProperty(Utils, 'inquirer', {
  get: () => {
    const inquirer = require('inquirer')
    return inquirer
  },
  enumerable: true
})

type UtilsExtra = typeof Utils & { inquirer: any }

export = Utils as UtilsExtra