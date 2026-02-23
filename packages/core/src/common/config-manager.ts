import { findUpSync } from 'find-up'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'
import { warn } from './log.js'
import {
  ApplicationConfig,
  ArgvOptions,
  CombinedConfig,
  PluginConfig,
} from './types.js'
import {
  deepGet,
  deepMerge,
  deepSet,
  formatRcOptions,
  isUsingTsRunner,
} from './utils.js'

export interface ConfigManagerContext {
  scriptName: string
  parsedArgv: Record<string, unknown>
  _cachedAppConfig: ApplicationConfig | null
  _rcFileCache: Map<string, Record<string, unknown>>
  debugCore: (...rest: unknown[]) => void
  allPlugins: Record<string, string>
  getApplicationConfig(opts?: ArgvOptions): ApplicationConfig
  getAllPluginsMapping(argv?: ArgvOptions): Promise<Record<string, string>>
}

export function parseRcFile(
  ctx: ConfigManagerContext,
  plugin: string,
  pluginPath: string
): Record<string, unknown> {
  const cacheKey = `${plugin}:${pluginPath}`
  if (ctx._rcFileCache.has(cacheKey)) {
    return ctx._rcFileCache.get(cacheKey)!
  }

  const pluginSemoYamlRcPath = path.resolve(
    pluginPath,
    `.${ctx.scriptName}rc.yml`
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
      ctx.debugCore('load rc failed:', e)
      warn(`Plugin ${plugin} .semorc.yml config load failed!`)
      pluginConfig = {}
    }
  } else {
    // Zero-config convention: auto-apply defaults when .semorc.yml is missing
    const useTsSrc =
      isUsingTsRunner() && existsSync(path.resolve(pluginPath, 'src/commands'))
    const commandDir = useTsSrc ? 'src/commands' : 'lib/commands'
    const hookDir = useTsSrc ? 'src/hooks' : 'lib/hooks'
    const extendDir = useTsSrc ? 'src/extends' : 'lib/extends'

    if (existsSync(path.resolve(pluginPath, commandDir))) {
      pluginConfig.commandDir = commandDir
    }
    if (existsSync(path.resolve(pluginPath, hookDir))) {
      pluginConfig.hookDir = hookDir
    }
    if (existsSync(path.resolve(pluginPath, extendDir))) {
      pluginConfig.extendDir = extendDir
    }

    try {
      const packageConfigContent = readFileSync(pluginPackagePath, 'utf8')
      const packageConfig = JSON.parse(packageConfigContent)
      pluginConfig.version = packageConfig.version
    } catch {
      pluginConfig.version = '0.0.0'
    }
  }

  ctx._rcFileCache.set(cacheKey, pluginConfig)
  return pluginConfig
}

export function getApplicationConfig(
  ctx: ConfigManagerContext,
  opts?: ArgvOptions
): ApplicationConfig {
  opts = opts || {}

  const cacheKey = opts.cwd || ''
  if (ctx._cachedAppConfig && !cacheKey) {
    return ctx._cachedAppConfig
  }

  let applicationConfig: ApplicationConfig

  const configPath = findUpSync(`.${ctx.scriptName}rc.yml`, {
    cwd: opts.cwd,
  })

  const nodeEnv = getNodeEnv()
  const configEnvPath = findUpSync([`.${ctx.scriptName}rc.${nodeEnv}.yml`], {
    cwd: opts.cwd,
  })

  const homeSemoYamlRcPath = process.env.HOME
    ? path.resolve(
        process.env.HOME,
        `.${ctx.scriptName}`,
        `.${ctx.scriptName}rc.yml`
      )
    : ''
  if (homeSemoYamlRcPath && existsSync(homeSemoYamlRcPath)) {
    try {
      const rcFile = readFileSync(homeSemoYamlRcPath, 'utf8')
      applicationConfig = formatRcOptions<ApplicationConfig>(
        yaml.parse(rcFile)
      ) as ApplicationConfig
    } catch (e) {
      ctx.debugCore('load rc failed:', e)
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

  applicationConfig = Object.assign({}, applicationConfig, opts, {
    coreCommandDir: 'lib/commands',
  })

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

    if (packageInfo[ctx.scriptName]) {
      packageInfo[ctx.scriptName] = formatRcOptions(packageInfo[ctx.scriptName])
      applicationConfig = Object.assign(
        {},
        applicationConfig,
        packageInfo[ctx.scriptName]
      )
    }
  }

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
      applicationConfig = deepMerge(applicationConfig, semoRcInfo)
    } catch (e) {
      ctx.debugCore('load rc failed:', e)
      warn('application rc config load failed!')
    }
  }

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
      applicationConfig = deepMerge(applicationConfig, semoEnvRcInfo)
    } catch (e) {
      ctx.debugCore('load rc failed:', e)
      warn('application env rc config load failed!')
    }
  }

  if (!cacheKey) {
    ctx._cachedAppConfig = applicationConfig
  }
  return applicationConfig
}

