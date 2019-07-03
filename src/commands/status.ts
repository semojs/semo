import path from 'path'
import fs from 'fs'
import { Utils } from '..'

export const command = 'status'
export const aliases = 'st'
export const desc = 'Show environment status info'

export const builder = function() {}

export const handler = async function() {
  try {
    // basic information
    const hookStatus = await Utils.invokeHook('status', { mode: 'group' })
    const columns: string[][] = []
    let kvs = hookStatus.zignis ? hookStatus.zignis : {}
    Object.keys(kvs).map(k => columns.push([k, kvs[k]]))
    Utils.outputTable(columns, 'Core Information')

    // plugin information
    const plugins = Utils.getAllPluginsMapping()
    Object.keys(plugins).forEach(plugin => {
      if (fs.existsSync(path.resolve(plugins[plugin], 'package.json'))) {
        const pkgConfig = require(path.resolve(plugins[plugin], 'package.json'))
        const columns = []
        if (pkgConfig.version) {
          columns.push(['version', pkgConfig.version])
        }

        if (hookStatus && hookStatus[plugin]) {
          Object.keys(hookStatus[plugin]).map(function(key) {
            columns.push([key, hookStatus[plugin][key]])
          })
        }

        if (process.env.HOME && plugins[plugin].indexOf(process.env.HOME) === 0) {
          columns.push(['location', plugins[plugin].replace(process.env.HOME, '~')])
        } else {
          columns.push(['location', plugins[plugin]])
        }

        Utils.outputTable(columns, `[${plugin}]`)
      }
    })

    // application information
    if (hookStatus['application']) {
      let plugin = 'application'
      const columns: string[][] = []
      if (hookStatus && hookStatus[plugin]) {
        Object.keys(hookStatus[plugin]).forEach(function(key) {
          columns.push([key, hookStatus[plugin][key]])
        })
      }
      Utils.outputTable(columns, 'Application Information')
    }

    process.exit(0)
  } catch(e) {
    Utils.error(e.stack)
  }
}
