const fs = require('fs')
const path = require('path')
const os = require('os')
const envinfo = require('envinfo')
const { Utils } = require('../../')

module.exports = {
  hook_hook: {
    beforeCommand: 'Hook triggered before command execution.',
    afterCommand: 'Hook triggered after command execution.',
    components: 'Hook triggered in zignis script command.',
    hook: 'Hook triggered in zignis hook command.',
    repl: 'Hook triggered in zignis repl command.',
    status: 'Hook triggered in zignis status command.',
    new_repo: 'Hook triggered in zignis new command.'
  },

  * hook_status () {
    let info = JSON.parse(yield envinfo.run({
      System: ['OS', 'Shell'],
      Binaries: ['Node', 'Yarn', 'npm']
    }, { json: true }))

    let kvs = {}
    if (fs.existsSync(path.resolve(process.cwd(), 'package.json'))) {
      const pkgConfig = require(path.resolve(process.cwd(), 'package.json'))
      if (pkgConfig && pkgConfig.version) {
        kvs.version = pkgConfig.version
      }
    }

    kvs = Object.assign(kvs, {
      hostname: os.hostname(),
      os: info.System.OS,
      shell: info.System.Shell.path,
      node: info.Binaries.Node.version,
      npm: info.Binaries.npm.version,
      yarn: info.Binaries.Yarn.version,
      zignis: Utils.getApplicationConfig().version,
      home: process.env.HOME,
      cwd: process.cwd()
    })

    return kvs
  }

}
