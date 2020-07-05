import * as Utils from '../common/utils'

export const hook_repl = new Utils.Hook('semo', () => {
  return {
    SemoCore: Utils
  }
})