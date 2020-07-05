import lodash from 'lodash'

type HookItem = {
  [key: string]: any
}

export class Hook {
  private mappings: HookItem = {}

  constructor(name: string | HookItem, handler: any) {
    if (lodash.isString(name)) {
      this.mappings[name] = handler
    } else if (lodash.isObject(name)) {
      this.mappings = name
    } else {
      throw new Error('Invalid hook')
    }
  }

  public getHook(name: string) {
    return this.mappings[name] || {}
  }


}