export class Hook {
  // Hook name
  private name: string

  // Hook handler
  private handler: any

  constructor(name: string, handler: any) {
    this.name = name
    this.handler = handler
  }

  public getName() {
    return this.name
  }

  public getHandler() {
    return this.handler
  }

}