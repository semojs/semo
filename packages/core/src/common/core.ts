import { EventEmitter } from 'node:events'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yargs, {
  Argv,
  CommandBuilder,
  CommandModule,
  RequireDirectoryOptions,
} from 'yargs'
import yargsParser from 'yargs-parser'
import { hideBin } from 'yargs/helpers'
import { debugChannel, debugCore, debugCoreChannel } from './debug.js'
import { Hook, setHookScriptName } from './hook.js'
import {
  colorfulLog,
  colorize,
  error,
  fatal,
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
  HookHandler,
  HookInvocationResult,
  HookOption,
  InitOptions,
  PluginConfig,
} from './types.js'
import { deepGet, deepMerge, isUsingTsRunner } from './utils.js'

// Extracted modules (composition)
import * as ConfigManager from './config-manager.js'
import * as PluginCache from './plugin-cache.js'
import * as PluginLoader from './plugin-loader.js'
import * as PackageManager from './package-manager.js'
import * as CommandLoader from './command-loader.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface ArgvExtraOptions extends ArgvOptions {
  // Most common
  $scriptName?: string
  $core?: Core
  $yargs?: Argv

  // From .semorc.yml — plugin-specific config sections
  $plugin?: {
    [key: string]: PluginConfig
  }

  // For pipe
  $input?: string

  // If command has middlewares and plugin, this var will be filled.
  $config?: Record<string, unknown>
  $command?: CommandBuilder

  // For debug
  $debugCoreChannel?: (channel: string, ...rest: unknown[]) => void
  $debugCore?: (...rest: unknown[]) => void
  $debugChannel?: (channel: string, ...rest: unknown[]) => void

  // For log
  $error?: (message: string | unknown, opts: LogOptions) => void
  $fatal?: (message: string | unknown, exitCode?: number) => never
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
  private static instance: Core | null = null

  public version: string = ''
  public scriptName: string = ''
  public initOptions: InitOptions = {}
  public parsedArgv: ArgvExtraOptions = {}
  public allPlugins: Record<string, string> = {}
  public combinedConfig: CombinedConfig = {}
  public appConfig: ApplicationConfig = {} as ApplicationConfig
  public input: string = '' // stdin
  _cachedAppConfig: ApplicationConfig | null = null
  _rcFileCache: Map<string, Record<string, unknown>> = new Map()
  private _initialized: boolean = false
  private _corePackageInfo: Record<string, unknown> = {}
  private _dynamicHooks: Map<
    string,
    Array<{ pluginName: string; handler: HookHandler; targetModule: string }>
  > = new Map()
  private _emitter: EventEmitter = new EventEmitter()

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
    if (Core.instance) {
      if (opts.scriptName && opts.scriptName !== Core.instance.scriptName) {
        warn(
          `Core instance already exists with scriptName "${Core.instance.scriptName}", ignoring new opts with scriptName "${opts.scriptName}"`
        )
      }
      return Core.instance
    }

    this.initOptions = opts
    this.setScriptName(opts.scriptName ?? 'semo')

    this.debugCore = debugCore(this.scriptName)
    this.debugCoreChannel = debugCoreChannel(this.scriptName)
    this.debugChannel = debugChannel(this.scriptName)

    Core.instance = this
  }

  public static getInstance(): Core {
    if (!Core.instance) {
      throw new Error(
        'Core has not been initialized. Please create an instance first.'
      )
    }
    return Core.instance
  }

  public static setInstance(instance: Core) {
    Core.instance = instance
  }

  setVersion(version: string) {
    this.version = version
  }

  setScriptName(scriptName: string) {
    this.scriptName = scriptName
    setHookScriptName(scriptName)
  }

  setParsedArgv(parsedArgv: ArgvExtraOptions) {
    this.parsedArgv = parsedArgv
  }

  // --- dotenv (lazy-loaded) ---

  async useDotEnv(doExpand: boolean = true) {
    try {
      const dotenv = await import('dotenv')
      const myEnv = dotenv.config()
      if (doExpand && !myEnv.error) {
        const { expand } = await import('dotenv-expand')
        expand(myEnv)
      }
    } catch {
      // .env may not exist, it's not a serious bug
    }
  }

  // --- Config management (delegated to config-manager.ts) ---

  config<T = string | Record<string, unknown>>(
    key: string = '',
    defaultValue?: T
  ): T {
    const argv = this.parsedArgv
    return (key ? deepGet(argv, key, defaultValue) : argv) as T
  }

  parseRcFile(plugin: string, pluginPath: string): Record<string, unknown> {
    return ConfigManager.parseRcFile(this, plugin, pluginPath)
  }

  getPluginConfig<T = unknown>(
    key: string,
    defaultValue: T = undefined as T,
    plugin: string = ''
  ): T {
    const argv = this.parsedArgv
    const $config = plugin ? this.parsePluginConfig(plugin, argv) : argv.$config
    const result =
      argv[key] != null
        ? argv[key]
        : $config && Object.keys($config).length > 0
          ? $config[key] != null
            ? $config[key]
            : deepGet($config, key, defaultValue)
          : defaultValue
    return result as T
  }

  getApplicationConfig(opts?: ArgvOptions): ApplicationConfig {
    return ConfigManager.getApplicationConfig(this, opts)
  }

  async getCombinedConfig(argv: ArgvOptions): Promise<CombinedConfig> {
    return ConfigManager.getCombinedConfig(this, argv)
  }

  parsePluginConfig(plugin: string, argv: ArgvExtraOptions = {}) {
    return ConfigManager.parsePluginConfig(argv, plugin)
  }

  getNodeEnv(argv?: Record<string, unknown>) {
    return ConfigManager.getNodeEnv(argv)
  }

  extendConfig(extendRcPath: string[] | string, prefix: string) {
    return ConfigManager.extendConfigFromRc(
      this,
      this.parsedArgv,
      extendRcPath,
      prefix
    )
  }

  // --- Event emitter ---

  // EventEmitter listeners must accept `any[]` to match Node.js EventEmitter signature
  on(event: string, listener: (...args: any[]) => void): this {
    this._emitter.on(event, listener)
    return this
  }

  once(event: string, listener: (...args: any[]) => void): this {
    this._emitter.once(event, listener)
    return this
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this._emitter.off(event, listener)
    return this
  }

  emit(event: string, ...args: any[]): boolean {
    return this._emitter.emit(event, ...args)
  }

  // --- Dynamic hook registration ---

  addHook(
    hookName: string,
    handler: HookHandler,
    pluginName: string = 'dynamic'
  ): void {
    const parsed = this._parseHookName(hookName)
    const normalizedName = parsed.hook
    const targetModule = parsed.originModuler
    if (!this._dynamicHooks.has(normalizedName)) {
      this._dynamicHooks.set(normalizedName, [])
    }
    this._dynamicHooks
      .get(normalizedName)!
      .push({ pluginName, handler, targetModule })
  }

  removeHook(hookName: string, pluginName?: string): void {
    const parsed = this._parseHookName(hookName)
    const normalizedName = parsed.hook
    const targetModule = parsed.originModuler

    if (!pluginName && !targetModule) {
      // removeHook('query') → delete all handlers for hook_query
      this._dynamicHooks.delete(normalizedName)
      return
    }

    const handlers = this._dynamicHooks.get(normalizedName)
    if (handlers) {
      const filtered = handlers.filter((h) => {
        if (pluginName && targetModule) {
          // removeHook('ns:query', 'plugin-a') → both must match
          return !(
            h.pluginName === pluginName && h.targetModule === targetModule
          )
        }
        if (pluginName) {
          // removeHook('query', 'plugin-a') → filter by pluginName
          return h.pluginName !== pluginName
        }
        // removeHook('ns:query') → filter by targetModule
        return h.targetModule !== targetModule
      })
      if (filtered.length === 0) {
        this._dynamicHooks.delete(normalizedName)
      } else {
        this._dynamicHooks.set(normalizedName, filtered)
      }
    }
  }

  // --- Package management (delegated to package-manager.ts) ---

  convertToPrivate(packageJsonPath: string) {
    PackageManager.convertToPrivate(packageJsonPath)
  }

  async installPackage(
    name: string,
    location = '',
    home = true,
    force = false
  ) {
    return PackageManager.installPackage(this, name, location, home, force)
  }

  async uninstallPackage(name: string, location = '', home = true) {
    return PackageManager.uninstallPackage(this, name, location, home)
  }

  async importPackage(name: string, location = '', home = true, force = false) {
    return PackageManager.importPackage(this, name, location, home, force)
  }

  loadPluginRc(name: string, location = '', home = true) {
    return PackageManager.loadPluginRc(this, name, location, home)
  }

  resolvePackage(name: string, location: string = '', home = true) {
    return PackageManager.resolvePackage(this.scriptName, name, location, home)
  }

  loadPackageInfo(
    pkg: string | undefined = undefined,
    paths: string[] = []
  ): Record<string, unknown> {
    return PackageManager.loadPackageInfo(pkg, paths)
  }

  loadCorePackageInfo(): Record<string, unknown> {
    return PackageManager.loadCorePackageInfo(__dirname)
  }

  // --- Plugin loading (delegated to plugin-loader.ts) ---

  async getAllPluginsMapping(
    argv?: ArgvOptions
  ): Promise<Record<string, string>> {
    return PluginLoader.getAllPluginsMapping(this, __dirname, argv)
  }

  clearPluginCache(): void {
    PluginLoader.clearPluginCache(this.scriptName)
  }

  getManifestPaths(): { local: string; global: string } {
    return {
      local: PluginCache.getLocalManifestPath(),
      global: PluginCache.getGlobalManifestPath(this.scriptName),
    }
  }

  async generateManifest(opts?: {
    global?: boolean
    local?: boolean
  }): Promise<Record<string, string>> {
    const argv: ArgvOptions = { ...this.parsedArgv, noCache: true }
    if (opts?.local) {
      argv.disableGlobalPlugin = true
      argv.disableHomePlugin = true
    }
    const plugins = await PluginLoader.getAllPluginsMapping(
      this,
      path.dirname(fileURLToPath(import.meta.url)),
      argv
    )
    if (opts?.global) {
      PluginCache.savePluginManifest(this.scriptName, this.version, plugins)
    } else {
      PluginCache.saveLocalPluginManifest(
        this.scriptName,
        this.version,
        plugins
      )
    }
    return plugins
  }

  clearLocalPluginCache(): void {
    PluginCache.clearLocalPluginManifest()
  }

  // --- Command loading (delegated to command-loader.ts) ---

  visit = CommandLoader.createVisitor(this)

  extendSubCommand(
    command: string,
    moduleName: string,
    // Must remain `any`: Yargs instance type varies across versions and configurations
    yargs: any,
    basePath: string
  ): void {
    CommandLoader.extendSubCommand(this, command, moduleName, yargs, basePath)
  }

  // --- Init (SDK mode) ---

  get initialized(): boolean {
    return this._initialized
  }

  async init(): Promise<void> {
    if (this._initialized) return
    this.emit('init:start')
    await this.setupEnvironment()
    this.emit('init:env')
    await this.loadConfiguration()
    this.emit('init:config')
    this._initialized = true
    await this.invokeHook(`${this.scriptName}:plugin_ready`, { mode: 'assign' })
    this.emit('init:done')
  }

  async destroy(): Promise<void> {
    if (!this._initialized) return
    this.emit('destroy:start')
    await this.invokeHook(`${this.scriptName}:plugin_destroy`, {
      mode: 'assign',
    })
    this._initialized = false
    this._dynamicHooks.clear()
    this.emit('destroy:done')
  }

  private async setupEnvironment(): Promise<void> {
    process.setMaxListeners(20)

    if (!this.initOptions.skipDotEnv) {
      await this.useDotEnv(true)
    }

    // Only read stdin when piped (non-TTY), avoid blocking in interactive mode
    if (this.initOptions.skipStdin) {
      this.input = ''
    } else if (!process.stdin.isTTY) {
      const chunks: Buffer[] = []
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer)
      }
      this.input = Buffer.concat(chunks).toString('utf8')
    } else {
      this.input = ''
    }
  }

  private async loadConfiguration(): Promise<void> {
    this.debugCore('Parse process.argv using yargs-parser.')
    const rawArgv = this.initOptions.argv ?? process.argv.slice(2)
    let parsedArgv = yargsParser(rawArgv) as ArgvOptions
    parsedArgv = Object.assign(parsedArgv, this.initOptions)

    this.debugCore('Load core package information.')
    const pkg = this.loadCorePackageInfo()
    this._corePackageInfo = pkg

    this.debugCore('Load application config.')
    let appConfig = this.getApplicationConfig(parsedArgv)
    appConfig = Object.assign(appConfig, {
      scriptName: this.initOptions.scriptName,
      packageName: this.initOptions.packageName,
      packageDirectory: this.initOptions.packageDirectory,
      orgMode: this.initOptions.orgMode,
      [`$${this.initOptions.scriptName || 'semo'}`]: {
        VERSION: pkg.version,
      },
      originalArgv: rawArgv,
    })

    this.appConfig = appConfig
    parsedArgv = Object.assign(parsedArgv, appConfig)
    this.setParsedArgv(parsedArgv)
    this.setVersion(pkg.version as string)

    this.debugCore('Load all plugins information.')
    this.allPlugins = await this.getAllPluginsMapping(parsedArgv)
    this.debugCore('Load combined config.')
    this.combinedConfig = await this.getCombinedConfig(parsedArgv)
  }

  // --- Launch ---

  async launch(): Promise<void> {
    await this.init()
    const yargsObj = this.createYargsInstance()
    this.setupMiddleware(yargsObj)
    await this.configureYargsOptions(yargsObj)
    await this.loadCommands(yargsObj)
    await this.execute(yargsObj)
  }

  private createYargsInstance(): Argv {
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
      .fail((msg, err) => {
        if (msg) {
          error(msg)
        }
        if (this.parsedArgv.verbose) {
          error(err)
        }
        process.exit(1)
      })
      .wrap(Math.min(120, yargsObj.terminalWidth()))

    yargsObj.version(this.version)
    yargsObj.config(this.appConfig)

    return yargsObj
  }

  private setupMiddleware(yargsObj: Argv): void {
    this.debugCore('Register global middleware.')
    yargsObj.middleware(async (argv) => {
      argv.$core = this
      argv.$yargs = yargsObj

      argv.$input = this.input

      argv.$log = log
      argv.$info = info
      argv.$error = error
      argv.$fatal = fatal
      argv.$warn = warn
      argv.$success = success
      argv.$jsonLog = jsonLog
      argv.$colorfulLog = colorfulLog
      argv.$colorize = colorize

      argv.$debugCore = this.debugCore
      argv.$debugCoreChannel = this.debugCoreChannel
      argv.$debugChannel = this.debugChannel

      // For prompts (each function lazy-loads @inquirer/prompts on first call)
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
  }

  private async configureYargsOptions(yargsObj: Argv): Promise<void> {
    const parsedArgv = this.parsedArgv

    this.debugCore('Customize using argv options')
    yargsObj.scriptName(parsedArgv.scriptName)
    yargsObj.hide('plugin-prefix').option('plugin-prefix', {
      default: 'semo',
      describe: 'Set plugin prefix.',
    })

    yargsObj.hide('no-cache').option('no-cache', {
      type: 'boolean',
      default: false,
      describe: 'Disable plugin manifest cache.',
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
      for (const handler of Object.values(beforeHooks)) {
        handler(parsedArgv, yargsObj)
      }
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

    if (!parsedArgv.disableGlobalPlugin) {
      yargsObj.hide('disable-global-plugin').option('disable-global-plugin', {
        describe: 'Disable global plugins.',
      })
    }

    if (!parsedArgv.disableHomePlugin) {
      yargsObj.hide('disable-home-plugin').option('disable-home-plugin', {
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
          if (epilog && typeof epilog === 'string') {
            return epilog
          } else if (Array.isArray(epilog)) {
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
  }

  private async loadCommands(yargsObj: Argv): Promise<void> {
    const parsedArgv = this.parsedArgv
    const appConfig = this.appConfig
    const pkg = this._corePackageInfo

    this.debugCore('Load commands by commandDir')
    const yargsOpts: RequireDirectoryOptions = {
      extensions: isUsingTsRunner() ? ['ts', 'js'] : ['js'],
      exclude: /.d.ts$/,
      visit: this.visit,
    }

    if (
      !parsedArgv.disableCoreCommand &&
      this.initOptions.packageDirectory &&
      pkg.name !== parsedArgv.scriptName
    ) {
      this.debugCore('Load core commands')
      yargsObj.commandDir(
        path.resolve(
          this.initOptions.packageDirectory,
          appConfig.coreCommandDir
        ),
        yargsOpts
      )
    }

    if (this.allPlugins) {
      this.debugCore('Load plugins commands')
      const allPlugins = this.allPlugins
      const combinedConfig = this.combinedConfig
      for (const [plugin, pluginPath] of Object.entries(allPlugins)) {
        if (
          combinedConfig.pluginConfigs &&
          combinedConfig.pluginConfigs[plugin] &&
          combinedConfig.pluginConfigs[plugin].commandDir
        ) {
          const cmdDir = path.resolve(
            pluginPath,
            combinedConfig.pluginConfigs[plugin].commandDir
          )
          if (existsSync(cmdDir)) {
            yargsObj.commandDir(cmdDir, yargsOpts)
          }
        }
      }
    }

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
      try {
        let command =
          (await import(path.resolve(process.cwd(), process.argv[2]))) || {}
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
      } catch (e: unknown) {
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
        log(this.version)
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
  }

  private async execute(yargsObj: Argv): Promise<void> {
    this.debugCore('Parse and launch')
    try {
      await yargsObj.parseAsync()
      this.debugCore('Launch complete')
    } catch (e: unknown) {
      if (this.parsedArgv.verbose) {
        console.error(e)
      } else {
        const msg = e instanceof Error ? e.message : String(e)
        return error(msg)
      }
    }
  }

  // --- Hook invocation ---

  private _parseHookName(hook: string): {
    hook: string
    originModuler: string
  } {
    const splitHookName = hook.split(':')
    let originModuler: string
    if (splitHookName.length === 1) {
      originModuler = ''
      hook = splitHookName[0]
    } else if (splitHookName.length === 2) {
      originModuler = splitHookName[0]
      hook = splitHookName[1]
    } else {
      throw Error('Invalid hook name')
    }
    hook = !hook.startsWith('hook_') ? `hook_${hook}` : hook
    return { hook, originModuler }
  }

  private _collectFileHooks(
    hook: string,
    originModuler: string,
    options: HookOption,
    argv: ArgvOptions,
    $core: Core,
    catchErrors: boolean = true
  ): {
    hookCollected: unknown[]
    hookIndex: string[]
    errors: Array<{ plugin: string; error: Error }>
  } {
    const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'
    const appConfig = $core.appConfig
    const combinedConfig = $core.combinedConfig
    const plugins = argv.packageDirectory
      ? Object.assign(
          {},
          { [scriptName]: path.resolve(argv.packageDirectory) },
          $core.allPlugins
        )
      : { ...$core.allPlugins }

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

    const hookCollected: unknown[] = []
    const hookIndex: string[] = []
    const errors: Array<{ plugin: string; error: Error }> = []
    const pluginKeys = Object.keys(plugins)

    for (let i = 0, length = pluginKeys.length; i < length; i++) {
      const plugin = pluginKeys[i]

      if (
        Array.isArray(options.include) &&
        options.include.length > 0 &&
        !options.include.includes(plugin)
      ) {
        continue
      }

      if (
        Array.isArray(options.exclude) &&
        options.exclude.length > 0 &&
        options.exclude.includes(plugin)
      ) {
        continue
      }

      try {
        let pluginEntryPath: string
        let hookDir: string = ''

        switch (plugin) {
          case scriptName:
            const coreRcInfo = $core.parseRcFile(plugin, plugins[plugin])
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
            entryFileName = 'index.ts'
            pluginEntryPath = path.resolve(
              plugins[plugin],
              hookDir,
              entryFileName
            )
          }
        }

        if (!pluginEntryPath) {
          continue
        }

        const loadedPlugin = import(pluginEntryPath)
        hookCollected.push(
          // Dynamic plugin import — module shape is unknown at compile time
          loadedPlugin
            .then(async (mod: any) => {
              if (typeof mod === 'function') {
                mod = await mod(this, argv)
              } else if (typeof mod.default === 'function') {
                mod = await mod.default(this, argv)
              }

              let forHookCollected: Hook | null = null
              if (mod[hook]) {
                if (
                  !mod[hook].getHook ||
                  typeof mod[hook].getHook !== 'function'
                ) {
                  forHookCollected = new Hook(mod[hook])
                } else {
                  forHookCollected = mod[hook]
                }
              }

              if (forHookCollected) {
                const loadedPluginHook = forHookCollected.getHook(originModuler)
                if (typeof loadedPluginHook === 'function') {
                  return loadedPluginHook($core, argv, options)
                } else {
                  return loadedPluginHook
                }
              }
              return undefined
            })
            .catch((e: unknown) => {
              if (!catchErrors) {
                throw e
              }
              const err = e instanceof Error ? e : new Error(String(e))
              errors.push({ plugin, error: err })
              if (options.strict) {
                throw err
              }
              warn(e)
              return undefined
            })
        )
        hookIndex.push(plugin)
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e))
        errors.push({ plugin, error: err })
        if (options.strict) {
          throw err
        }
        warn(e)
      }
    }

    return { hookCollected, hookIndex, errors }
  }

  private _collectDynamicHooks(
    hook: string,
    originModuler: string,
    options: HookOption,
    argv: ArgvOptions,
    $core: Core,
    catchErrors: boolean = true
  ): {
    hookCollected: unknown[]
    hookIndex: string[]
    errors: Array<{ plugin: string; error: Error }>
  } {
    const hookCollected: unknown[] = []
    const hookIndex: string[] = []
    const errors: Array<{ plugin: string; error: Error }> = []
    const dynamicHandlers = this._dynamicHooks.get(hook) || []

    for (const { pluginName, handler, targetModule } of dynamicHandlers) {
      // Namespace isolation for dynamic hooks:
      // - originModuler set && targetModule set && mismatch → skip
      // - originModuler set && targetModule empty → skip (strict mode)
      // - otherwise → pass through
      if (originModuler) {
        if (targetModule && targetModule !== originModuler) {
          continue
        }
        if (!targetModule) {
          continue
        }
      }

      if (
        Array.isArray(options.include) &&
        options.include.length > 0 &&
        !options.include.includes(pluginName)
      ) {
        continue
      }

      if (
        Array.isArray(options.exclude) &&
        options.exclude.length > 0 &&
        options.exclude.includes(pluginName)
      ) {
        continue
      }

      try {
        hookCollected.push(handler($core, argv, options))
        hookIndex.push(pluginName)
      } catch (e: unknown) {
        if (!catchErrors) {
          // Wrap sync errors as rejected promises for allSettled
          hookCollected.push(Promise.reject(e))
          hookIndex.push(pluginName)
        } else {
          const err = e instanceof Error ? e : new Error(String(e))
          errors.push({ plugin: pluginName, error: err })
          if (options.strict) {
            throw err
          }
          warn(e)
        }
      }
    }

    return { hookCollected, hookIndex, errors }
  }

  private _mergeHookResults(
    hookResolved: unknown[],
    hookIndex: string[],
    mode: string
  ): unknown {
    let pluginsReturn: unknown
    switch (mode) {
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

    for (let i = 0; i < hookResolved.length; i++) {
      let pluginReturn = hookResolved[i]
      switch (mode) {
        case 'group':
          pluginReturn = pluginReturn || {}
          ;(pluginsReturn as Record<string, unknown>)[hookIndex[i]] =
            pluginReturn
          break
        case 'push':
          ;(pluginsReturn as unknown[]).push(pluginReturn)
          break
        case 'replace':
          pluginsReturn = pluginReturn
          break
        case 'merge':
          pluginReturn = pluginReturn || {}
          pluginsReturn = deepMerge(pluginsReturn, pluginReturn)
          break
        case 'assign':
        default:
          pluginReturn = pluginReturn || {}
          pluginsReturn = Object.assign(
            pluginsReturn as Record<string, unknown>,
            pluginReturn
          )
          break
      }
    }

    return pluginsReturn
  }

  async invokeHook<T>(
    hook: string,
    options: HookOption = { mode: 'assign' },
    opts: ArgvOptions = {}
  ): Promise<T | undefined> {
    const $core = Core.getInstance()
    const originalHook = hook
    $core.debugCore(`Invoke hook ${hook}`)

    const parsed = this._parseHookName(hook)
    hook = parsed.hook
    const originModuler = parsed.originModuler

    const argv = Object.assign({}, opts, $core.parsedArgv)
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

    this.emit('hook:before', originalHook)

    try {
      // Collect file-based hooks
      const fileResult = this._collectFileHooks(
        hook,
        originModuler,
        options,
        argv,
        $core
      )

      // Collect dynamic hooks
      const dynamicResult = this._collectDynamicHooks(
        hook,
        originModuler,
        options,
        argv,
        $core
      )

      const allCollected = [
        ...fileResult.hookCollected,
        ...dynamicResult.hookCollected,
      ]
      const allIndex = [...fileResult.hookIndex, ...dynamicResult.hookIndex]

      // Handle strict errors from collection phase
      const allErrors = [...fileResult.errors, ...dynamicResult.errors]
      if (options.strict && allErrors.length > 0) {
        throw allErrors[0].error
      }

      const hookResolved: unknown[] = await Promise.all(allCollected)
      // Filter out undefined entries from file hooks that didn't match
      const filteredResolved: unknown[] = []
      const filteredIndex: string[] = []
      for (let i = 0; i < hookResolved.length; i++) {
        if (
          hookResolved[i] !== undefined ||
          i >= fileResult.hookCollected.length
        ) {
          filteredResolved.push(hookResolved[i])
          filteredIndex.push(allIndex[i])
        }
      }

      const result = this._mergeHookResults(
        filteredResolved,
        filteredIndex,
        options.mode || 'assign'
      ) as T

      this.emit('hook:after', originalHook, result)
      return result
    } catch (e: unknown) {
      this.emit('hook:error', originalHook, e)
      if (options.strict) {
        throw e
      }
      const msg = e instanceof Error ? e.message : String(e)
      error(msg)
    }
    return undefined
  }

  async invokeHookDetailed<T>(
    hook: string,
    options: HookOption = { mode: 'assign' },
    opts: ArgvOptions = {}
  ): Promise<HookInvocationResult<T>> {
    const $core = Core.getInstance()
    const originalHook = hook
    $core.debugCore(`Invoke hook detailed ${hook}`)

    const parsed = this._parseHookName(hook)
    hook = parsed.hook
    const originModuler = parsed.originModuler

    const argv = Object.assign({}, opts, $core.parsedArgv)
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

    const allErrors: Array<{ plugin: string; error: Error }> = []
    this.emit('hook:before', originalHook)

    try {
      const fileResult = this._collectFileHooks(
        hook,
        originModuler,
        { ...options, strict: false },
        argv,
        $core,
        false
      )
      const dynamicResult = this._collectDynamicHooks(
        hook,
        originModuler,
        { ...options, strict: false },
        argv,
        $core,
        false
      )

      allErrors.push(...fileResult.errors, ...dynamicResult.errors)

      const allCollected = [
        ...fileResult.hookCollected,
        ...dynamicResult.hookCollected,
      ]
      const allIndex = [...fileResult.hookIndex, ...dynamicResult.hookIndex]

      const settled = await Promise.allSettled(allCollected)
      const resolvedValues: unknown[] = []
      const resolvedIndex: string[] = []

      for (let i = 0; i < settled.length; i++) {
        const s = settled[i]
        if (s.status === 'fulfilled') {
          if (s.value !== undefined || i >= fileResult.hookCollected.length) {
            resolvedValues.push(s.value)
            resolvedIndex.push(allIndex[i])
          }
        } else {
          const err =
            s.reason instanceof Error ? s.reason : new Error(String(s.reason))
          allErrors.push({ plugin: allIndex[i], error: err })
          this.emit('hook:error', originalHook, err, allIndex[i])
        }
      }

      const result = this._mergeHookResults(
        resolvedValues,
        resolvedIndex,
        options.mode || 'assign'
      ) as T
      this.emit('hook:after', originalHook, result)

      return { result, errors: allErrors }
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e))
      this.emit('hook:error', originalHook, err)
      allErrors.push({ plugin: 'unknown', error: err })

      let defaultResult: unknown
      switch (options.mode) {
        case 'push':
          defaultResult = []
          break
        case 'replace':
          defaultResult = undefined
          break
        default:
          defaultResult = {}
          break
      }
      return { result: defaultResult as T, errors: allErrors }
    }
  }
}

// --- Convenience exports (backward compatible) ---

export const invokeHook = async <T>(
  hook: string,
  options: HookOption = { mode: 'assign' },
  opts: ArgvOptions = {}
): Promise<T | undefined> => {
  const $core = Core.getInstance()
  return $core.invokeHook(hook, options, opts)
}

export const extendSubCommand = (
  command: string,
  moduleName: string,
  // Must remain `any`: Yargs instance type varies across versions and configurations
  yargs: any,
  basePath: string
): void => {
  const $core = Core.getInstance()
  $core.extendSubCommand(command, moduleName, yargs, basePath)
}

export const extendConfig = (
  extendRcPath: string[] | string,
  prefix: string
) => {
  const $core = Core.getInstance()
  return $core.extendConfig(extendRcPath, prefix)
}
