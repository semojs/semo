export class SemoError extends Error {
  readonly code: string
  constructor(message: string, code = 'SEMO_ERROR', options?: ErrorOptions) {
    super(message, options)
    this.name = 'SemoError'
    this.code = code
  }
}

export class PluginError extends SemoError {
  readonly pluginName: string
  constructor(pluginName: string, message: string, options?: ErrorOptions) {
    super(message, 'PLUGIN_ERROR', options)
    this.name = 'PluginError'
    this.pluginName = pluginName
  }
}

export class ConfigError extends SemoError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'CONFIG_ERROR', options)
    this.name = 'ConfigError'
  }
}

export class HookError extends SemoError {
  readonly hookName: string
  readonly pluginName: string
  constructor(
    hookName: string,
    pluginName: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, 'HOOK_ERROR', options)
    this.name = 'HookError'
    this.hookName = hookName
    this.pluginName = pluginName
  }
}
