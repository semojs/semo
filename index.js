const Utils = require('./src/common/utils')
const fs = require('fs')
const path = require('path')

module.exports = {
  Utils,
  hook: {
    beforeCommand: 'Hook triggered before command execution.',
    afterCommand: 'Hook triggered after command execution.',
    components: 'Hook triggered in zignis script command.',
    hook: 'Hook triggered in zignis hook command.',
    repl: 'Hook triggered in zignis repl command.',
    status: 'Hook triggered in zignis status command.'
  },
  status () {
    let kvs = {}
    if (fs.existsSync(path.resolve(process.cwd(), 'package.json'))) {
      const pkgConfig = require(path.resolve(process.cwd(), 'package.json'))
      if (pkgConfig && pkgConfig.version) {
        kvs.version = pkgConfig.version
      }
    }

    kvs = Object.assign(kvs, {
      platform: process.platform,
      arch: process.arch,
      hostname: require('os').hostname(),
      node: process.version,
      zignis: require(path.resolve(__dirname, 'package.json')).version,
      home: process.env.HOME,
      cwd: process.cwd()
    })

    return kvs
  }

}
