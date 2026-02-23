import { HookHandler, HookItem } from './types.js'

let _globalScriptName = 'semo'

/**
 * Set the global script name used by Hook for name conversion.
 * Called automatically by Core during initialization.
 */
export function setHookScriptName(name: string) {
  _globalScriptName = name
}

export class Hook {
  /**
   * A class that manages hooks and their handlers.
   *
   * Recommended usage:
   * ```typescript
   * import { Hook } from '@semo/core'
   *
   * // Implement a hook defined by plugin 'semo'
   * export const hook_repl = new Hook('semo', (core, argv) => {
   *   return { myUtil: () => 'hello' }
   * })
   *
   * // Implement hooks from multiple plugins
   * export const hook_bar = new Hook({
   *   'semo-plugin-foo': (core, argv) => { ... },
   *   'semo-plugin-baz': (core, argv) => { ... },
   * })
   * ```
   */
  private mappings: HookItem = {}

  /**
   * Constructor for Hook class
   * @param name - Plugin name (e.g. 'semo') or hook mapping object
   * @param handler - Handler function (when name is a string)
   */
  constructor(
    name: string | HookItem,
    handler: HookHandler | Record<string, unknown> | undefined = undefined
  ) {
    if (typeof name === 'string') {
      name = this.convertName(name)
      if (!handler) return
      this.mappings[name] = handler
    } else if (typeof name === 'object' && name !== null) {
      const newMappings: HookItem = {}
      for (const [n, handler] of Object.entries(name as HookItem)) {
        const nn = this.convertName(n)
        newMappings[nn] = handler
      }
      this.mappings = newMappings
    } else {
      throw new Error('Invalid hook')
    }
  }

  /**
   * Gets a hook handler by name
   * @param name - Name of the hook to retrieve
   * @returns The hook handler object
   */
  public getHook(name: string) {
    name = this.convertName(name)
    return this.mappings[name] || {}
  }

  /**
   * Converts a hook name to the standardized format
   * @param name - Original hook name
   * @returns Converted hook name with proper prefix
   */
  private convertName(name: string) {
    const scriptName = _globalScriptName
    if (name !== scriptName && !name.includes(`${scriptName}-plugin-`)) {
      name = scriptName + '-plugin-' + name
    }
    return name
  }
}
