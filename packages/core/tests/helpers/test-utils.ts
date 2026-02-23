import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

let counter = 0

export function createTempDir(prefix = 'semo-test'): string {
  const dir = path.resolve(os.tmpdir(), `${prefix}-${Date.now()}-${counter++}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

export function removeTempDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true })
  } catch {}
}

export function writeYaml(
  dir: string,
  filename: string,
  content: string
): string {
  const filePath = path.resolve(dir, filename)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, content)
  return filePath
}

export function writeJson(dir: string, filename: string, obj: any): string {
  const filePath = path.resolve(dir, filename)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(obj, null, 2))
  return filePath
}

export function writeFile(
  dir: string,
  filename: string,
  content: string
): string {
  const filePath = path.resolve(dir, filename)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, content)
  return filePath
}

export function createConfigManagerContext(
  overrides: Record<string, any> = {}
): any {
  return {
    scriptName: 'semo',
    parsedArgv: {},
    _cachedAppConfig: null,
    _rcFileCache: new Map(),
    debugCore: () => {},
    allPlugins: {},
    getApplicationConfig: () => ({}),
    getAllPluginsMapping: async () => ({}),
    ...overrides,
  }
}

export function createCommandLoaderContext(
  overrides: Record<string, any> = {}
): any {
  return {
    parsedArgv: {},
    allPlugins: {},
    combinedConfig: { pluginConfigs: {} },
    parsePluginConfig: () => ({}),
    setParsedArgv: () => {},
    ...overrides,
  }
}
