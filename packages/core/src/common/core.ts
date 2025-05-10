import dotenv, { DotenvConfigOptions } from 'dotenv'
import { expand as dotenvExpand } from 'dotenv-expand'
import { findUpSync } from 'find-up'
import { ensureDirSync } from 'fs-extra'
import getStdin from 'get-stdin'
import { globSync } from 'glob'
import _ from 'lodash'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import shell from 'shelljs'
import yaml from 'yaml'
import yargs, {
  Argv,
  CommandBuilder,
  CommandModule,
  RequireDirectoryOptions,
} from 'yargs'
import yargsParser from 'yargs-parser'
import { hideBin } from 'yargs/helpers'
import { debugChannel, debugCore, debugCoreChannel } from './debug.js'
import { Hook } from './hook.js'
import {
  colorfulLog,
  colorize,
  error,
  info,
  jsonLog,
  log,
  LogOptions,
  success,
  warn,
} from './log.js'
import {
  checkbox,
  confirm,
  editor,
  expand,
  input,
  number,
  password,
  rawlist,
  search,
  select,
} from './prompts.js'
import {
  ApplicationConfig,
  ArgvOptions,
  ArgvWithPlugin,
  CombinedConfig,
  HookOption,
  HookReturn,
  InitOptions,
  PluginConfig,
} from './types.js'
import {
  formatRcOptions,
  getAbsolutePath,
  getPackagePath,
  isUsingTsRunner,
} from './utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

export interface ArgvExtraOptions extends ArgvOptions {
  // Most common
  $scriptName?: string
  $core?: Core
  $yargs?: Argv

  // From .semorc.yml
  $plugin?: {
    [key: string]: any
  }

  // For pipe
  $input?: string

  // If command has middulewares and plugin, this var will be filled.
  $config?: Record<string, any>
  $command?: CommandBuilder

  // For debug
  $debugCoreChannel?: (channel: string, ...rest: unknown[]) => void
  $debugCore?: (...rest: unknown[]) => void
  $debugChannel?: (channel: string, ...rest: unknown[]) => void

  // For log
  $error?: (message: string | unknown, opts: LogOptions) => void
  $warn?: (message: string | unknown, opts: LogOptions) => void
  $info?: (message: string | unknown, opts: LogOptions) => void
  $log?: (message: string | unknown, opts: LogOptions) => void
  $success?: (message: string | unknown, opts: LogOptions) => void
  $colorfulLog?: (
    color: string,
    message: string | unknown,
    opts: LogOptions
  ) => void
  $color?: (color: string, message: string) => string

  // For prompt
  $prompt?: {
    select: typeof select
    input: typeof input
    number: typeof number
    password: typeof password
    rawlist: typeof rawlist
    search: typeof search
    expand: typeof expand
    checkbox: typeof checkbox
    confirm: typeof confirm
    editor: typeof editor
  }
}

export class Core {
  version: string = ''
  scriptName: string = ''
  initOptions: InitOptions = {}
  parsedArgv: ArgvExtraOptions = {}
  allPlugins: Record<string, string> = {}
  combinedConfig: Record<string, any> = {}
  appConfig: Record<string, any> = {}
  input: string = '' // stdin

  debugCore: (...rest: unknown[]) => void
  debugCoreChannel: (channel: string, ...rest: unknown[]) => void
  debugChannel: (channel: string, ...rest: unknown[]) => void

  /**
   * Shortcut for checking if or not current env is production
   */
  isProduction = () => this.getNodeEnv() === 'production'
  /**
   * Shortcut for checking if or not current env is development
   */
  isDevelopment = () => this.getNodeEnv() === 'development'

  constructor(opts: InitOptions) {
    this.initOptions = opts
    this.setScriptName(opts.scriptName ?? 'semo')

    this.debugCore = debugCore(this.scriptName)
    this.debugCoreChannel = debugCoreChannel(this.scriptName)
    this.debugChannel = debugChannel(this.scriptName)
  }

  setVersion(version: string) {
    this.version = version
  }

  setScriptName(scriptName: string) {
    this.scriptName = scriptName
  }

  setParsedArgv(parsedArgv: ArgvExtraOptions) {
    this.parsedArgv = parsedArgv
  }

  /**
   * Use dotenv style
   * @param expand expand dotenv
   * @param options dotenv options
   */
  useDotEnv(expand: true, _options: DotenvConfigOptions = {}) {
    try {
      const myEnv = dotenv.config()
      if (expand && !myEnv.error) {
        dotenvExpand(myEnv)
      }
    } catch {
      // .env may not exist, it's not a serious bug
    }
  }

  /**
   * Get current argv config
   */
  config(
    key: string = '',
    defaultValue: unknown = undefined
  ): string | Record<string, unknown> {
    const argv = this.parsedArgv

    return key
      ? (_.get(argv, key, defaultValue) as string | Record<string, unknown>)
      : argv
  }

  parseRcFile(plugin: string, pluginPath: string): Record<string, unknown> {
    const pluginSemoYamlRcPath = path.resolve(
      pluginPath,
      `.${this.scriptName}rc.yml`
    )
    const pluginPackagePath = path.resolve(pluginPath, 'package.json')
    let pluginConfig: Record<string, unknown> = {}
    if (existsSync(pluginSemoYamlRcPath)) {
      try {
        const rcFileContent = readFileSync(pluginSemoYamlRcPath, 'utf8')
        pluginConfig = formatRcOptions(yaml.parse(rcFileContent))

        try {
          const packageConfigContent = readFileSync(pluginPackagePath, 'utf8')
          const packageConfig = JSON.parse(packageConfigContent)
          pluginConfig.version = packageConfig.version
        } catch {
          pluginConfig.version = '0.0.0'
        }
      } catch (e) {
        this.debugCore('load rc failed:', e)
        warn(`Plugin ${plugin} .semorc.yml config load failed!`)
        pluginConfig = {}
      }
    }

    return pluginConfig
  }

