import { existsSync } from 'node:fs'
import path from 'node:path'
import { RequireDirectoryOptions } from 'yargs'
import { ArgvWithPlugin, CombinedConfig } from './types.js'

export interface CommandLoaderContext {
  parsedArgv: Record<string, unknown>
  allPlugins: Record<string, string>
  combinedConfig: CombinedConfig
  parsePluginConfig(
    plugin: string,
    argv: Record<string, unknown>
  ): Record<string, unknown>
  setParsedArgv(argv: Record<string, unknown>): void
}

export function createVisitor(ctx: CommandLoaderContext) {
  // Command module shape is dynamic (loaded from plugin files at runtime)
  return (command: any, _pathTofile: string, _filename: string) => {
    const middleware = async (argv: ArgvWithPlugin) => {
      if (!command.noblank) {
        console.log()
      }

      argv.$config = {}
      if (command.plugin) {
        argv.$config = ctx.parsePluginConfig(command.plugin, argv)
      }

      argv.$command = command
      ctx.setParsedArgv(argv)
    }
    if (command.middlewares && Array.isArray(command.middlewares)) {
      command.middlewares.unshift(middleware)
    }

    return !(command.disabled === true)
  }
}

export function extendSubCommand(
  ctx: CommandLoaderContext,
  command: string,
  moduleName: string,
  // Must remain `any`: Yargs instance type varies across versions and configurations
  yargs: any,
  basePath: string
): void {
  const plugins = ctx.allPlugins
  const config = ctx.combinedConfig as CombinedConfig & {
    pluginConfigs: Record<string, { extendDir?: string }>
    extendDir?: string
  }
  const opts: RequireDirectoryOptions = {
    extensions: ['ts', 'js'],
    exclude: /.d.ts$/,
    visit: createVisitor(ctx),
  }

  const currentCommand: string | undefined = command.split('/').pop()
  if (currentCommand && existsSync(path.resolve(basePath, currentCommand))) {
    yargs.commandDir(path.resolve(basePath, currentCommand), opts)
  }

  if (plugins) {
    for (const [plugin, pluginPath] of Object.entries(plugins)) {
      if (
        config.pluginConfigs[plugin] &&
        config.pluginConfigs[plugin].extendDir
      ) {
        const extendCommandPath = path.resolve(
          pluginPath,
          `${config.pluginConfigs[plugin].extendDir}/${moduleName}/src/commands`,
          command
        )
        if (existsSync(extendCommandPath)) {
          yargs.commandDir(extendCommandPath, opts)
        }
      }
    }
  }

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
