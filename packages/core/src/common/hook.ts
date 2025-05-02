import _ from 'lodash'
import { HookHandler, HookItem } from './types.js'

export class Hook {
  /**
   * A class that manages hooks and their handlers
   */
  private mappings: HookItem = {}
  private scriptName = 'semo'

  /**
   * Constructor for Hook class
   * @param name - Name of the hook or hook mapping object
   * @param handler - Handler function or object for the hook
   */
  constructor(
    name: string | HookItem,
    handler: HookHandler | Record<string, unknown> | undefined = undefined
  ) {
    if (_.isString(name)) {
      name = this.convertName(name)
      if (!handler) return
      this.mappings[name] = handler
    } else if (_.isObject(name)) {
      const newMappings: HookItem = {}
      Object.keys(name).forEach((n: string) => {
        const nn = this.convertName(n)
        newMappings[nn] = (name as HookItem)[n]
      })
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
    if (
      name !== this.scriptName &&
      name.indexOf(`${this.scriptName}-plugin-`) === -1
    ) {
      name = this.scriptName + '-plugin-' + name
    }
    return name
  }
}
