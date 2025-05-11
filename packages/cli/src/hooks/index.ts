import { Core, Hook } from '@semo/core'
import envinfo from 'envinfo'
import _ from 'lodash'
import { fileURLToPath } from 'node:url'
import os from 'os'
import path from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const hook_hook = new Hook('semo', {
  before_command: 'Hook triggered before command execution.',
  component: 'Hook triggered when needing to fetch components',
  hook: 'Hook triggered in hook command.',
  repl: 'Hook triggered in repl command.',
  repl_command: 'Define custom repl command.',
  status: 'Hook triggered in status command.',
  create_project_template: 'Hook triggered in create command.',
})

export const hook_repl = new Hook('semo', (core: Core) => {
  const corePkgInfo = core.loadCorePackageInfo()
  return { VERSION: corePkgInfo.version }
})

export const hook_create_project_template = new Hook('semo', () => {
  const scriptName = 'semo'
  return scriptName === 'semo'
    ? {
        semo_starter_plugin_typescript: {
          name: 'Semo plugin typescript template',
          description: 'A Semo plugin project template in typescript.',
          repo: 'https://github.com/semojs/semo-starter-plugin-typescript.git',
          branch: 'master',
          tags: ['plugin'],
        },
      }
    : {}
})

export const hook_status = new Hook('semo', async (core: Core) => {
  const info = JSON.parse(
    await envinfo.run(
      {
        System: ['OS', 'Shell'],
        Binaries: ['Node', 'Yarn', 'npm', 'pnpm'],
      },
      { json: true }
    )
  )

  let kvs = {}
  const appConfig = core.getApplicationConfig({
    cwd: process.cwd(),
  })

  const location = path.resolve(__dirname, '../../')
  kvs = Object.assign(
    kvs,
    _.pickBy(
      {
        appVersion: appConfig.version,
        [core.initOptions.scriptName + 'CoreVersion']: core.version,

        os: info.System.OS,
        node: info.Binaries.Node ? info.Binaries.Node.version : null,
        npm: info.Binaries.npm ? info.Binaries.npm.version : null,
        yarn: info.Binaries.Yarn ? info.Binaries.Yarn.version : null,
        pnpm: info.Binaries.pnpm ? info.Binaries.pnpm.version : null,
        hostname: os.hostname(),
        home: process.env.HOME,
        shell: info.System.Shell.path,
        [core.initOptions.scriptName + 'Location']:
          process.env.HOME && location.indexOf(process.env.HOME) === 0
            ? location.replace(process.env.HOME, '~')
            : location,
      },
      _.identity
    )
  )

  return kvs
})
