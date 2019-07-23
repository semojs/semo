import path from 'path'
import os from 'os'
import envinfo from 'envinfo'
import { Utils } from '..'

export const hook_hook = {
  beforeCommand: 'Hook triggered before command execution.',
  afterCommand: 'Hook triggered after command execution.',
  components: 'Hook triggered when needing to fetch components',
  hook: 'Hook triggered in hook command.',
  repl: 'Hook triggered in repl command.',
  status: 'Hook triggered in status command.',
  new_repo: 'Hook triggered in new command.'
}

export const hook_new_repo = () => {
  const argv: any = Utils.getInternalCache().get('argv')
  return argv.scriptName === 'zignis' ? {
    zignis_plugin_starter: {
      repo: 'git@github.com:zhike-team/zignis-plugin-starter.git',
      branch: 'master',
      alias: ['zignis-plugin-starter', 'plugin']
    }
  } : {}
}

export const hook_status = async () => {
  let info = JSON.parse(
    await envinfo.run(
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
