import crypto from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import { sync as globSync } from 'glob'
import { table, getBorderCharacters } from 'table'
import findUp from 'find-up'
import _ from 'lodash'
import yaml from 'yaml'
import colorize from 'json-colorizer'
import stringify from 'json-stringify-pretty-compact'
import pc from 'picocolors'

import debug from 'debug'
import { execSync } from 'child_process'
import hash from 'object-hash'
import getStdin from 'get-stdin'
import NodeCache from 'node-cache'
import yargs from 'yargs'
import yargsInternal from 'yargs/yargs'
import envinfo from 'envinfo'
import dotenv, { DotenvConfigOptions } from 'dotenv'
import { expand as dotenvExpand } from 'dotenv-expand'

import shell from 'shelljs'
import chalk from 'chalk'
import { Hook } from './hook'
import day from 'dayjs'

// @ts-ignore
const yParser = yargsInternal.Parser

let cachedInstance: NodeCache

/**
 * Get Semo internal cache instance
 * @returns {NodeCache}
 */
const getInternalCache = function (): NodeCache {
  if (!cachedInstance) {
    cachedInstance = new NodeCache({
      useClones: false,
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
const getCache = function (namespace: string): NodeCache {
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
      useClones: false,
    })
    cachedInstance.set('cachedNamespaceInstances', cachedNamespaceInstances)
  }
  return cachedNamespaceInstances[namespace]
}

/**
 * Use dotenv style
 * @param expand expand dotenv
 * @param options dotenv options
 */
const useDotEnv = (expand: true, options: DotenvConfigOptions = {}) => {
  try {
    const myEnv = dotenv.config()
    if (expand && !myEnv.error) {
      dotenvExpand(myEnv)
    }
  } catch (e) {
    // .env may not exist, it's not a serious bug
  }
}

/**
 * debug core
 */
const debugCore = function (...args) {
  let debugCache: any = getInternalCache().get('debug')

  if (!debugCache) {
    const argv: any = getInternalCache().get('argv')
    const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'
    debugCache = debug(`${scriptName}-core`)

    getInternalCache().set('debug', debugCache)
  }

  debugCache(...args)

  return debugCache
}

const fileExistsSyncCache = function (filePath) {
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
const invokeHook = async function <T>(
  hook: any = null,
  options: IHookOption = { mode: 'assign' },
  argv: any = null,
): Promise<T> {
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
  const invokedHookCache: { [propName: string]: any } =
    cachedInstance.get('invokedHookCache') || {}
  hook = !hook.startsWith('hook_') ? `hook_${hook}` : hook
  options = Object.assign(
    {
      mode: 'assign',
      useCache: false,
      include: [],
      exclude: [],
      opts: {},
    },
    options,
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
    const plugins = argv.packageDirectory
      ? Object.assign(
          {},
          {
            [scriptName]: path.resolve(argv.packageDirectory),
          },
          getAllPluginsMapping(argv),
        )
      : getAllPluginsMapping(argv)

    if (
      appConfig &&
      appConfig.name !== scriptName &&
      appConfig.name !== argv.packageName &&
      !plugins[appConfig.name] &&
      appConfig.applicationDir &&
      appConfig.applicationDir !== argv.packageDirectory
    ) {
      plugins.application = appConfig.applicationDir
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

    const hookCollected: any[] = []
    const hookIndex: any[] = []
    for (let i = 0, length = Object.keys(plugins).length; i < length; i++) {
      const plugin = Object.keys(plugins)[i]

      // Process include option
      if (
        _.isArray(options.include) &&
        options.include.length > 0 &&
        !options.include.includes(plugin)
      ) {
        continue
      }

      // Process exclude option
      if (
        _.isArray(options.exclude) &&
        options.exclude.length > 0 &&
        options.exclude.includes(plugin)
      ) {
        continue
      }

      try {
        let pluginEntryPath // resolve plugin hook entry file path
        let hookDir // resolve plugin hook dir

        switch (plugin) {
          case scriptName:
            const coreRcInfo = parseRcFile(plugin, plugins[plugin])
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
        if (
          hookDir &&
          fileExistsSyncCache(
            path.resolve(plugins[plugin], hookDir, 'index.js'),
          )
        ) {
          pluginEntryPath = path.resolve(plugins[plugin], hookDir, 'index.js')
        }

        // pluginEntryPath resolve failed, means this plugin do not hook anything
        if (!pluginEntryPath) {
          continue
        }

        // force clear require cache
        if (options.reload && require.cache[pluginEntryPath]) {
          delete require.cache[pluginEntryPath]
        }
        let loadedPlugin = require(pluginEntryPath)
        if (_.isFunction(loadedPlugin)) {
          loadedPlugin = await loadedPlugin(Utils, argv)
        } else if (_.isFunction(loadedPlugin.default)) {
          loadedPlugin = await loadedPlugin.default(Utils, argv)
        }

        let forHookCollected: Hook | null = null
        if (loadedPlugin[hook]) {
          if (
            !loadedPlugin[hook].getHook ||
            !_.isFunction(loadedPlugin[hook].getHook)
          ) {
            forHookCollected = new Hook(loadedPlugin[hook])
          } else {
            forHookCollected = loadedPlugin[hook]
          }
        }

        if (forHookCollected) {
          const loadedPluginHook = forHookCollected.getHook(originModuler)
          if (_.isFunction(loadedPluginHook)) {
            hookCollected.push(loadedPluginHook(options))
          } else {
            hookCollected.push(loadedPluginHook)
          }
          hookIndex.push(plugin)
        }
      } catch (e) {
        if (!e.code || e.code !== 'MODULE_NOT_FOUND') {
          throw new Error(e.stack)
        } else {
          error(e.message, false)
        }
      }
    }

    const hookResolved: any[] = await Promise.all(hookCollected)
    hookResolved.forEach((pluginReturn, index) => {
      switch (options.mode) {
        case 'group':
          pluginReturn = pluginReturn || {}
          const plugin = hookIndex[index]
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
    })

    invokedHookCache[cacheKey] = pluginsReturn
    cachedInstance.set('invokedHookCache', invokedHookCache)

    return pluginsReturn
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
const extendSubCommand = function (
  command: string,
  moduleName: string,
  yargs: any,
  basePath: string,
): void {
  let argv: any = cachedInstance.get('argv') || {}
  if (_.isEmpty(argv)) {
    argv = yargs.getOptions().configObjects[0]
    getInternalCache().set('argv', yargs.getOptions().configObjects[0])
  }

  const plugins = getAllPluginsMapping(argv)
  const config = getCombinedConfig(argv)
  const opts = {
    // try to use ts command with ts-node/register
    extensions: ['ts', 'js'],
    exclude: /.d.ts$/,
    // Give each command an ability to disable temporarily
    visit: command => {
      command.middlewares = command.middlewares
        ? _.castArray(command.middlewares)
        : []

      command.middlewares.unshift(async argv => {
        if (!command.noblank) {
          // Insert a blank line to terminal
          console.log()
        }

        // Give command a plugin level config
        argv.$config = {}
        if (command.plugin) {
          command.plugin = command.plugin.startsWith(
            argv.scriptName + '-plugin-',
          )
            ? command.plugin.substring(argv.scriptName + '-plugin-'.length)
            : command.plugin

          if (command.plugin && argv.$plugin) {
            if (argv.$plugin[command.plugin]) {
              argv.$config = formatRcOptions(argv.$plugin[command.plugin] || {})
            } else if (
              argv.$plugin[argv.scriptName + '-plugin-' + command.plugin]
            ) {
              argv.$config = formatRcOptions(
                argv.$plugin[argv.scriptName + '-plugin-' + command.plugin] ||
                  {},
              )
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
    },
  }

  // load default commands
  const currentCommand: string | undefined = command.split('/').pop()
  if (
    currentCommand &&
    fileExistsSyncCache(path.resolve(basePath, currentCommand))
  ) {
    yargs.commandDir(path.resolve(basePath, currentCommand), opts)
  }

  // Load plugin commands
  if (plugins) {
    Object.keys(plugins).forEach(function (plugin): void {
      if (
        config.pluginConfigs[plugin] &&
        config.pluginConfigs[plugin].extendDir
      ) {
        if (
          fileExistsSyncCache(
            path.resolve(
              plugins[plugin],
              `${config.pluginConfigs[plugin].extendDir}/${moduleName}/src/commands`,
              command,
            ),
          )
        ) {
          yargs.commandDir(
            path.resolve(
              plugins[plugin],
              `${config.pluginConfigs[plugin].extendDir}/${moduleName}/src/commands`,
              command,
            ),
            opts,
          )
        }
      }
    })
  }

  // Load application commands
  if (
    config.extendDir &&
    fileExistsSyncCache(
      path.resolve(
        process.cwd(),
        `${config.extendDir}/${moduleName}/src/commands`,
        command,
      ),
    )
  ) {
    yargs.commandDir(
      path.resolve(
        process.cwd(),
        `${config.extendDir}/${moduleName}/src/commands`,
        command,
      ),
      opts,
    )
  }
}

/**
 * Get all plugins path mapping.
 * Same name plugins would be overriden orderly.
 * This function also influences final valid commands and configs.
 */
let configPluginLoaded = false
let enablePluginAutoScan = true
const getAllPluginsMapping = function (argv: any = {}): {
  [propName: string]: string
} {
  argv = argv || cachedInstance.get('argv') || {}
  let pluginsRegistryCachePath
  const nodeModulesDir = findUp.sync('node_modules', {
    cwd: process.cwd(),
    type: 'directory',
  })
  if (nodeModulesDir) {
    const pluginsRegistryCacheDir = path.resolve(nodeModulesDir, '.cache/semo')
    fs.ensureDirSync(pluginsRegistryCacheDir)
    pluginsRegistryCachePath = path.resolve(
      pluginsRegistryCacheDir,
      '.semo-plugins.json',
    )
  }

  if (
    !pluginsRegistryCachePath ||
    !fileExistsSyncCache(pluginsRegistryCachePath) ||
    !argv.cachePlugins
  ) {
    let plugins: { [propName: string]: any } =
      cachedInstance.get('plugins') || {}
    const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'
    if (_.isEmpty(plugins) && !configPluginLoaded) {
      const registerPlugins = Utils.config('$plugins.register') || {}
      if (!_.isEmpty(registerPlugins)) {
        enablePluginAutoScan = false
      }
      Object.keys(registerPlugins).forEach(plugin => {
        let pluginPath = registerPlugins[plugin]
        if (
          !plugin.startsWith('.') &&
          plugin.indexOf(scriptName + '-plugin-') === -1
        ) {
          plugin = scriptName + '-plugin-' + plugin
        }

        if (_.isBoolean(pluginPath) && pluginPath) {
          try {
            pluginPath = path.dirname(getPackagePath(plugin, [process.cwd()]))
            plugins[plugin] = pluginPath
          } catch (e) {
            warn(e.message)
          }
        } else if (
          (_.isString(pluginPath) && pluginPath.startsWith('/')) ||
          pluginPath.startsWith('.') ||
          pluginPath.startsWith('~')
        ) {
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

    const topPluginPattern =
      pluginPrefix.length > 1
        ? '{' + pluginPrefix.map(prefix => `${prefix}-plugin-*`).join(',') + '}'
        : pluginPrefix.map(prefix => `${prefix}-plugin-*`).join(',')
    const orgPluginPattern =
      pluginPrefix.length > 1
        ? '{' +
          pluginPrefix.map(prefix => `@*/${prefix}-plugin-*`).join(',') +
          '}'
        : pluginPrefix.map(prefix => `@*/${prefix}-plugin-*`).join(',')

    if (_.isEmpty(plugins) && enablePluginAutoScan) {
      plugins = {}

      // Process core plugins if needed
      // Maybe core need to interact with some other plugins
      globSync(topPluginPattern, {
        noext: true,
        cwd: path.resolve(__dirname, '../plugins'),
      }).forEach(function (plugin): void {
        plugins[plugin] = path.resolve(__dirname, '../plugins', plugin)
      })

      // argv.packageDirectory not always exists, if not, plugins list will not include npm global plugins
      if (!argv.disableGlobalPlugin && argv.packageDirectory) {
        // process core same directory top level plugins
        globSync(topPluginPattern, {
          noext: true,
          cwd: path.resolve(
            argv.packageDirectory,
            argv.orgMode ? '../../' : '../',
          ),
        }).forEach(function (plugin): void {
          plugins[plugin] = path.resolve(
            argv.packageDirectory,
            argv.orgMode ? '../../' : '../',
            plugin,
          )
        })

        // Only local dev needed: load sibling plugins in packageDirectory parent directory
        // Only for orgMode = true, if orgMode = false, the result would be same as above search
        if (argv.orgMode) {
          globSync(topPluginPattern, {
            noext: true,
            cwd: path.resolve(argv.packageDirectory, '../'),
          }).forEach(function (plugin): void {
            plugins[plugin] = path.resolve(argv.packageDirectory, '../', plugin)
          })
        }

        // Process core same directory org npm plugins
        globSync(orgPluginPattern, {
          noext: true,
          cwd: path.resolve(
            argv.packageDirectory,
            argv.orgMode ? '../../' : '../',
          ),
        }).forEach(function (plugin): void {
          plugins[plugin] = path.resolve(
            argv.packageDirectory,
            argv.orgMode ? '../../' : '../',
            plugin,
          )
        })
      }

      if (process.env.HOME && !argv.disableHomePlugin) {
        // Semo home is a special directory
        if (
          fileExistsSyncCache(
            path.resolve(
              process.env.HOME,
              '.' + scriptName,
              `.${scriptName}rc.yml`,
            ),
          )
        ) {
          // So home plugin directory will not be overridden by other places normally.
          plugins['.' + scriptName] = path.resolve(
            process.env.HOME,
            '.' + scriptName,
          )
        }

        // process home npm plugins
        globSync(topPluginPattern, {
          noext: true,
          cwd: path.resolve(
            process.env.HOME,
            `.${scriptName}`,
            'home-plugin-cache',
            'node_modules',
          ),
        }).forEach(function (plugin): void {
          if (process.env.HOME) {
            plugins[plugin] = path.resolve(
              process.env.HOME,
              `.${scriptName}`,
              'home-plugin-cache',
              'node_modules',
              plugin,
            )
          }
        })

        // process home npm scope plugins
        globSync(orgPluginPattern, {
          noext: true,
          cwd: path.resolve(process.env.HOME, `.${scriptName}`, 'node_modules'),
        }).forEach(function (plugin): void {
          if (process.env.HOME) {
            plugins[plugin] = path.resolve(
              process.env.HOME,
              `.${scriptName}`,
              'node_modules',
              plugin,
            )
          }
        })
      }

      // process cwd(current directory) npm plugins
      globSync(topPluginPattern, {
        noext: true,
        cwd: path.resolve(process.cwd(), 'node_modules'),
      }).forEach(function (plugin) {
        plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
      })

      // process cwd(current directory) npm scope plugins
      globSync(orgPluginPattern, {
        noext: true,
        cwd: path.resolve(process.cwd(), 'node_modules'),
      }).forEach(function (plugin) {
        plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
      })

      const config = getApplicationConfig()
      const pluginDirs = _.castArray(config.pluginDir)
      pluginDirs.forEach(pluginDir => {
        if (fileExistsSyncCache(pluginDir)) {
          // process local plugins
          globSync(topPluginPattern, {
            noext: true,
            cwd: path.resolve(process.cwd(), pluginDir),
          }).forEach(function (plugin) {
            plugins[plugin] = path.resolve(process.cwd(), pluginDir, plugin)
          })

          // process local npm scope plugins
          globSync(orgPluginPattern, {
            noext: true,
            cwd: path.resolve(process.cwd(), pluginDir),
          }).forEach(function (plugin) {
            plugins[plugin] = path.resolve(process.cwd(), pluginDir, plugin)
          })
        }
      })

      // Process plugin project
      // If project name contains `-plugin-`, then current directory should be plugin too.
      if (fileExistsSyncCache(path.resolve(process.cwd(), 'package.json'))) {
        const pkgConfig = require(path.resolve(process.cwd(), 'package.json'))
        const matchPluginProject = pluginPrefix
          .map(prefix => `${prefix}-plugin-`)
          .join('|')
        const regExp = new RegExp(`^(@[^/]+\/)?(${matchPluginProject})`)
        if (pkgConfig.name && regExp.test(pkgConfig.name)) {
          plugins[pkgConfig.name] = path.resolve(process.cwd())
        }
      }

      cachedInstance.set('plugins', plugins)
    }

    // extraPluginDir plugins would not be in cache
    const extraPluginDirEnvName = _.upperCase(scriptName) + '_PLUGIN_DIR'
    if (
      extraPluginDirEnvName &&
      process.env[extraPluginDirEnvName] &&
      fileExistsSyncCache(
        getAbsolutePath(process.env[extraPluginDirEnvName] as string),
      )
    ) {
      const envDir = getAbsolutePath(String(process.env[extraPluginDirEnvName]))

      // process cwd npm plugins
      globSync(topPluginPattern, {
        noext: true,
        cwd: path.resolve(envDir),
      }).forEach(function (plugin) {
        plugins[plugin] = path.resolve(envDir, plugin)
      })

      // process cwd npm scope plugins
      globSync(orgPluginPattern, {
        noext: true,
        cwd: path.resolve(envDir),
      }).forEach(function (plugin) {
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
        return (
          includePlugins.includes(plugin) ||
          includePlugins.includes(scriptName + '-plugin-' + plugin)
        )
      })
    }

    if (_.isArray(excludePlugins) && excludePlugins.length > 0) {
      plugins = _.omitBy(plugins, (pluginPath, plugin) => {
        if (plugin.indexOf(scriptName + '-plugin-') === 0) {
          plugin = plugin.substring((scriptName + '-plugin-').length)
        }
        return (
          excludePlugins.includes(plugin) ||
          excludePlugins.includes(scriptName + '-plugin-' + plugin)
        )
      })
    }

    // Write plugins to  pluginsRegistryCachePath

    if (pluginsRegistryCachePath && argv.cachePlugins) {
      fs.writeFileSync(pluginsRegistryCachePath, JSON.stringify(plugins))
    }

    return plugins
  } else {
    console.log('use cache')
    const plugins = require(pluginsRegistryCachePath)
    return plugins
  }
}

/**
 * Get absolute path or dir, this func will not judge if exist
 */
const getAbsolutePath = (filePath: string): string => {
  if (filePath[0] === '/') return filePath

  if (process.env.HOME) {
    if (filePath[0] === '~') return filePath.replace(/^~/, process.env.HOME)
  }

  return path.resolve(filePath)
}

/**
 * Get application semo config only.
 *
 * @param cwd
 * @param opts
 *   opts.scriptName: set scriptName
 */
const getApplicationConfig = function (opts: any = {}) {
  let argv: any = cachedInstance.get('argv') || {}

  const cache = cachedInstance.get('getApplicationConfig')
  if (!_.isEmpty(cache)) {
    return cache
  }

  const scriptName = opts.scriptName
    ? opts.scriptName
    : argv && argv.scriptName
      ? argv.scriptName
      : 'semo'
  argv = Object.assign(argv, opts, { scriptName })

  let applicationConfig

  const configPath = findUp.sync([`.${scriptName}rc.yml`], {
    cwd: opts.cwd,
  })

  const nodeEnv = getNodeEnv(argv)
  const configEnvPath = findUp.sync([`.${scriptName}rc.${nodeEnv}.yml`], {
    cwd: opts.cwd,
  })

  // Load home config if exists
  const homeSemoYamlRcPath = process.env.HOME
    ? path.resolve(process.env.HOME, `.${scriptName}`, `.${scriptName}rc.yml`)
    : ''
  if (homeSemoYamlRcPath && fileExistsSyncCache(homeSemoYamlRcPath)) {
    try {
      const rcFile = fs.readFileSync(homeSemoYamlRcPath, 'utf8')
      applicationConfig = formatRcOptions(yaml.parse(rcFile))
    } catch (e) {
      debugCore('load rc:', e)
      warn(`Global ${homeSemoYamlRcPath} config load failed!`)
      applicationConfig = {}
    }
  } else {
    applicationConfig = {}
  }
  applicationConfig.applicationDir = opts.cwd
    ? opts.cwd
    : configPath
      ? path.dirname(configPath)
      : process.cwd()

  // Inject some core config, hard coded
  applicationConfig = Object.assign({}, applicationConfig, opts, {
    coreCommandDir: 'lib/commands',
  })

  // Load application rc, if same dir with core, it's a dup process, rare case.
  if (
    fileExistsSyncCache(
      path.resolve(applicationConfig.applicationDir, 'package.json'),
    )
  ) {
    const packageInfo = require(
      path.resolve(applicationConfig.applicationDir, 'package.json'),
    )

    if (packageInfo.name) {
      applicationConfig.name = packageInfo.name
    }

    // args > package > current rc
    if (packageInfo.rc) {
      packageInfo.rc = formatRcOptions(packageInfo.rc)
      applicationConfig = Object.assign({}, applicationConfig, packageInfo.rc)
    }
    if (packageInfo[scriptName]) {
      packageInfo[scriptName] = formatRcOptions(packageInfo[scriptName])
      applicationConfig = Object.assign(
        {},
        applicationConfig,
        packageInfo[scriptName],
      )
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
    } catch (e) {
      debugCore('load rc:', e)
      warn('application rc config load failed!')
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
    } catch (e) {
      debugCore('load rc:', e)
      warn('application env rc config load failed!')
    }
  }

  cachedInstance.set('getApplicationConfig', applicationConfig)

  return applicationConfig
}

/**
 * Format options keys
 *
 * Make compatible of param cases and camel cases
 */
const formatRcOptions = opts => {
  if (!_.isObject(opts)) {
    throw new Error('Not valid rc options!')
  }
  Object.keys(opts)
    .filter(key => key.indexOf('-') > -1 || key.indexOf('.') > -1)
    .forEach(key => {
      const newKey = key
        .replace(/--+/g, '-')
        .replace(/^-/g, '')
        .replace(/-([a-z])/g, (m, p1) => p1.toUpperCase())
        .replace('.', '_')
      opts[newKey] = opts[key]
      // delete opts[key] // sometimes we need original style
    })
  return opts
}

const parseRcFile = function (plugin, pluginPath, argv: any = {}) {
  argv = argv || cachedInstance.get('argv') || {}
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'

  const cacheKey = `parseRcFile:${plugin}:${pluginPath}`
  const cache = cachedInstance.get(cacheKey)

  if (!_.isEmpty(cache)) {
    return cache
  }

  const pluginSemoYamlRcPath = path.resolve(pluginPath, `.${scriptName}rc.yml`)
  const pluginPackagePath = path.resolve(pluginPath, 'package.json')
  let pluginConfig
  if (fileExistsSyncCache(pluginSemoYamlRcPath)) {
    try {
      const rcFile = fs.readFileSync(pluginSemoYamlRcPath, 'utf8')
      pluginConfig = formatRcOptions(yaml.parse(rcFile))

      try {
        const packageConfig = require(pluginPackagePath)
        pluginConfig.version = packageConfig.version
      } catch (e) {
        pluginConfig.version = '0.0.0'
      }
    } catch (e) {
      debugCore('load rc:', e)
      warn(`Plugin ${plugin} .semorc.yml config load failed!`)
      pluginConfig = {}
    }
  }

  cachedInstance.set(cacheKey, pluginConfig)

  return pluginConfig
}

/**
 * Get commbined config from whole environment.
 */
const getCombinedConfig = function (argv: any = {}): {
  [propName: string]: any
} {
  let combinedConfig: { [propName: string]: any } =
    cachedInstance.get('combinedConfig') || {}
  const pluginConfigs: { [propName: string]: any } = {}

  if (_.isEmpty(combinedConfig)) {
    const plugins = getAllPluginsMapping(argv)
    Object.keys(plugins).forEach(plugin => {
      const pluginConfig = parseRcFile(plugin, plugins[plugin], argv)

      const pluginConfigPick = _.pick(pluginConfig, [
        'commandDir',
        'extendDir',
        'hookDir',
        plugin,
      ])
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
const log = function (message: any) {
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
const error = function (message: any, exit = true, errorCode = 1) {
  message = _.isString(message) ? { message } : message
  console.log(pc.red(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Print warn message with yellow color.
 * @param {mix} message Error message to log
 */
const warn = function (message: any, exit = false, errorCode = 0) {
  message = _.isString(message) ? { message } : message
  console.log(pc.yellow(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Print info message with green color.
 * @param {mix} message Error message to log
 */
const info = function (message: any, exit = false, errorCode = 0) {
  message = _.isString(message) ? { message } : message
  console.log(pc.cyan(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Print success message with green color.
 * @param {mix} message Error message to log
 */
const success = function (message: any, exit = false, errorCode = 0) {
  message = _.isString(message) ? { message } : message
  console.log(pc.green(message.message))
  if (exit) {
    process.exit(errorCode)
  }
}

/**
 * Compute md5.
 * @param {string} s
 */
const md5 = function (s: string) {
  return crypto.createHash('md5').update(s, 'utf8').digest('hex')
}

/**
 * Split input by comma and blank.
 * @example
 * const = Utils.splitComma('a, b , c,d')
 * @param {string} input
 * @returns {array} input separated by comma
 */
const splitComma = function (input: string) {
  return splitByChar(input, ',')
}

/**
 * Split input by a specific char and blank.
 * @example
 * const = Utils.splitByChar('a, b , c=d', '=')
 * @param {string} input
 * @returns {array} input separated by comma
 */
const splitByChar = function (input: string, char: string) {
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
const outputTable = function (
  columns: string[][],
  caption: string = '',
  borderOptions = {},
) {
  // table config
  const config = {
    drawHorizontalLine: () => {
      return false
    },
    columnDefault: {
      paddingLeft: 2,
      paddingRight: 1,
    },
    border: Object.assign(
      getBorderCharacters('void'),
      { bodyJoin: ':' },
      borderOptions,
    ),
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
const parsePackageNames = function (input: string | string[]) {
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
const getPackagePath = function (
  pkg: string | undefined = undefined,
  paths: any = [],
): any {
  const packagePath = findUp.sync('package.json', {
    cwd: pkg ? path.dirname(require.resolve(pkg, { paths })) : process.cwd(),
  })
  return packagePath
}

/**
 * Load any package's package.json
 * @param {string} pkg package name
 * @param {array} paths search paths
 */
const loadPackageInfo = function (
  pkg: string | undefined = undefined,
  paths: any = [],
): any {
  const packagePath = getPackagePath(pkg, paths)
  return packagePath ? require(packagePath) : {}
}

/**
 * Load core package.json
 */
const loadCorePackageInfo = function (): any {
  const packagePath = findUp.sync('package.json', {
    cwd: path.resolve('../../', __dirname),
  })
  return packagePath ? require(packagePath) : {}
}

/**
 * Execute command, because npm install running info can not be catched by shelljs, temporarily use this one
 * @param {string} command Command to exec
 * @param {object} options Options stdio default is [0, 1, 2]
 */
const exec = function (command: string, options: any = {}): any {
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
    fs.statSync(file)
    repl.history = fs.readFileSync(file, 'utf-8').split('\n').reverse()
    repl.history.shift()
    repl.historyIndex = -1 // will be incremented before pop
  } catch (e) {}

  const fd = fs.openSync(file, 'a')
  const wstream = fs.createWriteStream(file, {
    fd,
  })
  wstream.on('error', function (err) {
    throw err
  })

  repl.addListener('line', function (code) {
    if (code && code !== '.history') {
      wstream.write(code + '\n')
    } else {
      repl.historyIndex++
      repl.history.pop()
    }
  })

  process.on('exit', function () {
    fs.closeSync(fd)
  })

  repl.commands.history = {
    help: 'Show the history',
    action: function () {
      const out: any = []
      repl.history.forEach(function (v) {
        out.push(v)
      })
      repl.outputStream.write(out.reverse().join('\n') + '\n')
      repl.displayPrompt()
    },
  }
}

/**
 * Launch dispatcher
 */
const launchDispatcher = async (opts: any = {}) => {
  // process.on('warning', e => console.warn(e.stack));
  process.setMaxListeners(0)

  useDotEnv(true)

  const pkg = loadCorePackageInfo()
  // const updateNotifier = await import('update-notifier')
  // updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 * 7 }).notify({
  //   defer: false,
  //   isGlobal: true,
  // })

  const cache = getInternalCache()
  // @see https://github.com/yargs/yargs/blob/main/lib/typings/yargs-parser-types.ts#L35
  let parsedArgv = yParser(process.argv.slice(2), {
    /** Should commands be sorted in help? */
    'sort-commands': true,
    /** Should unparsed flags be stored in -- or _? Default is `false` */
    'populate--': true,
  })
  // let parsedArgvOrigin = parsedArgv;
  cache.set(
    'argv',
    Object.assign(parsedArgv, {
      scriptName: opts.scriptName || 'semo',
    }),
  ) // set argv first time
  let appConfig = getApplicationConfig()

  appConfig = Object.assign(appConfig, {
    scriptName: opts.scriptName,
    packageName: opts.packageName,
    packageDirectory: opts.packageDirectory,
    orgMode: opts.orgMode, // Means my package publish under npm orgnization scope
    [`$${opts.scriptName || 'semo'}`]: { Utils, VERSION: pkg.version },
    originalArgv: process.argv.slice(2),
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
      type: 'string',
    })
  } else {
    if (!_.isString(parsedArgv.scriptName)) {
      error('--script-name must be string, should be used only once.')
    }
    yargs.scriptName(parsedArgv.scriptName)
  }

  yargs.hide('plugin-prefix').option('plugin-prefix', {
    default: 'semo',
    describe: 'Set plugin prefix.',
  })

  yargs.hide('enable-core-hook').option('enable-core-hook', {
    default: [],
    describe: 'Enable core default disabled hook',
  })

  const scriptName = parsedArgv.scriptName || 'semo'
  const yargsOpts = {
    // try to use ts command with ts-node/register
    extensions: ['ts', 'js'],
    exclude: /.d.ts$/,
    // Give each command an ability to disable temporarily
    visit: (command, pathTofile, filename) => {
      command.middlewares = command.middlewares
        ? _.castArray(command.middlewares)
        : []

      command.middlewares.unshift(async argv => {
        if (!command.noblank) {
          // Insert a blank line to terminal
          console.log()
        }

        argv.$config = {}
        // Give command a plugin level config
        if (command.plugin) {
          command.plugin = command.plugin.startsWith(
            appConfig.scriptName + '-plugin-',
          )
            ? command.plugin.substring(appConfig.scriptName + '-plugin-'.length)
            : command.plugin

          if (command.plugin && argv.$plugin) {
            if (argv.$plugin[command.plugin]) {
              argv.$config = formatRcOptions(argv.$plugin[command.plugin] || {})
            } else if (
              argv.$plugin[appConfig.scriptName + '-plugin-' + command.plugin]
            ) {
              argv.$config = formatRcOptions(
                argv.$plugin[
                  appConfig.scriptName + '-plugin-' + command.plugin
                ] || {},
              )
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
    },
  }

  if (
    !parsedArgv.disableCoreCommand &&
    opts.packageDirectory &&
    packageConfig.name !== scriptName
  ) {
    // Load core commands
    yargs.commandDir(
      path.resolve(opts.packageDirectory, appConfig.coreCommandDir),
      yargsOpts,
    )
  }

  // Load plugin commands
  if (plugins) {
    Object.keys(plugins).forEach(function (plugin) {
      if (
        config.pluginConfigs[plugin] &&
        config.pluginConfigs[plugin].commandDir &&
        fileExistsSyncCache(
          path.resolve(
            plugins[plugin],
            config.pluginConfigs[plugin].commandDir,
          ),
        )
      ) {
        yargs.commandDir(
          path.resolve(
            plugins[plugin],
            config.pluginConfigs[plugin].commandDir,
          ),
          yargsOpts,
        )
      }
    })
  }

  // Load application commands
  if (
    appConfig.commandDir &&
    fileExistsSyncCache(path.resolve(process.cwd(), appConfig.commandDir))
  ) {
    yargs.commandDir(
      path.resolve(process.cwd(), appConfig.commandDir),
      yargsOpts,
    )
  }

  ;(async () => {
    try {
      // @ts-ignore
      // Register global middlewares
      yargs.middleware((argv, yargs: yargs.Argv) => {
        // const commandPath = yargs
        //   .getContext()
        //   .fullCommands.slice()
        //   .map(cmd => cmd.split(" ")[0]);
        // let commandDefault;

        // if (argv.commandDefault && commandPath.length >= 1) {
        //   while (commandPath.length >= 1) {
        //     commandDefault = _.get(argv.commandDefault, commandPath);
        //     if (!_.isObject(commandDefault) || _.isArray(commandDefault)) {
        //       commandPath.pop();
        //       continue;
        //     }
        //     break;
        //   }
        // }

        // Insert home rc command default options between default options and cli options
        // So the priority is: command default options < application rc options < home rc options < cli options
        // const overrideArgv = {};
        // const aliases = yargs.parsed.aliases;
        // Object.keys(parsedArgvOrigin)
        //   .filter(key => key !== "_")
        //   .forEach(key => {
        //     if (aliases[key] && Array.isArray(aliases[key])) {
        //       overrideArgv[key] = parsedArgvOrigin[key];
        //       aliases[key].forEach(alias => {
        //         overrideArgv[alias] = parsedArgvOrigin[key];
        //       });
        //     }
        //   });

        // argv = commandDefault
        //   ? _.merge(argv, formatRcOptions(commandDefault), overrideArgv)
        //   : argv;
        // cache.set("argv", argv); // set argv third time

        return argv
      })

      if (
        !parsedArgv.getYargsCompletions &&
        parsedArgv.enableCoreHook &&
        parsedArgv.enableCoreHook.includes('before_command')
      ) {
        debugCore('Core hook before_command triggered')
        const beforeHooks = await invokeHook<Function[]>(
          `${scriptName}:before_command`,
        )
        Object.keys(beforeHooks).forEach(function (hook) {
          beforeHooks[hook](parsedArgv, yargs)
        })
      }

      if (!parsedArgv.disableCoreCommand && !parsedArgv.disableCore) {
        yargs.hide('disable-core-command').option('disable-core-command', {
          alias: 'disable-core',
          describe: 'Disable core commands.',
        })

        if (
          !parsedArgv.disableCompletionCommand &&
          !parsedArgv.disableCompletion
        ) {
          yargs
            .hide('disable-completion-command')
            .option('disable-completion-command', {
              alias: 'disable-completion',
              describe: 'Disable completion command.',
            })

          if (!parsedArgv.hideCompletionCommand && !parsedArgv.hideCompletion) {
            yargs
              .hide('hide-completion-command')
              .option('hide-completion-command', {
                alias: 'hide-completion',
                describe: 'Hide completion command.',
              })
            yargs.completion('completion', 'Generate completion script')
          } else {
            yargs.completion('completion', false)
          }
        }
      }

      if (!parsedArgv.disableGlobalPlugin && !parsedArgv.disableGlobalPlugins) {
        yargs.hide('disable-global-plugin').option('disable-global-plugin', {
          alias: 'disable-global-plugins',
          describe: 'Disable global plugins.',
        })
      }

      if (!parsedArgv.disableHomePlugin && !parsedArgv.disableHomePlugins) {
        yargs.hide('disable-home-plugin').option('disable-home-plugin', {
          alias: 'disable-home-plugins',
          describe: 'Disable home plugins.',
        })
      }

      if (!parsedArgv.hideEpilog && !parsedArgv.disableCoreCommand) {
        yargs.hide('hide-epilog').option('hide-epilog', {
          describe: 'Hide epilog.',
        })
        yargs.hide('set-epilog').option('set-epilog', {
          default: false,
          describe: 'Set epilog.',
        })

        yargs.epilog(
          ((epilog: string | string[]): string => {
            if (epilog && _.isString(epilog)) {
              return epilog
            } else if (_.isArray(epilog)) {
              const pop = epilog.pop()
              if (pop) {
                return pop
              }
            }

            return 'Find more information at https://semo.js.org'
          })(parsedArgv.setEpilog),
        )
      }

      if (!parsedArgv.setVersion) {
        yargs.hide('set-version').option('set-version', {
          describe: 'Set version.',
        })
      } else {
        yargs.version(parsedArgv.setVersion)
      }

      yargs.hide('node-env-key').option('node-env-key', {
        default: 'NODE_ENV',
        alias: 'node-env',
        describe: 'Set node env key',
      })

      const defaultCommand: any = {
        handler: () => {
          yargs.showHelp()
          warn('Semo command file is required.')
          warn('Semo default behavior is to execute a Semo style command file.')
        },
        builder: () => {},
      }

      if (
        process.argv[2] &&
        fs.existsSync(path.resolve(process.cwd(), process.argv[2]))
      ) {
        // if command exist but process.arg[2] also exist, but not a command js module
        // here will throw an exception, so ignore this error to make existed command can run
        try {
          let command =
            require(path.resolve(process.cwd(), process.argv[2])) || {}
          if (command.default) {
            command = command.default
          }

          if (command.handler) {
            defaultCommand.handler = command.handler
          } else if (typeof command === 'function') {
            defaultCommand.handler = command
          }
          if (command.builder) {
            defaultCommand.builder = command.builder
          }
        } catch (e) {}
      }

      if (parsedArgv._[0] !== 'completion' && !parsedArgv.disableCoreCommand) {
        yargs.command(
          '$0',
          'Execute a Semo command style file',
          defaultCommand.builder,
          defaultCommand.handler,
        )
      }

      if (!parsedArgv.disableCoreCommand) {
        yargs.command('version', 'Show version number', () => {
          console.log(pkg.version)
        })
      }

      // eslint-disable-next-line
      yargs
        .help()
        .alias('h', 'help')
        .alias('v', 'version')
        .exitProcess(false)
        .recommendCommands()
        .parserConfiguration({
          'sort-commands': true,
          'populate--': true,
        })
        .fail(false)
        // .onFinishCommand(async (hook) => {
        //   if (hook !== false) {
        //     console.log();
        //     if (
        //       !parsedArgv.getYargsCompletions &&
        //       parsedArgv.enableCoreHook &&
        //       parsedArgv.enableCoreHook.includes("after_command")
        //     ) {
        //       let afterHooks = await invokeHook<Function[]>(
        //         `${scriptName}:after_command`
        //       );
        //       Object.keys(afterHooks).map(function (hook) {
        //         afterHooks[hook](parsedArgv, yargs);
        //       });
        //       debugCore("Core hook after_command triggered");
        //     }
        //     process.exit(0);
        //   }
        // })
        .wrap(Math.min(120, yargs.terminalWidth())).argv

      // if (hook !== false) {
      //   console.log();
      //   if (
      //     !parsedArgv.getYargsCompletions &&
      //     parsedArgv.enableCoreHook &&
      //     parsedArgv.enableCoreHook.includes("after_command")
      //   ) {
      //     let afterHooks = await invokeHook<Function[]>(
      //       `${scriptName}:after_command`
      //     );
      //     Object.keys(afterHooks).map(function (hook) {
      //       afterHooks[hook](parsedArgv, yargs);
      //     });
      //     debugCore("Core hook after_command triggered");
      //   }
      //   process.exit(0);
      // }
      if (!parsedArgv.disableCoreCommand) {
        yargs.example([
          ['$0 run hello-world', 'Run a remote plugin command.'],
          [
            '$0 run --with project-templates — create PROJECT_NAME -T',
            'Clone project template as a starter.',
          ],
          [
            '$0 repl --require lodash:_',
            'Start Semo repl and inject lodash object to _.',
          ],
          ['$0 generate command test', 'Generate command template.'],
          ['$0 clean all', 'Clean all cache files and installed npm packages.'],
        ])
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
  const packageDirectory = path.dirname(packagePath)

  const pluginConfig = parseRcFile(name, packageDirectory, argv)
  pluginConfig.dirname = packageDirectory

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

  const pkgPath = require.resolve(name, {
    paths: [downloadDirNodeModulesPath],
  })
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
    exec(
      `npm install ${nameArray.join(
        ' ',
      )} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`,
    )
  }

  nameArray.forEach(pkg => {
    try {
      require.resolve(pkg, { paths: [downloadDir] })
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        exec(
          `npm install ${pkg} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`,
        )
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

  exec(
    `npm uninstall ${nameArray.join(
      ' ',
    )} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`,
  )
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
  let pkg!: string, pkgPath: string

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
    exec(
      `npm install ${name} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`,
    )
  }

  try {
    pkgPath = require.resolve(name, { paths: [downloadDir] })
    pkg = require(pkgPath)
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      exec(
        `npm install ${name} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`,
      )
      try {
        pkgPath = require.resolve(name, { paths: [downloadDir] })
        pkg = require(pkgPath)
      } catch (e) {
        warn(`Module ${name} not found, you may need to re-run the command`)
      }
    }
  }

  return pkg
}

/**
 * convert pakcage.json to private, for internal use
 * @param packageJsonPath package.json file path
 */
const convertToPrivate = packageJsonPath => {
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
      : _.get(argv.$config, key, defaultValue)
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
const isPromise = obj => {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  )
}

/**
 * Used for get deep value from a object or function or Promise
 *
 * @param func a Promise, a Function or a literal object
 * @param getPath a key path
 */
const run = async (func, getPath = '', ...args) => {
  let result
  if (isPromise(func)) {
    result = await func
  } else if (_.isFunction(func)) {
    result = await func()
  } else if (_.isArray(func) && _.isFunction(func[0])) {
    const newFunc = func[0]
    func.shift()
    result = await newFunc(...func)
  } else if (_.isObject(func)) {
    result = func
  } else {
    throw new Error('invalid func')
  }

  const that = result

  result = !getPath ? result : _.get(result, getPath)

  if (_.isFunction(result)) {
    // pass this obj to function/method call
    result = await result.call(that, ...args)
  }

  return result
}

/**
 * Attach config info in another file to argv config
 *
 * This is often for Application usage
 *
 * @param prefix
 * @param configPath
 */
const extendConfig = (
  extendRcPath: string[] | string,
  prefix: any = undefined,
) => {
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
        const extendRc = formatRcOptions(parsedRc)
        if (prefix) {
          const prefixPart = _.get(argv, prefix)
          const mergePart = _.merge(prefixPart, extendRc)
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
    const extendRcEnvPath = path.resolve(
      path.dirname(rcPath),
      `${path.basename(rcPath, '.yml')}.${nodeEnv}.yml`,
    )
    if (extendRcEnvPath && fileExistsSyncCache(extendRcEnvPath)) {
      try {
        const rcFile = fs.readFileSync(extendRcEnvPath, 'utf8')
        const parsedRc = yaml.parse(rcFile)
        const extendRc = formatRcOptions(parsedRc)
        if (prefix) {
          const prefixPart = _.get(argv, prefix)
          const mergePart = _.merge(prefixPart, extendRc)
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
 * Console Reader
 *
 * Mostly use less mode, if HOME can not be detected, it will fallback to console.log
 *
 * @param content The content to read
 * @param plugin Plugin name, used to make up cache path
 * @param identifier The content identifier, used to make up cache path
 */
const consoleReader = (
  content: string,
  opts: { plugin?: string; identifier?: string; tmpPathOnly?: boolean } = {},
) => {
  const argv: any = getInternalCache().get('argv')
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'

  opts.plugin = opts.plugin || scriptName
  opts.identifier = opts.identifier || Math.random() + ''

  if (process.env.HOME) {
    const tmpPath = path.resolve(
      process.env.HOME,
      `.${scriptName}/cache`,
      <string>opts.plugin,
      md5(opts.identifier),
    )
    fs.ensureDirSync(path.dirname(tmpPath))
    fs.writeFileSync(tmpPath, content)

    if (opts.tmpPathOnly) {
      return tmpPath
    }

    exec(`cat ${tmpPath} | less -r`)

    // Maybe the file already removed
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath)
    }
  } else {
    console.log(content)
  }

  return true
}

/**
 * Clear console
 */
const clearConsole = () => {
  process.stdout.isTTY &&
    process.stdout.write(
      process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H',
    )
}

const moveToTopConsole = () => {
  process.stdout.isTTY &&
    process.stdout.write(process.platform === 'win32' ? '\x1B[0f' : '\x1B[H')
}

const argParser = (argv: string) => {
  return yParser(argv)
}

export type COMMON_OBJECT = {
  [key: string]: any
}

/**
 * Semo utils functions and references to common modules.
 * @module Utils
 */
export const Utils = {
  // npm packages
  /** [lodash](https://www.npmjs.com/package/lodash) reference, check [doc](https://lodash.com/docs). */
  _,

  /** [picocolors](https://www.npmjs.com/package/picocolors) reference */
  color: pc,

  /** [yaml](https://www.npmjs.com/package/yaml) reference */
  yaml,

  /** [debug](https://www.npmjs.com/package/debug) reference */
  debug,

  /** [envinfo](https://www.npmjs.com/package/envinfo) reference */
  envinfo,

  /** [shelljs](https://www.npmjs.com/package/shelljs) reference */
  shell,

  /** [chalk](https://www.npmjs.com/package/chalk) reference */
  chalk,
  /** [dayjs](https://www.npmjs.com/package/dayjs) reference */
  day,

  /** [fs-extra](https://www.npmjs.com/package/fs-extra) reference */
  fs,

  yargs,

  // custom functions
  log,
  warn,
  info,
  success,
  error,
  Hook,
  splitByChar,
  splitComma,
  outputTable,
  invokeHook,
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
  delay,
  md5,
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
  consoleReader,
  clearConsole,
  useDotEnv,
}

export type UtilsType = typeof Utils