  getPluginConfig(
    key: string,
    defaultValue: any = undefined,
    plugin: string = ''
  ) {
    const argv = this.parsedArgv
    const $config = argv.$config || this.parsePluginConfig(plugin, argv)
    return !_.isNull(argv[key]) && !_.isUndefined(argv[key])
      ? argv[key]
      : !_.isEmpty($config)
        ? !_.isNull($config[key]) && !_.isUndefined($config[key])
          ? $config[key]
          : _.get($config, key, defaultValue)
        : defaultValue
  }

  /**
   * Get application semo config only.
   *
   * @param pluginConfigcwd
   * @param opts
   *   opts.scriptName: set scriptName
   */
  getApplicationConfig(opts?: ArgvOptions): ApplicationConfig {
    opts = opts || {}

    let applicationConfig: ApplicationConfig

    const configPath = findUpSync(`.${this.scriptName}rc.yml`, {
      cwd: opts.cwd,
    })

    const nodeEnv = this.getNodeEnv()
    const configEnvPath = findUpSync([`.${this.scriptName}rc.${nodeEnv}.yml`], {
      cwd: opts.cwd,
    })

    // Load home config if exists
    const homeSemoYamlRcPath = process.env.HOME
      ? path.resolve(
          process.env.HOME,
          `.${this.scriptName}`,
          `.${this.scriptName}rc.yml`
        )
      : ''
    if (homeSemoYamlRcPath && existsSync(homeSemoYamlRcPath)) {
      try {
        const rcFile = readFileSync(homeSemoYamlRcPath, 'utf8')
        applicationConfig = formatRcOptions<ApplicationConfig>(
          yaml.parse(rcFile)
        ) as ApplicationConfig
      } catch (e) {
        this.debugCore('load rc failed:', e)
        warn(`Global ${homeSemoYamlRcPath} config load failed!`)
        applicationConfig = {} as ApplicationConfig
      }
    } else {
      applicationConfig = {} as ApplicationConfig
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
      existsSync(path.resolve(applicationConfig.applicationDir, 'package.json'))
    ) {
      const packageInfoContent = readFileSync(
        path.resolve(applicationConfig.applicationDir, 'package.json'),
        'utf8'
      )
      const packageInfo = JSON.parse(packageInfoContent)

      if (packageInfo.name) {
        applicationConfig.name = packageInfo.name
      }

      if (packageInfo.version) {
        applicationConfig.version = packageInfo.version
      }

      // args > package
      if (packageInfo[this.scriptName]) {
        packageInfo[this.scriptName] = formatRcOptions(
          packageInfo[this.scriptName]
        )
        applicationConfig = Object.assign(
          {},
          applicationConfig,
          packageInfo[this.scriptName]
        )
      }
    }

    // Load current directory main rc config
    if (configPath) {
      let semoRcInfo = {}

      try {
        if (configPath.endsWith('.yml')) {
          const rcFile = readFileSync(configPath, 'utf8')
          semoRcInfo = formatRcOptions(yaml.parse(rcFile))
        } else {
          const semoRcInfoContent = readFileSync(configPath, 'utf8')
          semoRcInfo = JSON.parse(semoRcInfoContent)
          semoRcInfo = formatRcOptions(semoRcInfo)
        }
        applicationConfig = _.merge(applicationConfig, semoRcInfo)
      } catch (e) {
        this.debugCore('load rc failed:', e)
        warn('application rc config load failed!')
      }
    }

    // Load current directory env rc config
    if (configEnvPath) {
      let semoEnvRcInfo = {}

      try {
        if (configEnvPath.endsWith('.yml')) {
          const rcFile = readFileSync(configEnvPath, 'utf8')
          semoEnvRcInfo = formatRcOptions(yaml.parse(rcFile))
        } else {
          const semoEnvRcInfoContent = readFileSync(configEnvPath, 'utf8')
          semoEnvRcInfo = JSON.parse(semoEnvRcInfoContent)
          semoEnvRcInfo = formatRcOptions(semoEnvRcInfo)
        }
        applicationConfig = _.merge(applicationConfig, semoEnvRcInfo)
      } catch (e) {
        this.debugCore('load rc failed:', e)
        warn('application env rc config load failed!')
      }
    }

    return applicationConfig
  }

  /**
   * Get commbined config from whole environment.
   */
  getCombinedConfig(argv: ArgvOptions): CombinedConfig {
    let combinedConfig: CombinedConfig = {}
    const pluginConfigs: {
      [key: string]: PluginConfig
    } = {}

    if (_.isEmpty(combinedConfig)) {
      const plugins = this.getAllPluginsMapping(argv)
      Object.keys(plugins).forEach((plugin) => {
        const pluginConfig = this.parseRcFile(
          plugin,
          plugins[plugin]
        ) as PluginConfig

        const pluginConfigPick = _.pick(pluginConfig, [
          'commandDir',
          'extendDir',
          'hookDir',
          plugin,
        ])
        combinedConfig = _.merge(combinedConfig, pluginConfigPick)
        if (pluginConfig) {
          pluginConfigs[plugin] = pluginConfig
        }
      })

      const applicatonConfig = this.getApplicationConfig()
      combinedConfig = _.merge(combinedConfig, applicatonConfig)
      combinedConfig.pluginConfigs = pluginConfigs
    }

    return combinedConfig || {}
  }