export async function getCombinedConfig(
  ctx: ConfigManagerContext,
  argv: ArgvOptions
): Promise<CombinedConfig> {
  let combinedConfig: CombinedConfig = {}
  const pluginConfigs: { [key: string]: PluginConfig } = {}

  const plugins =
    Object.keys(ctx.allPlugins).length > 0
      ? ctx.allPlugins
      : await ctx.getAllPluginsMapping(argv)
  for (const [plugin, pluginPath] of Object.entries(plugins)) {
    const pluginConfig = parseRcFile(ctx, plugin, pluginPath) as PluginConfig

    const pickKeys = ['commandDir', 'extendDir', 'hookDir', plugin]
    const pluginConfigPick = Object.fromEntries(
      Object.entries(pluginConfig).filter(([k]) => pickKeys.includes(k))
    )
    combinedConfig = deepMerge(combinedConfig, pluginConfigPick)
    if (pluginConfig) {
      pluginConfigs[plugin] = pluginConfig
    }
  }

  const applicatonConfig = ctx.getApplicationConfig()
  combinedConfig = deepMerge(combinedConfig, applicatonConfig)
  combinedConfig.pluginConfigs = pluginConfigs

  return combinedConfig || {}
}

export function parsePluginConfig(
  argv: Record<string, unknown>,
  plugin: string
): Record<string, unknown> {
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

export function getNodeEnv(argv?: Record<string, unknown>): string {
  if (!argv) {
    return process.env.NODE_ENV || 'development'
  }
  const nodeEnvKey = (argv.nodeEnvKey || argv.nodeEnv || 'NODE_ENV') as string
  return process.env[nodeEnvKey] || 'development'
}

export function extendConfigFromRc(
  ctx: ConfigManagerContext,
  parsedArgv: Record<string, unknown>,
  extendRcPath: string[] | string,
  prefix: string
): Record<string, unknown> {
  let argv = parsedArgv

  const extendRcPathArray = Array.isArray(extendRcPath)
    ? extendRcPath
    : [extendRcPath]

  for (let rcPath of extendRcPathArray) {
    rcPath = path.resolve(process.cwd(), rcPath)
    if (rcPath && existsSync(rcPath)) {
      try {
        const rcFile = readFileSync(rcPath, 'utf8')
        const parsedRc = yaml.parse(rcFile)
        const extendRc = formatRcOptions(parsedRc)
        if (prefix) {
          const prefixPart = deepGet(argv, prefix)
          const mergePart = deepMerge(prefixPart, extendRc)
          argv = deepSet(argv, prefix, mergePart)
        } else {
          argv = deepMerge(argv, extendRc)
        }
      } catch (e) {
        ctx.debugCore('load rc:', e)
        warn(`Global ${rcPath} config load failed!`)
      }
    }

    const nodeEnvVal = getNodeEnv(argv)
    const extendRcEnvPath = path.resolve(
      path.dirname(rcPath),
      `${path.basename(rcPath, '.yml')}.${nodeEnvVal}.yml`
    )
    if (extendRcEnvPath && existsSync(extendRcEnvPath)) {
      try {
        const rcFile = readFileSync(extendRcEnvPath, 'utf8')
        const parsedRc = yaml.parse(rcFile)
        const extendRc = formatRcOptions(parsedRc)
        if (prefix) {
          const prefixPart = deepGet(argv, prefix)
          const mergePart = deepMerge(prefixPart, extendRc)
          argv = deepSet(argv, prefix, mergePart)
        } else {
          argv = deepMerge(argv, extendRc)
        }
      } catch (e) {
        ctx.debugCore('load rc:', e)
        warn(`Global ${extendRcEnvPath} config load failed!`)
      }
    }
  }

  return argv
}
