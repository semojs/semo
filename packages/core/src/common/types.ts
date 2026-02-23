import { Argv } from 'yargs'
import { Core } from './core.js'

export interface InitOptions {
  packageDirectory?: string
  packageName?: string
  scriptName?: string
  orgMode?: boolean
  skipStdin?: boolean
  argv?: string[]
  skipDotEnv?: boolean
}
export type PluginConfig = {
  commandDir: string
  extendDir: string
  hookDir: string
  version?: string
  [key: string]: unknown
}

/**
 * Known configuration fields in .semorc.yml.
 * Plugins may extend via index signature.
 */
export interface SemoConfig {
  commandDir?: string
  hookDir?: string
  extendDir?: string
  pluginDir?: string | string[]
  pluginPrefix?: string | string[]
  disableGlobalPlugin?: boolean
  disableHomePlugin?: boolean
  scriptDir?: string
  typescript?: boolean
  commandMakeDir?: string
  extendMakeDir?: string
  hookMakeDir?: string
  [key: string]: unknown
}

export type CombinedConfig = {
  pluginConfigs?: {
    [key: string]: PluginConfig
  }
  [key: string]: unknown
}
export type ArgvOptions = {
  _?: (string | number)[]
  enableCoreHook?: string[]
  setEpilog?: string | string[]
  setVersion?: string
  cwd?: string
  // Must remain `any`: Yargs dynamically adds properties from CLI flags,
  // and downstream command handlers access them without type narrowing.
  [key: string]: any
} & InitOptions

export interface ArgvWithPlugin extends ArgvOptions {
  $plugin?: {
    [key: string]: PluginConfig
  }
}

export type ApplicationConfig = {
  commandDir: string
  applicationDir: string
  scriptName: string
  coreCommandDir: string
  name: string
  version: string
  [key: string]: unknown
}

export interface HookOption {
  mode?: 'assign' | 'merge' | 'push' | 'replace' | 'group'
  useCache?: boolean
  include?: boolean | string[]
  exclude?: boolean | string[]
  reload?: boolean
  strict?: boolean
  context?: Record<string, unknown>
}

export interface HookInvocationResult<T> {
  result: T
  errors: Array<{ plugin: string; error: Error }>
}

export type HookReturn =
  | unknown[]
  | Record<string, unknown>
  | Record<string, Record<string, unknown>>
  | undefined

export type HookHandler = (
  core: Core,
  argv: ArgvOptions,
  options: HookOption
) => unknown
export type HookItem = {
  [name: string]: HookHandler | Record<string, unknown>
}

/**
 * Type interface for Semo command files.
 * Use `satisfies SemoCommand` for type checking without losing literal types.
 *
 * @example
 * ```typescript
 * import { SemoCommand } from '@semo/core'
 *
 * export default {
 *   command: 'mycommand',
 *   desc: 'My command description',
 *   builder: (yargs) => yargs.option('name', { type: 'string' }),
 *   handler: async (argv) => { console.log(argv.name) },
 * } satisfies SemoCommand
 * ```
 */
export interface SemoCommand {
  command: string | string[]
  desc?: string
  describe?: string
  aliases?: string | string[]
  plugin?: string
  disabled?: boolean
  noblank?: boolean
  // Yargs builder accepts arbitrary option descriptors
  builder?: ((yargs: Argv) => Argv | void) | Record<string, unknown>
  handler?: (
    argv: ArgvOptions & Record<string, unknown>
  ) => void | Promise<void>
  // Yargs middleware receives full argv object with dynamic properties
  middlewares?: ((argv: Record<string, unknown>) => void | Promise<void>)[]
}
