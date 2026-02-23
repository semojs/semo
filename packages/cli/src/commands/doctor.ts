import {
  type ArgvExtraOptions,
  type ConfigSchema,
  colorize,
  error,
  outputTable,
  validateConfig,
  formatValidationResult,
} from '@semo/core'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'

export const plugin = 'semo'
export const command = 'doctor'
export const desc = 'Check project health and configuration'
export const aliases = 'doc'

export const builder = function () {}

const PASS = colorize('green', 'PASS')
const WARN = colorize('yellow', 'WARN')
const FAIL = colorize('red', 'FAIL')

const MIN_NODE_VERSION = '20.19.0'

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) {
      return (pa[i] || 0) - (pb[i] || 0)
    }
  }
  return 0
}

export const handler = async function (argv: ArgvExtraOptions) {
  const rows: string[][] = []
  const scriptName = argv.scriptName || 'semo'

  // 1. Node.js version check
  const nodeVersion = process.version.replace(/^v/, '')
  if (compareVersions(nodeVersion, MIN_NODE_VERSION) >= 0) {
    rows.push(['Node.js version', PASS, `v${nodeVersion}`])
  } else {
    rows.push([
      'Node.js version',
      WARN,
      `v${nodeVersion} (requires >= ${MIN_NODE_VERSION})`,
    ])
  }

  // 2. Core version
  rows.push(['Core version', PASS, argv.$core!.version])

  // 3. Script name
  rows.push(['Script name', PASS, scriptName])

  // 4. Config file check
  const configPath = path.resolve(process.cwd(), `.${scriptName}rc.yml`)
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf8')
      yaml.parse(content)
      rows.push(['Config file', PASS, configPath])
    } catch {
      rows.push(['Config file', FAIL, `${configPath} (parse error)`])
    }
  } else {
    rows.push(['Config file', WARN, `${configPath} (not found)`])
  }

  // 5. Plugin health check
  const plugins = argv.$core!.allPlugins || {}
  for (const [name, pluginPath] of Object.entries(plugins)) {
    // Skip home config directory (e.g. ".semo" → ~/.semo), it's not a real npm package
    if (name.startsWith('.')) {
      rows.push([`Plugin: ${name}`, PASS, `${pluginPath} (home config)`])
      continue
    }
    if (!existsSync(pluginPath)) {
      rows.push([`Plugin: ${name}`, FAIL, `${pluginPath} (path not found)`])
      continue
    }
    const pkgPath = path.resolve(pluginPath, 'package.json')
    if (!existsSync(pkgPath)) {
      rows.push([
        `Plugin: ${name}`,
        FAIL,
        `${pluginPath} (missing package.json)`,
      ])
      continue
    }
    try {
      const content = readFileSync(pkgPath, 'utf8')
      JSON.parse(content)
      rows.push([`Plugin: ${name}`, PASS, pluginPath])
    } catch {
      rows.push([
        `Plugin: ${name}`,
        FAIL,
        `${pluginPath} (invalid package.json)`,
      ])
    }
  }

  // 6. Config Schema validation
  try {
    const hookResult = (await argv.$core!.invokeHook(
      `${scriptName}:config_schema`,
      {
        mode: 'assign',
      }
    )) as ConfigSchema | undefined

    if (hookResult && Object.keys(hookResult).length > 0) {
      const appConfig = argv.$core!.getApplicationConfig({ cwd: process.cwd() })
      const result = validateConfig(
        appConfig as Record<string, unknown>,
        hookResult
      )
      if (result.valid) {
        rows.push(['Config schema', PASS, 'All fields valid'])
      } else {
        rows.push(['Config schema', FAIL, formatValidationResult(result)])
      }
    } else {
      rows.push(['Config schema', PASS, 'No schema declared'])
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    rows.push(['Config schema', FAIL, msg])
  }

  try {
    await outputTable(rows, 'Doctor Report')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    error(msg)
  }
}
