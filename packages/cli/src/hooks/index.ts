import { Core, Hook, type ConfigSchema } from '@semo/core'
import envinfo from 'envinfo'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import path from 'node:path'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const hook_hook = new Hook('semo', {
  before_command: 'Hook triggered before command execution.',
  component: 'Hook triggered when needing to fetch components',
  config_schema: 'Hook for plugins to declare their config schema.',
  hook: 'Hook triggered in hook command.',
  repl: 'Hook triggered in repl command.',
  repl_command: 'Define custom repl command.',
  status: 'Hook triggered in status command.',
  create_project_template: 'Hook triggered in create command.',
})

export const hook_config_schema = new Hook(
  'semo',
  (): ConfigSchema => ({
    commandDir: {
      type: 'string',
      description: 'Directory for command files.',
    },
    hookDir: {
      type: 'string',
      description: 'Directory for hook files.',
    },
    extendDir: {
      type: 'string',
      description: 'Directory for extend files.',
    },
    pluginDir: {
      type: 'string',
      description: 'Additional directory to scan for plugins.',
    },
    pluginPrefix: {
      type: 'string',
      description: 'Plugin naming prefix (default: "semo").',
    },
    disableGlobalPlugin: {
      type: 'boolean',
      description: 'Disable loading plugins from global node_modules.',
    },
    disableHomePlugin: {
      type: 'boolean',
      description: 'Disable loading plugins from ~/.semo/node_modules.',
    },
  })
)

export const hook_repl = new Hook('semo', (core: Core) => {
  const corePkgInfo = core.loadCorePackageInfo()
  return { VERSION: corePkgInfo.version }
})

export const hook_create_project_template = new Hook('semo', () => ({
  semo_starter_plugin_typescript: {
    name: 'Semo plugin typescript template',
    description: 'A Semo plugin project template in typescript.',
    repo: 'https://github.com/semojs/semo-starter-plugin-typescript.git',
    branch: 'main',
    tags: ['plugin'],
  },
}))

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

  const appConfig = core.getApplicationConfig({
    cwd: process.cwd(),
  })

  const location = path.resolve(__dirname, '../../')
  const kvs = Object.fromEntries(
    Object.entries({
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
        process.env.HOME && location.startsWith(process.env.HOME)
          ? location.replace(process.env.HOME, '~')
          : location,
    }).filter(([, v]) => v)
  )

  return kvs
})
