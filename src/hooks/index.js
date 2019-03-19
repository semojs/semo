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
        kvs.application = `${pkgConfig.version} ${path.resolve(process.cwd())}`
      }
    }

    kvs = Object.assign(kvs, Utils._.pickBy({
      zignis: `${Utils.getApplicationConfig().version} ${Utils.getApplicationConfig().applicationDir}`,
      home: process.env.HOME,
      hostname: os.hostname(),
      os: info.System.OS,
      shell: info.System.Shell.path,
      node: info.Binaries.Node ? info.Binaries.Node.version : null,
      npm: info.Binaries.npm ? info.Binaries.npm.version : null,
      yarn: info.Binaries.Yarn ? info.Binaries.Yarn.version : null,
    }, Utils._.identity))

    return kvs
  }

}
