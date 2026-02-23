import { glob } from 'glob'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { error, warn } from './log.js'
import { ArgvOptions } from './types.js'
import {
  clearPluginManifest,
  loadLocalPluginManifest,
  loadPluginManifest,
  savePluginManifest,
} from './plugin-cache.js'
import { getAbsolutePath, getPackagePath } from './utils.js'

export interface PluginLoaderContext {
  scriptName: string
  version: string
  debugCore: (...rest: unknown[]) => void
  config<T = string | Record<string, unknown>>(key: string, defaultValue?: T): T
  getApplicationConfig(): any
}

export async function getAllPluginsMapping(
  ctx: PluginLoaderContext,
  __dirname: string,
  argv?: ArgvOptions
): Promise<Record<string, string>> {
  argv = argv || ({} as ArgvOptions)

  // Try loading from manifest cache (skip if --no-cache is set)
  // Priority: local manifest → global manifest → full scan
  if (!argv.noCache) {
    const localCached = loadLocalPluginManifest(ctx.scriptName, ctx.version)
    if (localCached) {
      ctx.debugCore('Using local plugin manifest')
      return localCached
    }
    const cached = loadPluginManifest(ctx.scriptName, ctx.version)
    if (cached) {
      ctx.debugCore('Using cached plugin manifest')
      return cached
    }
  }

  let enablePluginAutoScan = true

  let plugins: Record<string, string> = {}
  const scriptName = argv && argv.scriptName ? argv.scriptName : 'semo'
  // Process $plugins.register
  if (Object.keys(plugins).length === 0) {
    const registerPlugins: Record<string, unknown> =
      (ctx.config('$plugins.register') as Record<string, unknown>) || {}
    if (Object.keys(registerPlugins).length > 0) {
      enablePluginAutoScan = false
    }
    for (let [plugin, pluginPath] of Object.entries(registerPlugins)) {
      if (
        !plugin.startsWith('.') &&
        !plugin.includes(scriptName + '-plugin-')
      ) {
        plugin = scriptName + '-plugin-' + plugin
      }

      if (typeof pluginPath === 'boolean' && pluginPath) {
        try {
          const packagePath = getPackagePath(plugin, [process.cwd()])

          if (packagePath) {
            pluginPath = path.dirname(packagePath)
            if (typeof pluginPath === 'string') {
              plugins[plugin] = pluginPath
            }
          }
        } catch (e: unknown) {
          warn(e)
        }
      } else if (
        typeof pluginPath === 'string' &&
        (pluginPath.startsWith('/') ||
          pluginPath.startsWith('.') ||
          pluginPath.startsWith('~'))
      ) {
        pluginPath = getAbsolutePath(pluginPath)
        if (typeof pluginPath === 'string') {
          plugins[plugin] = pluginPath
        }
      } else {
        // Means not register for now
      }
    }
  }

  const pluginPrefix = (argv.pluginPrefix || 'semo') as string
  let pluginPrefixs: string[] = []
  if (typeof pluginPrefix === 'string') {
    pluginPrefixs = [pluginPrefix]
  }

  if (!Array.isArray(pluginPrefixs)) {
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

  // Helper: scan a directory for plugins matching patterns
  const scanPlugins = async (
    cwd: string,
    patterns: string[] = [topPluginPattern, orgPluginPattern]
  ) => {
    for (const pattern of patterns) {
      const matches = await glob(pattern, { noext: true, cwd })
      for (const match of matches) {
        const fullPath = path.resolve(cwd, match)
        // Only treat directories as plugins (skip files like semo-plugin-manifest.json)
        try {
          if (!statSync(fullPath).isDirectory()) continue
        } catch {
          continue
        }
        plugins[match] = fullPath
      }
    }
  }

  // Scan plugins
  if (Object.keys(plugins).length === 0 && enablePluginAutoScan) {
    plugins = {}

    // Process core plugins if needed
    await scanPlugins(path.resolve(__dirname, '../plugins'), [topPluginPattern])

    // argv.packageDirectory not always exists, if not, plugins list will not include npm global plugins
    if (!argv.disableGlobalPlugin && argv.packageDirectory) {
      // process core same directory top level plugins
      await scanPlugins(
        path.resolve(argv.packageDirectory, argv.orgMode ? '../../' : '../')
      )

      // Only local dev needed: load sibling plugins in packageDirectory parent directory
      // Only for orgMode = true, if orgMode = false, the result would be same as above search
      if (argv.orgMode) {
        await scanPlugins(path.resolve(argv.packageDirectory, '../'), [
          topPluginPattern,
        ])
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
        plugins['.' + scriptName] = path.resolve(
          process.env.HOME,
          '.' + scriptName
        )
      }

      // process home plugin-cache plugins
      await scanPlugins(
        path.resolve(
          process.env.HOME,
          `.${scriptName}`,
          'home-plugin-cache',
          'node_modules'
        )
      )

      // process home npm plugins
      await scanPlugins(
        path.resolve(process.env.HOME, `.${scriptName}`, 'node_modules')
      )
    }

    // process cwd(current directory) npm plugins
    await scanPlugins(path.resolve(process.cwd(), 'node_modules'))

    // process local plugins
    const config = ctx.getApplicationConfig()
    const pluginDirs = (
      Array.isArray(config.pluginDir) ? config.pluginDir : [config.pluginDir]
    ) as string[]
    for (const pluginDir of pluginDirs) {
      if (existsSync(pluginDir)) {
        await scanPlugins(path.resolve(process.cwd(), pluginDir))
      }
    }

    // Process plugin project
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
  const extraPluginDirEnvName = scriptName.toUpperCase() + '_PLUGIN_DIR'
  if (
    extraPluginDirEnvName &&
    process.env[extraPluginDirEnvName] &&
    existsSync(getAbsolutePath(process.env[extraPluginDirEnvName] as string))
  ) {
    const envDir = getAbsolutePath(String(process.env[extraPluginDirEnvName]))
    await scanPlugins(path.resolve(envDir))
  }

  // Second filter for registered or scanned plugins
  const includePlugins = (ctx.config('$plugins.include') || []) as string[]
  const excludePlugins = (ctx.config('$plugins.exclude') || []) as string[]

  if (Array.isArray(includePlugins) && includePlugins.length > 0) {
    plugins = Object.fromEntries(
      Object.entries(plugins).filter(([plugin]) => {
        let p = plugin
        if (p.startsWith(scriptName + '-plugin-')) {
          p = p.substring((scriptName + '-plugin-').length)
        }
        return (
          includePlugins.includes(p) ||
          includePlugins.includes(scriptName + '-plugin-' + p)
        )
      })
    )
  }

  if (Array.isArray(excludePlugins) && excludePlugins.length > 0) {
    plugins = Object.fromEntries(
      Object.entries(plugins).filter(([plugin]) => {
        let p = plugin
        if (p.startsWith(scriptName + '-plugin-')) {
          p = p.substring((scriptName + '-plugin-').length)
        }
        return !(
          excludePlugins.includes(p) ||
          excludePlugins.includes(scriptName + '-plugin-' + p)
        )
      })
    )
  }

  // Save to manifest cache
  savePluginManifest(ctx.scriptName, ctx.version, plugins)

  return plugins
}

export function clearPluginCache(scriptName: string): void {
  clearPluginManifest(scriptName)
}
