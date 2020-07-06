import lodash from 'lodash'

type HookItem = {
  [key: string]: any
}

export class Hook {
  private mappings: HookItem = {}
  private scriptName = 'semo'

  constructor(name: string | HookItem[], handler: any) {
    if (lodash.isString(name)) {
      name = this.convertName(name)
      this.mappings[<string>name] = handler
    } else if (lodash.isObject(name)) {
      const newMappings = {}
      Object.keys(name).forEach(n => {
        const nn = this.convertName(n)
        newMappings[nn] = name[n]
      })
      this.mappings = newMappings
    } else {
      throw new Error('Invalid hook')
    }
  }

  public getHook(name: string) {
    name = this.convertName(name)
    return this.mappings[name] || {}
  }

  private convertName(name) {
    if (name !== this.scriptName && name.indexOf(`${this.scriptName}-plugin-`) === -1) {
      name = this.scriptName + '-plugin-' + name
    }
    return name
  }

}