  /**
   * convert pakcage.json to private, for internal use
   * @param packageJsonPath package.json file path
   */
  convertToPrivate(packageJsonPath: string) {
    try {
      const pkg = require(packageJsonPath)
      pkg.private = true
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2))
    } catch (e) {
      warn(e.message)
    }
  }

  installPackage(name: string, location = '', home = true, force = false) {
    const nameArray = _.castArray(name)
    const argv: any = this.parsedArgv
    const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'

    let downloadDir = home
      ? process.env.HOME + `/.${scriptName}`
      : process.cwd()
    downloadDir = location ? downloadDir + `/${location}` : downloadDir

    ensureDirSync(downloadDir)

    if (!existsSync(path.resolve(downloadDir, 'package.json'))) {
      shell.exec(`cd ${downloadDir} && npm init -y`)
      this.convertToPrivate(path.resolve(downloadDir, 'package.json'))
    }

    if (force) {
      shell.exec(
        `npm install ${nameArray.join(
          ' '
        )} --prefix ${downloadDir} --force --no-package-lock --no-audit --no-fund --no-bin-links`
      )
    }

    nameArray.forEach((pkg) => {
      try {
        require.resolve(pkg, { paths: [downloadDir] })
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
          shell.exec(
            `npm install ${pkg} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`
          )
        }
      }
    })
  }

  uninstallPackage(name: string, location = '', home = true) {
    const nameArray = _.castArray(name)
    const argv: any = this.parsedArgv
    const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'

    let downloadDir = home
      ? process.env.HOME + `/.${scriptName}`
      : process.cwd()
    downloadDir = location ? downloadDir + `/${location}` : downloadDir

    ensureDirSync(downloadDir)

    if (!existsSync(path.resolve(downloadDir, 'package.json'))) {
      shell.exec(`cd ${downloadDir} && npm init -y`)
      this.convertToPrivate(path.resolve(downloadDir, 'package.json'))
    }

    shell.exec(
      `npm uninstall ${nameArray.join(
        ' '
      )} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`
    )
  }

  parsePluginConfig(plugin: string, argv: ArgvExtraOptions = {}) {
    let $config = {}
    if (!plugin) {
      return $config
    }
    const pluginNameBase = plugin.startsWith(argv.scriptName + '-plugin-')
      ? plugin.substring((argv.scriptName + '-plugin-').length)
      : plugin
    if (argv.$plugin) {
      if (argv.$plugin[pluginNameBase]) {
        $config = formatRcOptions(argv.$plugin[pluginNameBase] || {})
      } else if (argv.$plugin[argv.scriptName + '-plugin-' + pluginNameBase]) {
        $config = formatRcOptions(
          argv.$plugin[argv.scriptName + '-plugin-' + pluginNameBase] || {}
        )
      }
    }
    return $config
  }

  visit = (command: any, _pathTofile: string, _filename: string) => {
    const middleware = async (argv: ArgvWithPlugin) => {
      if (!command.noblank) {
        // Insert a blank line to terminal
        console.log()
      }

      argv.$config = {}
      // Give command a plugin level config
      if (command.plugin) {
        argv.$config = this.parsePluginConfig(command.plugin, argv)
      }

      argv.$command = command
      this.setParsedArgv(argv)
    }
    if (command.middlewares && Array.isArray(command.middlewares)) {
      command.middlewares.unshift(middleware)
    }
    // else {
    //   command.middlewares = [middleware]
    // }

    // if (command.middleware) {
    //   command.middlewares.push(command.middleware)
    // }
    return !(command.disabled === true || command.disable === true)
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
  importPackage(name: string, location = '', home = true, force = false) {
    let pkg!: string, pkgPath: string

    const scriptName = this.scriptName

    let downloadDir = home
      ? process.env.HOME + `/.${scriptName}`
      : process.cwd()
    downloadDir = location ? downloadDir + `/${location}` : downloadDir
    const downloadDirNodeModulesPath = path.resolve(downloadDir, 'node_modules')

    ensureDirSync(downloadDir)
    ensureDirSync(downloadDirNodeModulesPath)

    if (!existsSync(path.resolve(downloadDir, 'package.json'))) {
      shell.exec(`cd ${downloadDir} && npm init -y`)
      this.convertToPrivate(path.resolve(downloadDir, 'package.json'))
    }

    if (force) {
      shell.exec(
        `npm install ${name} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`
      )
    }

    try {
      pkgPath = require.resolve(name, { paths: [downloadDir] })
      pkg = require(pkgPath)
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        shell.exec(
          `npm install ${name} --prefix ${downloadDir} --no-package-lock --no-audit --no-fund --no-bin-links`
        )
        try {
          pkgPath = require.resolve(name, { paths: [downloadDir] })
          pkg = require(pkgPath)
        } catch {
          warn(`Module ${name} not found, you may need to re-run the command`)
        }
      }
    }

    return pkg
  }

  /**
   * Load plugin rc config
   *
   * @param name Plugin name
   * @param location plugin installed directory name under ~/.semo
   * @param home if load from HOME directory
   */
  loadPluginRc(name, location = '', home = true) {
    const scriptName = this.scriptName

    const downloadDir = home
      ? process.env.HOME + `/.${scriptName}`
      : process.cwd()
    const downloadDirNodeModulesPath = path.resolve(downloadDir, location)

    ensureDirSync(downloadDir)
    ensureDirSync(downloadDirNodeModulesPath)

    const packagePath = getPackagePath(name, [downloadDirNodeModulesPath])
    const packageDirectory = path.dirname(packagePath)

    const pluginConfig = this.parseRcFile(name, packageDirectory)
    pluginConfig.dirname = packageDirectory

    return pluginConfig
  }

  resolvePackage(name: string, location: string = '', home = true) {
    const scriptName = this.scriptName
    const downloadDir = home
      ? process.env.HOME + `/.${scriptName}`
      : process.cwd()
    const downloadDirNodeModulesPath = path.resolve(downloadDir, location)

    ensureDirSync(downloadDir)
    ensureDirSync(downloadDirNodeModulesPath)

    const pkgPath = require.resolve(name, {
      paths: [downloadDirNodeModulesPath],
    })
    return pkgPath
  }

  /**
   * Load any package's package.json
   * @param {string} pkg package name
   * @param {array} paths search paths
   */
  loadPackageInfo(
    pkg: string | undefined = undefined,
    paths: string[] = []
  ): Record<string, unknown> {
    const packagePath = getPackagePath(pkg, paths)
    if (!packagePath) return {}
    const content = readFileSync(packagePath, 'utf-8')
    return JSON.parse(content)
  }

  loadCorePackageInfo(): Record<string, unknown> {
    const packagePath = findUpSync('package.json', {
      cwd: path.resolve('../../', __dirname),
    })
    if (!packagePath) return {}

    const content = readFileSync(packagePath, 'utf-8')
    return JSON.parse(content)
  }

  getAllPluginsMapping(argv?: ArgvOptions): Record<string, string> {
    let enablePluginAutoScan = true
    argv = argv || ({} as ArgvOptions)

    let plugins: Record<string, string> = {}
    const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'
    // Process $plugins.register
    if (_.isEmpty(plugins)) {
      const registerPlugins: Record<string, unknown> =
        (this.config('$plugins.register') as Record<string, unknown>) || {}
      if (!_.isEmpty(registerPlugins)) {
        enablePluginAutoScan = false
      }
      Object.keys(registerPlugins).forEach((plugin) => {
        let pluginPath = registerPlugins[plugin]
        if (
          !plugin.startsWith('.') &&
          plugin.indexOf(scriptName + '-plugin-') === -1
        ) {
          plugin = scriptName + '-plugin-' + plugin
        }

        if (_.isBoolean(pluginPath) && pluginPath) {
          try {
            const packagePath = getPackagePath(plugin, [process.cwd()])

            if (packagePath) {
              pluginPath = path.dirname(packagePath)
              if (_.isString(pluginPath)) {
                plugins[plugin] = pluginPath
              }
            }
          } catch (e: unknown) {
            warn(e)
          }
        } else if (
          _.isString(pluginPath) &&
          (pluginPath.startsWith('/') ||
            pluginPath.startsWith('.') ||
            pluginPath.startsWith('~'))
        ) {
          pluginPath = getAbsolutePath(pluginPath)
          if (_.isString(pluginPath)) {
            plugins[plugin] = pluginPath
          }
        } else {
          // Means not register for now
        }
      })
    }

    const pluginPrefix = (argv.pluginPrefix || 'semo') as string
    let pluginPrefixs: string[] = []
    if (_.isString(pluginPrefix)) {
      pluginPrefixs = [pluginPrefix]
    }

    if (!_.isArray(pluginPrefixs)) {
      error('invalid --plugin-prefix')
      return plugins
    }

    const topPluginPattern =
      pluginPrefixs.length > 1
        ? '{' +
          pluginPrefixs.map((prefix) => `${prefix}-plugin-*`).join(',') +
          '}'
        : pluginPrefixs.map((prefix) => `${prefix}-plugin-*`).join(',')
    const orgPluginPattern =
      pluginPrefixs.length > 1
        ? '{' +
          pluginPrefixs.map((prefix) => `@*/${prefix}-plugin-*`).join(',') +
          '}'
        : pluginPrefixs.map((prefix) => `@*/${prefix}-plugin-*`).join(',')

    // Scan plugins
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
        ;[topPluginPattern, orgPluginPattern].forEach((pattern) => {
          globSync(pattern, {
            noext: true,
            cwd: path.resolve(
              argv.packageDirectory,
              argv.orgMode ? '../../' : '../'
            ),
          }).forEach(function (plugin): void {
            if (argv.packageDirectory) {
              plugins[plugin] = path.resolve(
                argv.packageDirectory,
                argv.orgMode ? '../../' : '../',
                plugin
              )
            }
          })
        })

        // Only local dev needed: load sibling plugins in packageDirectory parent directory
        // Only for orgMode = true, if orgMode = false, the result would be same as above search
        if (argv.orgMode) {
          globSync(topPluginPattern, {
            noext: true,
            cwd: path.resolve(argv.packageDirectory, '../'),
          }).forEach(function (plugin): void {
            if (argv.packageDirectory) {
              plugins[plugin] = path.resolve(
                argv.packageDirectory,
                '../',
                plugin
              )
            }
          })
        }
      }

      if (process.env.HOME && !argv.disableHomePlugin) {
        // Semo home is a special directory
        if (
          existsSync(
            path.resolve(
              process.env.HOME,
              '.' + scriptName,
              `.${scriptName}rc.yml`
            )
          )
        ) {
          // So home plugin directory will not be overridden by other places normally.
          plugins['.' + scriptName] = path.resolve(
            process.env.HOME,
            '.' + scriptName
          )
        }

        // process home plugin-cache plugins
        ;[topPluginPattern, orgPluginPattern].forEach((pattern) => {
          globSync(pattern, {
            noext: true,
            cwd: path.resolve(
              process.env.HOME,
              `.${scriptName}`,
              'home-plugin-cache',
              'node_modules'
            ),
          }).forEach(function (plugin): void {
            if (process.env.HOME) {
              plugins[plugin] = path.resolve(
                process.env.HOME,
                `.${scriptName}`,
                'home-plugin-cache',
                'node_modules',
                plugin
              )
            }
          })
        })

        // process home npm plugins
        ;[topPluginPattern, orgPluginPattern].forEach((pattern) => {
          globSync(pattern, {
            noext: true,
            cwd: path.resolve(
              process.env.HOME,
              `.${scriptName}`,
              'node_modules'
            ),
          }).forEach(function (plugin): void {
            if (process.env.HOME) {
              plugins[plugin] = path.resolve(
                process.env.HOME,
                `.${scriptName}`,
                'node_modules',
                plugin
              )
            }
          })
        })
      }

      // process cwd(current directory) npm plugins
      ;[topPluginPattern, orgPluginPattern].forEach((pattern) => {
        globSync(pattern, {
          noext: true,
          cwd: path.resolve(process.cwd(), 'node_modules'),
        }).forEach(function (plugin) {
          plugins[plugin] = path.resolve(process.cwd(), 'node_modules', plugin)
        })
      })

      // process local plugins
      const config = this.getApplicationConfig()
      const pluginDirs = _.castArray(config.pluginDir) as string[]
      pluginDirs.forEach((pluginDir) => {
        if (existsSync(pluginDir)) {
          ;[topPluginPattern, orgPluginPattern].forEach((pattern) => {
            globSync(pattern, {
              noext: true,
              cwd: path.resolve(process.cwd(), pluginDir),
            }).forEach(function (plugin) {
              plugins[plugin] = path.resolve(process.cwd(), pluginDir, plugin)
            })
          })
        }
      })

      // Process plugin project
      // If project name contains `-plugin-`, then current directory should be plugin too.
      if (existsSync(path.resolve(process.cwd(), 'package.json'))) {
        const pkgConfigContent = readFileSync(
          path.resolve(process.cwd(), 'package.json'),
          'utf-8'
        )
        const pkgConfig = JSON.parse(pkgConfigContent)
        const matchPluginProject = pluginPrefixs
          .map((prefix) => `${prefix}-plugin-`)
          .join('|')
        const regExp = new RegExp(`^(@[^/]+\/)?(${matchPluginProject})`)
        if (pkgConfig.name && regExp.test(pkgConfig.name)) {
          plugins[pkgConfig.name] = path.resolve(process.cwd())
        }
      }
    }

    // extraPluginDir comes from CLI, so it's dynamic.
    const extraPluginDirEnvName = _.upperCase(scriptName) + '_PLUGIN_DIR'
    if (
      extraPluginDirEnvName &&
      process.env[extraPluginDirEnvName] &&
      existsSync(getAbsolutePath(process.env[extraPluginDirEnvName] as string))
    ) {
      const envDir = getAbsolutePath(String(process.env[extraPluginDirEnvName]))

      ;[topPluginPattern, orgPluginPattern].forEach((pattern) => {
        globSync(pattern, {
          noext: true,
          cwd: path.resolve(envDir),
        }).forEach(function (plugin) {
          plugins[plugin] = path.resolve(envDir, plugin)
        })
      })
    }

    // Second filter for registered or scanned plugins
    const includePlugins = (this.config('$plugins.include') || []) as string[]
    const excludePlugins = (this.config('$plugins.exclude') || []) as string[]

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

    return plugins
  }

  /**
   * Get current node env setting
   *
   * You can change the node-env-key in command args or semo rc file
   */
  getNodeEnv(argv?: Record<string, unknown>) {
    if (!argv) {
      return process.env.NODE_ENV || 'development'
    }
    const nodeEnvKey = (argv.nodeEnvKey || argv.nodeEnv || 'NODE_ENV') as string
    return process.env[nodeEnvKey] || 'development'
  }

  extendSubCommand(
    command: string,
    moduleName: string,
    yargs: any,
    basePath: string
  ): void {
    const plugins = this.allPlugins
    const config = this.combinedConfig
    const opts: RequireDirectoryOptions = {
      // try to use ts command with ts-node/register
      extensions: ['ts', 'js'],
      exclude: /.d.ts$/,
      // Give each command an ability to disable temporarily
      visit: this.visit.bind(this),
    }

    // load default commands
    const currentCommand: string | undefined = command.split('/').pop()
    if (currentCommand && existsSync(path.resolve(basePath, currentCommand))) {
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
            existsSync(
              path.resolve(
                plugins[plugin],
                `${config.pluginConfigs[plugin].extendDir}/${moduleName}/src/commands`,
                command
              )
            )
          ) {
            yargs.commandDir(
              path.resolve(
                plugins[plugin],
                `${config.pluginConfigs[plugin].extendDir}/${moduleName}/src/commands`,
                command
              ),
              opts
            )
          }
        }
      })
    }

    // Load application commands
    if (
      config.extendDir &&
      existsSync(
        path.resolve(
          process.cwd(),
          `${config.extendDir}/${moduleName}/src/commands`,
          command
        )
      )
    ) {
      yargs.commandDir(
        path.resolve(
          process.cwd(),
          `${config.extendDir}/${moduleName}/src/commands`,
          command
        ),
        opts
      )
    }
  }

  async launch(): Promise<void> {
    process.setMaxListeners(0)

    this.useDotEnv(true)
    this.input = await getStdin()

    this.debugCore('Parse process.argv using yargs-parser.')
    let parsedArgv = yargsParser(process.argv.slice(2)) as ArgvOptions
    parsedArgv = Object.assign(parsedArgv, this.initOptions)

    this.debugCore('Load core package information.')
    const pkg = this.loadCorePackageInfo()
    this.debugCore('Load application config.')
    let appConfig = this.getApplicationConfig(parsedArgv)
    appConfig = Object.assign(appConfig, {
      scriptName: this.initOptions.scriptName,
      packageName: this.initOptions.packageName,
      packageDirectory: this.initOptions.packageDirectory,
      orgMode: this.initOptions.orgMode, // Means my package publish under npm orgnization scope
      [`$${this.initOptions.scriptName || 'semo'}`]: {
        VERSION: pkg.version,
      },
      originalArgv: process.argv.slice(2),
    })

    this.appConfig = appConfig
    // compatible with both singular and plural
    parsedArgv = Object.assign(parsedArgv, appConfig)
    parsedArgv.disableCoreCommand =
      parsedArgv.disableCoreCommands ?? parsedArgv.disableCoreCommand
    parsedArgv.disableCompletionCommand =
      parsedArgv.disableCompletionCommands ??
      parsedArgv.disableCompletionCommand
    parsedArgv.disableCompletion =
      parsedArgv.disableCompletions ?? parsedArgv.disableCompletion
    parsedArgv.hideCompletionCommand =
      parsedArgv.hideCompletionCommands ?? parsedArgv.hideCompletionCommand
    parsedArgv.disableGlobalPlugin =
      parsedArgv.disableGlobalPlugins ?? parsedArgv.disableGlobalPlugin
    parsedArgv.disableHomePlugin =
      parsedArgv.disableHomePlugins ?? parsedArgv.disableHomePlugin
    this.setParsedArgv(parsedArgv)

    this.debugCore('Load all plugins information.')
    const allPlugins = this.getAllPluginsMapping(parsedArgv)
    this.debugCore('Load combined config.')
    const combinedConfig = this.getCombinedConfig(parsedArgv)

    this.allPlugins = allPlugins
    this.combinedConfig = combinedConfig

    this.debugCore('Initialize Yargs instance.')
    const yargsObj = yargs(hideBin(process.argv))
    yargsObj
      .help()
      .alias('h', 'help')
      .alias('v', 'version')
      .option('verbose', {
        type: 'boolean',
        default: false,
        describe: 'Enable verbose logging',
      })
      .exitProcess(false)
      .recommendCommands()
      .parserConfiguration({
        'sort-commands': true,
        'populate--': true,
      })
      // .fail(false)
      .fail((msg, err) => {
        if (msg) {
          error(msg)
        }
        if (parsedArgv.verbose) {
          error(err)
        }
        process.exit(1)
      })
      .wrap(Math.min(120, yargsObj.terminalWidth()))

    this.setVersion(pkg.version as string)
    yargsObj.version(pkg.version as string)
    yargsObj.config(appConfig)

    this.debugCore('Register global middleware.')
    // add more internal values to argv using middleware
    yargsObj.middleware(async (argv) => {
      // For command use this instance
      argv.$core = this
      argv.$yargs = yargsObj

      // For piping input
      argv.$input = this.input

      // For logging
      argv.$log = log
      argv.$info = info
      argv.$error = error
      argv.$warn = warn
      argv.$success = success
      argv.$jsonLog = jsonLog
      argv.$colorfulLog = colorfulLog
      argv.$colorize = colorize

      // For debugging
      argv.$debugCore = this.debugCore
      argv.$debugCoreChannel = this.debugCoreChannel
      argv.$debugChannel = this.debugChannel

      // For prmopts
      argv.$prompt = {
        confirm,
        checkbox,
        expand,
        input,
        password,
        rawlist,
        select,
        search,
        editor,
        number,
      }

      this.setParsedArgv(argv)
    })

    this.debugCore('Customize using argv options')
    yargsObj.scriptName(parsedArgv.scriptName)
    yargsObj.hide('plugin-prefix').option('plugin-prefix', {
      default: 'semo',
      describe: 'Set plugin prefix.',
    })

    yargsObj.hide('enable-core-hook').option('enable-core-hook', {
      default: [],
      describe: 'Enable core default disabled hook',
    })

    if (
      !parsedArgv.getYargsCompletions &&
      parsedArgv.enableCoreHook &&
      parsedArgv.enableCoreHook.includes('before_command')
    ) {
      this.debugCore('Core hook before_command triggered')
      const beforeHooks = (await this.invokeHook(
        `${parsedArgv.scriptName}:before_command`
      )) as Record<string, (argv: ArgvWithPlugin, yargs: Argv) => void>
      Object.keys(beforeHooks).forEach(function (hook) {
        beforeHooks[hook](parsedArgv, yargsObj)
      })
    }

    if (!parsedArgv.disableCoreCommand && !parsedArgv.disableCore) {
      yargsObj.hide('disable-core-command').option('disable-core-command', {
        alias: 'disable-core',
        describe: 'Disable core commands.',
      })

      if (
        !parsedArgv.disableCompletionCommand &&
        !parsedArgv.disableCompletion
      ) {
        yargsObj
          .hide('disable-completion-command')
          .option('disable-completion-command', {
            alias: 'disable-completion',
            describe: 'Disable completion command.',
          })

        if (!parsedArgv.hideCompletionCommand && !parsedArgv.hideCompletion) {
          yargsObj
            .hide('hide-completion-command')
            .option('hide-completion-command', {
              alias: 'hide-completion',
              describe: 'Hide completion command.',
            })
          yargsObj.completion('completion', 'Generate completion script')
        } else {
          yargsObj.completion('completion', false)
        }
      }
    }

    if (!parsedArgv.disableGlobalPlugin && !parsedArgv.disableGlobalPlugins) {
      yargsObj.hide('disable-global-plugin').option('disable-global-plugin', {
        alias: 'disable-global-plugins',
        describe: 'Disable global plugins.',
      })
    }

    if (!parsedArgv.disableHomePlugin && !parsedArgv.disableHomePlugins) {
      yargsObj.hide('disable-home-plugin').option('disable-home-plugin', {
        alias: 'disable-home-plugins',
        describe: 'Disable home plugins.',
      })
    }

    if (!parsedArgv.hideEpilog && !parsedArgv.disableCoreCommand) {
      yargsObj.hide('hide-epilog').option('hide-epilog', {
        describe: 'Hide epilog.',
      })
      yargsObj.hide('set-epilog').option('set-epilog', {
        default: false,
        describe: 'Set epilog.',
      })

      yargsObj.epilog(
        ((epilog: string | string[] | undefined): string => {
          if (epilog && _.isString(epilog)) {
            return epilog
          } else if (_.isArray(epilog)) {
            const pop = epilog.pop()
            if (pop) {
              return pop
            }
          }

          return 'Find more information at https://semo.js.org'
        })(parsedArgv.setEpilog)
      )
    }

    if (!parsedArgv.setVersion) {
      yargsObj.hide('set-version').option('set-version', {
        describe: 'Set version.',
      })
    } else {
      yargsObj.version(parsedArgv.setVersion)
    }

    yargsObj.hide('node-env-key').option('node-env-key', {
      default: 'NODE_ENV',
      alias: 'node-env',
      describe: 'Set node env key',
    })

    this.debugCore('Load commands by commandDir')
    const yargsOpts: RequireDirectoryOptions = {
      // try to use ts command with ts-node/register
      extensions: isUsingTsRunner() ? ['ts', 'js'] : ['js'],
      exclude: /.d.ts$/,
      // Give each command an ability to disable temporarily
      visit: this.visit,
    }

    if (
      !parsedArgv.disableCoreCommand &&
      this.initOptions.packageDirectory &&
      pkg.name !== parsedArgv.scriptName
    ) {
      // Load core commands
      this.debugCore('Load core commands')
      yargsObj.commandDir(
        path.resolve(
          this.initOptions.packageDirectory,
          appConfig.coreCommandDir
        ),
        yargsOpts
      )
    }

    // Load plugin commands
    if (allPlugins) {
      this.debugCore('Load plugins commands')
      Object.keys(allPlugins).forEach(function (plugin) {
        if (
          combinedConfig.pluginConfigs &&
          combinedConfig.pluginConfigs[plugin] &&
          combinedConfig.pluginConfigs[plugin].commandDir &&
          existsSync(
            path.resolve(
              allPlugins[plugin],
              combinedConfig.pluginConfigs[plugin].commandDir
            )
          )
        ) {
          yargsObj.commandDir(
            path.resolve(
              allPlugins[plugin],
              combinedConfig.pluginConfigs[plugin].commandDir
            ),
            yargsOpts
          )
        }
      })
    }

    // Load application commands
    if (
      appConfig.commandDir &&
      existsSync(path.resolve(process.cwd(), appConfig.commandDir))
    ) {
      this.debugCore('Load application commands')
      yargsObj.commandDir(
        path.resolve(process.cwd(), appConfig.commandDir),
        yargsOpts
      )
    }

    this.debugCore('Add default command')
    const defaultCommand: CommandModule<{}, {}> = {
      handler: () => {
        yargsObj.showHelp()
        warn('Semo command file is required.')
        warn('Semo default behavior is to execute a Semo style command file.')
      },
      builder: undefined,
    }

    if (
      process.argv[2] &&
      existsSync(path.resolve(process.cwd(), process.argv[2]))
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
      } catch (e) {
        if (this.parsedArgv.verbose) {
          error(e)
        }
      }
    }

    if (
      parsedArgv._ &&
      parsedArgv._[0] !== 'completion' &&
      !parsedArgv.disableCoreCommand
    ) {
      yargsObj.command({
        command: '$0',
        describe: 'Execute a Semo command style file',
        builder: defaultCommand.builder ?? {},
        handler: defaultCommand.handler,
      })
    }

    this.debugCore('Add version command')
    if (!parsedArgv.disableCoreCommand) {
      yargsObj.command('version', 'Show version number', () => {
        log(pkg.version)
      })
    }

    this.debugCore('Add example command')
    if (!parsedArgv.disableCoreCommand) {
      yargsObj.example([
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

    this.debugCore('Parse and launch')
    try {
      await yargsObj.parseAsync()
      this.debugCore('Launch complete')
    } catch (e) {
      if (parsedArgv.verbose) {
        console.error(e)
      } else {
        return error(e.message)
      }
    }
  }

  async invokeHook(
    hook: string,
    options: HookOption = { mode: 'assign' },
    opts: ArgvOptions = {}
  ): Promise<HookReturn> {
    this.debugCore(`Invoke hook ${hook}`)
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

    const argv = Object.assign(opts, this.parsedArgv)
    const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'
    hook = !hook.startsWith('hook_') ? `hook_${hook}` : hook
    options = Object.assign(
      {
        mode: 'assign',
        useCache: false,
        include: [],
        exclude: [],
        opts: {},
      },
      options
    )
    try {
      // Make Application supporting hook invocation
      const appConfig = this.appConfig
      const combinedConfig = this.combinedConfig
      // Make Semo core supporting hook invocation
      const plugins = argv.packageDirectory
        ? Object.assign(
            {},
            {
              [scriptName]: path.resolve(argv.packageDirectory),
            },
            this.allPlugins
          )
        : this.allPlugins

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

      let pluginsReturn: HookReturn
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
      const hookCollected: unknown[] = []
      const hookIndex: unknown[] = []
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
          let pluginEntryPath: string // resolve plugin hook entry file path
          let hookDir: string = '' // resolve plugin hook dir

          switch (plugin) {
            case scriptName:
              const coreRcInfo = this.parseRcFile(plugin, plugins[plugin])
              hookDir = (
                coreRcInfo && coreRcInfo.hookDir ? coreRcInfo.hookDir : ''
              ) as string
              break

            case 'application':
              if (combinedConfig.hookDir) {
                hookDir = combinedConfig.hookDir as string
              }
              break

            default:
              if (
                combinedConfig.pluginConfigs &&
                combinedConfig.pluginConfigs[plugin]
              ) {
                hookDir = combinedConfig.pluginConfigs[plugin].hookDir
              }
              break
          }

          let entryFileName = 'index.js'
          if (
            hookDir &&
            existsSync(path.resolve(plugins[plugin], hookDir, entryFileName))
          ) {
            pluginEntryPath = path.resolve(
              plugins[plugin],
              hookDir,
              entryFileName
            )
          }

          if (!pluginEntryPath && isUsingTsRunner()) {
            if (
              hookDir &&
              existsSync(path.resolve(plugins[plugin], hookDir, 'index.ts'))
            ) {
              pluginEntryPath = path.resolve(
                plugins[plugin],
                hookDir,
                entryFileName
              )
              entryFileName = 'index.ts'
            }
          }

          // pluginEntryPath resolve failed, means this plugin do not hook anything
          if (!pluginEntryPath) {
            continue
          }

          let loadedPlugin = await import(pluginEntryPath)
          if (_.isFunction(loadedPlugin)) {
            loadedPlugin = await loadedPlugin(this, argv)
          } else if (_.isFunction(loadedPlugin.default)) {
            loadedPlugin = await loadedPlugin.default(this, argv)
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
              hookCollected.push(loadedPluginHook(this, argv, options))
            } else {
              hookCollected.push(loadedPluginHook)
            }
            hookIndex.push(plugin)
          }
        } catch (e) {
          console.log(e)
        }
      }

      const hookResolved: unknown[] = await Promise.all(hookCollected)
      hookResolved.forEach((pluginReturn, index) => {
        switch (options.mode) {
          case 'group':
            pluginReturn = pluginReturn || {}
            const plugin = hookIndex[index] as string
            ;(pluginsReturn as Record<string, unknown>)[plugin] = pluginReturn
            break
          case 'push':
            ;(pluginsReturn as unknown[]).push(pluginReturn)
            break
          case 'replace':
            pluginsReturn = pluginReturn as HookReturn
            break
          case 'merge':
            pluginReturn = pluginReturn || {}
            pluginsReturn = _.merge(pluginsReturn, pluginReturn)
            break
          case 'assign':
          default:
            pluginReturn = (pluginReturn || {}) as HookReturn
            pluginsReturn = Object.assign(
              pluginsReturn as Record<string, unknown>,
              pluginReturn
            )
            break
        }
      })

      return pluginsReturn
    } catch (e) {
      // throw new Error(e.stack)

      console.log(e.message)
    }
    return undefined
  }

  extendConfig(extendRcPath: string[] | string, prefix: string) {
    let argv = this.parsedArgv

    const extendRcPathArray = _.castArray(extendRcPath)

    extendRcPathArray.forEach((rcPath) => {
      rcPath = path.resolve(process.cwd(), rcPath)
      if (rcPath && existsSync(rcPath)) {
        try {
          const rcFile = readFileSync(rcPath, 'utf8')
          const parsedRc = yaml.parse(rcFile)
          const extendRc = formatRcOptions(parsedRc)
          if (prefix) {
            const prefixPart = _.get(argv, prefix)
            const mergePart = _.merge(prefixPart, extendRc)
            argv = _.set(argv, prefix, mergePart)
          } else {
            argv = _.merge(argv, extendRc)
          }
        } catch (e) {
          this.debugCore('load rc:', e)
          warn(`Global ${rcPath} config load failed!`)
        }
      }

      const nodeEnv = this.getNodeEnv(argv)
      const extendRcEnvPath = path.resolve(
        path.dirname(rcPath),
        `${path.basename(rcPath, '.yml')}.${nodeEnv}.yml`
      )
      if (extendRcEnvPath && existsSync(extendRcEnvPath)) {
        try {
          const rcFile = readFileSync(extendRcEnvPath, 'utf8')
          const parsedRc = yaml.parse(rcFile)
          const extendRc = formatRcOptions(parsedRc)
          if (prefix) {
            const prefixPart = _.get(argv, prefix)
            const mergePart = _.merge(prefixPart, extendRc)
            argv = _.set(argv, prefix, mergePart)
          } else {
            argv = _.merge(argv, extendRc)
          }
        } catch (e) {
          this.debugCore('load rc:', e)
          warn(`Global ${extendRcEnvPath} config load failed!`)
        }
      }
    })

    return argv
  }
}
