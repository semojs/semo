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

  hook_new_repo: {
    zignis_plugin_starter: {
      repo: 'git@github.com:zhike-team/zignis-plugin-starter.git',
      branch: 'master',
      alias: ['zignis-plugin-starter', 'plugin']
    }
  },

  * hook_status () {
    let info = JSON.parse(
      yield envinfo.run(
        {
          System: ['OS', 'Shell'],
          Binaries: ['Node', 'Yarn', 'npm']
        },
        { json: true }
      )
    )

    let kvs = {}
    const appConfig = Utils.getApplicationConfig(path.resolve(__dirname, '../../'))
    kvs = Object.assign(
      kvs,
      Utils._.pickBy(
        {
          version: appConfig.version,
          location:
            appConfig.applicationDir.indexOf(process.env.HOME) === 0
              ? appConfig.applicationDir.replace(process.env.HOME, '~')
              : appConfig.applicationDir,
          os: info.System.OS,
          node: info.Binaries.Node ? info.Binaries.Node.version : null,
          npm: info.Binaries.npm ? info.Binaries.npm.version : null,
          yarn: info.Binaries.Yarn ? info.Binaries.Yarn.version : null,
          hostname: os.hostname(),
          home: process.env.HOME,
          shell: info.System.Shell.path
        },
        Utils._.identity
      )
    )

    return kvs
  }
}
