import { Core } from './core.js'

export interface InitOptions {
  packageDirectory?: string
  packageName?: string
  scriptName?: string
  orgMode?: boolean
}
export type PluginConfig = {
  commandDir: string
  extendDir: string
  hookDir: string
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
}

export type HookReturn =
  | unknown[]
  | Record<string, unknown>
  | Record<string, Record<string, any>>
  | undefined

export type HookHandler = (
  core: Core,
  argv: ArgvOptions,
  options: HookOption
) => unknown
export type HookItem = {
  [name: string]: HookHandler | Record<string, unknown>
}
