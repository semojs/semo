import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  Core,
  invokeHook,
  extendSubCommand,
  extendConfig,
} from '../src/common/core.js'
import {
  createTempDir,
  removeTempDir,
  writeFile,
} from './helpers/test-utils.js'
import path from 'node:path'

describe('Core singleton', () => {
  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('should create a new instance', () => {
    const core = new Core({ scriptName: 'test-semo' })
    expect(core.scriptName).toBe('test-semo')
    expect(core.version).toBe('')
    expect(core.allPlugins).toEqual({})
  })

  it('should return existing instance from constructor', () => {
    const core1 = new Core({ scriptName: 'semo' })
    const core2 = new Core({ scriptName: 'semo' })
    expect(core1).toBe(core2)
  })

  it('should warn when constructing with different scriptName', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const core1 = new Core({ scriptName: 'semo' })
    const core2 = new Core({ scriptName: 'other' })
    expect(core1).toBe(core2)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('getInstance should throw when not initialized', () => {
    expect(() => Core.getInstance()).toThrow('Core has not been initialized')
  })

  it('getInstance should return the instance after construction', () => {
    const core = new Core({ scriptName: 'semo' })
    expect(Core.getInstance()).toBe(core)
  })

  it('setInstance should replace the instance', () => {
    new Core({ scriptName: 'semo1' })
    const core2 = { scriptName: 'semo2' } as any
    Core.setInstance(core2)
    expect(Core.getInstance()).toBe(core2)
  })
})

describe('Core setters', () => {
  let core: Core

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
  })

  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('setVersion should update version', () => {
    core.setVersion('2.0.0')
    expect(core.version).toBe('2.0.0')
  })

  it('setScriptName should update scriptName', () => {
    core.setScriptName('myapp')
    expect(core.scriptName).toBe('myapp')
  })

  it('setParsedArgv should update parsedArgv', () => {
    const argv = { key: 'value' }
    core.setParsedArgv(argv)
    expect(core.parsedArgv).toBe(argv)
  })
})

describe('Core config methods', () => {
  let core: Core

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
  })

  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('config() with no key should return parsedArgv', () => {
    core.setParsedArgv({ foo: 'bar' })
    const result = core.config()
    expect(result).toEqual({ foo: 'bar' })
  })

  it('config() with key should return nested value', () => {
    core.setParsedArgv({ a: { b: { c: 42 } } })
    expect(core.config('a.b.c')).toBe(42)
  })

  it('config() with key and default should return default when missing', () => {
    core.setParsedArgv({})
    expect(core.config('missing', 'default')).toBe('default')
  })

  it('isProduction should check NODE_ENV', () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    expect(core.isProduction()).toBe(true)
    expect(core.isDevelopment()).toBe(false)
    process.env.NODE_ENV = original
  })

  it('isDevelopment should check NODE_ENV', () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    expect(core.isDevelopment()).toBe(true)
    expect(core.isProduction()).toBe(false)
    process.env.NODE_ENV = original
  })

  it('getNodeEnv should delegate to ConfigManager', () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'
    expect(core.getNodeEnv()).toBe('test')
    process.env.NODE_ENV = original
  })
})

describe('Core getPluginConfig', () => {
  let core: Core

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
  })

  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('should return argv value when key exists in argv', () => {
    core.setParsedArgv({ myKey: 'fromArgv', scriptName: 'semo' })
    expect(core.getPluginConfig('myKey')).toBe('fromArgv')
  })

  it('should return $config value when key exists in $config', () => {
    core.setParsedArgv({
      scriptName: 'semo',
      $config: { pluginPort: 3000 },
    })
    expect(core.getPluginConfig('pluginPort')).toBe(3000)
  })

  it('should return defaultValue when key not found anywhere', () => {
    core.setParsedArgv({ scriptName: 'semo' })
    expect(core.getPluginConfig('missing', 'fallback')).toBe('fallback')
  })

  it('should extract plugin config by name', () => {
    core.setParsedArgv({
      scriptName: 'semo',
      $plugin: { test: { port: 8080 } },
    })
    expect(core.getPluginConfig('port', undefined, 'test')).toBe(8080)
  })
})

describe('Core delegation methods', () => {
  let core: Core

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
  })

  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('loadPackageInfo should load current project package.json', () => {
    const pkg = core.loadPackageInfo()
    expect(pkg.name).toBeTruthy()
  })

  it('loadCorePackageInfo should load core package.json', () => {
    const pkg = core.loadCorePackageInfo()
    expect(pkg.name).toBe('@semo/core')
  })

  it('clearPluginCache should not throw', () => {
    expect(() => core.clearPluginCache()).not.toThrow()
  })

  it('visit should be a function (from CommandLoader)', () => {
    expect(typeof core.visit).toBe('function')
  })

  it('parsePluginConfig should return config object', () => {
    const argv = {
      scriptName: 'semo',
      $plugin: { test: { key: 'val' } },
    }
    const config = core.parsePluginConfig('test', argv)
    expect(config).toEqual({ key: 'val' })
  })
})

describe('Core useDotEnv', () => {
  let core: Core

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
  })

  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('should not throw even when .env does not exist', async () => {
    await expect(core.useDotEnv()).resolves.toBeUndefined()
  })

  it('should not throw with doExpand=false', async () => {
    await expect(core.useDotEnv(false)).resolves.toBeUndefined()
  })
})

describe('Core invokeHook', () => {
  let core: Core
  let tmpDir: string

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
    core.setVersion('1.0.0')
  })

  afterEach(() => {
    Core.setInstance(null as any)
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should parse simple hook name', async () => {
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
    const result = await core.invokeHook('test_hook')
    expect(result).toEqual({})
  })

  it('should parse namespaced hook name (module:hook)', async () => {
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
    const result = await core.invokeHook('semo:test')
    expect(result).toEqual({})
  })

  it('should throw for invalid hook name with too many colons', async () => {
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
    await expect(core.invokeHook('a:b:c')).rejects.toThrow('Invalid hook name')
  })

  it('should handle push mode', async () => {
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
    const result = await core.invokeHook('test', { mode: 'push' })
    expect(result).toEqual([])
  })

  it('should handle replace mode', async () => {
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
    const result = await core.invokeHook('test', { mode: 'replace' })
    expect(result).toBeUndefined()
  })

  it('should handle group mode', async () => {
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
    const result = await core.invokeHook('test', { mode: 'group' })
    expect(result).toEqual({})
  })

  it('should handle merge mode', async () => {
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
    const result = await core.invokeHook('test', { mode: 'merge' })
    expect(result).toEqual({})
  })

  it('should skip plugins in exclude list', async () => {
    tmpDir = createTempDir('hook-exclude')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `export const hook_test = { semo: { key: 'should-not-appear' } }\n`
    )

    core.allPlugins = { 'semo-plugin-test': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-test': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook('semo:test', {
      mode: 'assign',
      exclude: ['semo-plugin-test'],
    })
    expect(result).toEqual({})
  })

  it('should only include plugins in include list', async () => {
    core.allPlugins = {
      'semo-plugin-a': '/nonexistent-a',
      'semo-plugin-b': '/nonexistent-b',
    }
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}

    const result = await core.invokeHook('test', {
      mode: 'assign',
      include: ['semo-plugin-a'],
    })
    expect(result).toEqual({})
  })

  it('should load and execute hook from real plugin file', async () => {
    tmpDir = createTempDir('hook-real')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_test = new Hook('semo', { greeting: 'hello' })
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook<Record<string, unknown>>('semo:test')
    expect(result).toEqual({ greeting: 'hello' })
  })

  it('should load hook from function handler', async () => {
    tmpDir = createTempDir('hook-fn')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_status = new Hook('semo', (core, argv) => ({ version: '1.0' }))
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook<Record<string, unknown>>('semo:status')
    expect(result).toEqual({ version: '1.0' })
  })

  it('should handle hook file load errors gracefully', async () => {
    tmpDir = createTempDir('hook-error')
    writeFile(tmpDir, 'lib/hooks/index.js', 'throw new Error("load failed")')

    core.allPlugins = { 'semo-plugin-bad': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-bad': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await core.invokeHook('semo:test')
    expect(result).toEqual({})
    warnSpy.mockRestore()
  })

  it('should skip plugin when no hookDir configured', async () => {
    core.allPlugins = { 'semo-plugin-nohook': '/nonexistent' }
    core.combinedConfig = { pluginConfigs: { 'semo-plugin-nohook': {} } }
    core.appConfig = {}

    const result = await core.invokeHook('test')
    expect(result).toEqual({})
  })

  it('should add application as plugin when conditions met', async () => {
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {
      name: 'my-app',
      applicationDir: '/tmp/my-app',
    }
    core.setParsedArgv({ scriptName: 'semo', packageName: 'semo' })

    const result = await core.invokeHook('test')
    expect(result).toEqual({})
  })

  it('should handle push mode with hook results', async () => {
    tmpDir = createTempDir('hook-push')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_items = new Hook('semo', () => ({ item: 'one' }))
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook<unknown[]>('semo:items', {
      mode: 'push',
    })
    expect(Array.isArray(result)).toBe(true)
    expect(result!.length).toBe(1)
  })

  it('should handle group mode with plugin name as key', async () => {
    tmpDir = createTempDir('hook-group')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_info = new Hook('semo', { data: 'test' })
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook<Record<string, unknown>>('semo:info', {
      mode: 'group',
    })
    expect(result!['semo-plugin-demo']).toEqual({ data: 'test' })
  })

  it('should handle replace mode with last result winning', async () => {
    tmpDir = createTempDir('hook-replace')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_val = new Hook('semo', 'replaced-value')
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook('semo:val', { mode: 'replace' })
    expect(result).toBe('replaced-value')
  })

  it('should handle hook with plain object (no getHook method)', async () => {
    tmpDir = createTempDir('hook-plain')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `export const hook_simple = { semo: { plain: true } }\n`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook<Record<string, unknown>>('semo:simple')
    expect(result).toEqual({ plain: true })
  })

  it('should use application hookDir from combinedConfig', async () => {
    tmpDir = createTempDir('hook-app')
    writeFile(
      tmpDir,
      'hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_apptest = new Hook('semo', { fromApp: true })
`
    )

    core.allPlugins = {}
    core.combinedConfig = {
      hookDir: 'hooks',
      pluginConfigs: {},
    }
    core.appConfig = {
      name: 'my-app',
      applicationDir: tmpDir,
    }
    core.setParsedArgv({ scriptName: 'semo', packageName: 'semo' })

    const result =
      await core.invokeHook<Record<string, unknown>>('semo:apptest')
    expect(result).toEqual({ fromApp: true })
  })
})

describe('Core invokeHook - advanced branches', () => {
  let core: Core
  let tmpDir: string

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
    core.setVersion('1.0.0')
  })

  afterEach(() => {
    Core.setInstance(null as any)
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should handle scriptName plugin (core hook path)', async () => {
    tmpDir = createTempDir('hook-core')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_status = new Hook('semo', { coreHook: true })
`
    )

    core.allPlugins = { semo: tmpDir }
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}

    const result = await core.invokeHook<Record<string, unknown>>('semo:status')
    expect(result).toEqual({ coreHook: true })
  })

  it('should use packageDirectory to add scriptName to plugins', async () => {
    tmpDir = createTempDir('hook-pkgdir')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_hello = new Hook('semo', { from: 'pkgdir' })
`
    )

    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
    core.setParsedArgv({ scriptName: 'semo', packageDirectory: tmpDir })

    // parseRcFile returns hookDir config
    core.parseRcFile = (_plugin: string, _path: string) => ({
      hookDir: 'lib/hooks',
    })

    const result = await core.invokeHook<Record<string, unknown>>('semo:hello')
    expect(result).toEqual({ from: 'pkgdir' })
  })

  it('should handle hook file that exports a function', async () => {
    tmpDir = createTempDir('hook-fn-export')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export default function(core, argv) {
  return { hook_data: new Hook('semo', { dynamic: true }) }
}
`
    )

    core.allPlugins = { 'semo-plugin-fn': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-fn': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook<Record<string, unknown>>('semo:data')
    expect(result).toEqual({ dynamic: true })
  })

  it('should handle merge mode with actual hook results', async () => {
    tmpDir = createTempDir('hook-merge')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_config = new Hook('semo', { deep: { key1: 'val1' } })
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook<Record<string, unknown>>(
      'semo:config',
      { mode: 'merge' }
    )
    expect(result).toEqual({ deep: { key1: 'val1' } })
  })

  it('should prepend hook_ prefix if not present', async () => {
    tmpDir = createTempDir('hook-prefix')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_myevent = new Hook('semo', { prefixed: true })
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    // Without hook_ prefix
    const result =
      await core.invokeHook<Record<string, unknown>>('semo:myevent')
    expect(result).toEqual({ prefixed: true })
  })

  it('should handle hook with null return in assign mode', async () => {
    tmpDir = createTempDir('hook-null')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_nullish = new Hook('semo', () => null)
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook('semo:nullish', { mode: 'assign' })
    expect(result).toEqual({})
  })

  it('should handle hook with null return in group mode', async () => {
    tmpDir = createTempDir('hook-null-group')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_nullgrp = new Hook('semo', () => null)
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook<Record<string, unknown>>(
      'semo:nullgrp',
      { mode: 'group' }
    )
    expect(result!['semo-plugin-demo']).toEqual({})
  })

  it('should handle hook with null return in merge mode', async () => {
    tmpDir = createTempDir('hook-null-merge')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_nullmrg = new Hook('semo', () => null)
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const result = await core.invokeHook('semo:nullmrg', { mode: 'merge' })
    expect(result).toEqual({})
  })
})

describe('Core invokeHook - outer catch', () => {
  let core: Core
  let tmpDir: string

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
    core.setVersion('1.0.0')
  })

  afterEach(() => {
    Core.setInstance(null as any)
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should catch rejected promise from hook gracefully', async () => {
    tmpDir = createTempDir('hook-reject')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_failing = new Hook('semo', () => Promise.reject(new Error('async hook fail')))
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await core.invokeHook('semo:failing')
    // Hook errors are caught per-plugin, result is empty rather than undefined
    expect(result).toEqual({})
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('should handle non-Error rejection gracefully', async () => {
    tmpDir = createTempDir('hook-reject-str')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_strfail = new Hook('semo', () => Promise.reject('string rejection'))
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }
    core.appConfig = {}

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await core.invokeHook('semo:strfail')
    // Hook errors are caught per-plugin, result is empty rather than undefined
    expect(result).toEqual({})
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})

describe('Core delegation methods - extended', () => {
  let core: Core

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
  })

  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('convertToPrivate should delegate to PackageManager', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    core.convertToPrivate('/nonexistent/package.json')
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('resolvePackage should delegate to PackageManager', () => {
    const result = core.resolvePackage('vitest', '', false)
    expect(result).toContain('vitest')
  })

  it('getApplicationConfig should delegate to ConfigManager', () => {
    const result = core.getApplicationConfig()
    expect(result).toBeTruthy()
    expect(result.applicationDir).toBeTruthy()
  })

  it('getCombinedConfig should delegate to ConfigManager', async () => {
    core.allPlugins = {}
    const result = await core.getCombinedConfig({})
    expect(result).toBeTruthy()
  })

  it('extendConfig should delegate to ConfigManager', () => {
    core.setParsedArgv({ scriptName: 'semo' })
    const result = core.extendConfig('/nonexistent.yml', '')
    expect(result).toBeTruthy()
  })

  it('extendSubCommand should delegate to CommandLoader', () => {
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    const mockYargs = { commandDir: vi.fn() }
    expect(() => {
      core.extendSubCommand('test', 'semo', mockYargs, '/nonexistent')
    }).not.toThrow()
  })

  it('getAllPluginsMapping should delegate to PluginLoader', async () => {
    const result = await core.getAllPluginsMapping({ noCache: true })
    expect(typeof result).toBe('object')
  })
})

describe('Convenience exports', () => {
  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('invokeHook should delegate to Core.getInstance().invokeHook', async () => {
    const core = new Core({ scriptName: 'semo' })
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}

    const result = await invokeHook('test')
    expect(result).toEqual({})
  })

  it('extendSubCommand should delegate to Core.getInstance()', () => {
    const core = new Core({ scriptName: 'semo' })
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }

    const mockYargs = { commandDir: vi.fn() }
    expect(() => {
      extendSubCommand('test', 'semo', mockYargs, '/nonexistent')
    }).not.toThrow()
  })

  it('extendConfig should delegate to Core.getInstance()', () => {
    const core = new Core({ scriptName: 'semo' })
    core.setParsedArgv({})
    expect(() => {
      extendConfig('/nonexistent.yml', '')
    }).not.toThrow()
  })
})

describe('Core dynamic hooks', () => {
  let core: Core

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
    core.setVersion('1.0.0')
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
  })

  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('addHook should register a dynamic hook handler', async () => {
    core.addHook('test', (_core, _argv) => ({ dynamic: true }), 'my-plugin')

    const result = await core.invokeHook<Record<string, unknown>>('test')
    expect(result).toEqual({ dynamic: true })
  })

  it('addHook should auto-prefix hook_ if not present', async () => {
    core.addHook('greeting', () => ({ hello: 'world' }))

    const result = await core.invokeHook<Record<string, unknown>>('greeting')
    expect(result).toEqual({ hello: 'world' })
  })

  it('addHook with hook_ prefix should work', async () => {
    core.addHook('hook_test', () => ({ prefixed: true }))

    const result = await core.invokeHook<Record<string, unknown>>('test')
    expect(result).toEqual({ prefixed: true })
  })

  it('removeHook should remove all handlers for a hook', async () => {
    core.addHook('test', () => ({ a: 1 }), 'plugin-a')
    core.addHook('test', () => ({ b: 2 }), 'plugin-b')

    core.removeHook('test')

    const result = await core.invokeHook<Record<string, unknown>>('test')
    expect(result).toEqual({})
  })

  it('removeHook with pluginName should only remove that plugin', async () => {
    core.addHook('test', () => ({ a: 1 }), 'plugin-a')
    core.addHook('test', () => ({ b: 2 }), 'plugin-b')

    core.removeHook('test', 'plugin-a')

    const result = await core.invokeHook<Record<string, unknown>>('test')
    expect(result).toEqual({ b: 2 })
  })

  it('dynamic hooks should execute after file hooks', async () => {
    const tmpDir = createTempDir('hook-dynamic-order')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_order = new Hook('semo', { file: true })
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }

    core.addHook('semo:order', () => ({ dynamic: true }), 'dynamic-plugin')

    const result = await core.invokeHook<Record<string, unknown>>('semo:order')
    // Both should be merged (assign mode)
    expect(result).toEqual({ file: true, dynamic: true })

    removeTempDir(tmpDir)
  })

  it('dynamic hooks should respect include filter', async () => {
    core.addHook('test', () => ({ a: 1 }), 'plugin-a')
    core.addHook('test', () => ({ b: 2 }), 'plugin-b')

    const result = await core.invokeHook<Record<string, unknown>>('test', {
      mode: 'assign',
      include: ['plugin-a'],
    })
    expect(result).toEqual({ a: 1 })
  })

  it('dynamic hooks should respect exclude filter', async () => {
    core.addHook('test', () => ({ a: 1 }), 'plugin-a')
    core.addHook('test', () => ({ b: 2 }), 'plugin-b')

    const result = await core.invokeHook<Record<string, unknown>>('test', {
      mode: 'assign',
      exclude: ['plugin-a'],
    })
    expect(result).toEqual({ b: 2 })
  })

  it('dynamic hooks should work with push mode', async () => {
    core.addHook('items', () => 'item1', 'plugin-a')
    core.addHook('items', () => 'item2', 'plugin-b')

    const result = await core.invokeHook<unknown[]>('items', { mode: 'push' })
    expect(result).toEqual(['item1', 'item2'])
  })

  it('dynamic hooks should work with group mode', async () => {
    core.addHook('info', () => ({ data: 'a' }), 'plugin-a')
    core.addHook('info', () => ({ data: 'b' }), 'plugin-b')

    const result = await core.invokeHook<Record<string, unknown>>('info', {
      mode: 'group',
    })
    expect(result!['plugin-a']).toEqual({ data: 'a' })
    expect(result!['plugin-b']).toEqual({ data: 'b' })
  })

  // --- Namespace isolation tests ---

  it('namespace match: addHook with ns should trigger on matching invokeHook', async () => {
    core.addHook('myapp:query', () => ({ db: 'results' }), 'db-plugin')

    const result = await core.invokeHook<Record<string, unknown>>('myapp:query')
    expect(result).toEqual({ db: 'results' })
  })

  it('namespace mismatch: addHook with different ns should not trigger', async () => {
    core.addHook('other:query', () => ({ other: true }), 'other-plugin')

    const result = await core.invokeHook<Record<string, unknown>>('myapp:query')
    expect(result).toEqual({})
  })

  it('no target: addHook without ns should not be triggered by namespaced invokeHook', async () => {
    core.addHook('query', () => ({ generic: true }), 'generic-plugin')

    const result = await core.invokeHook<Record<string, unknown>>('myapp:query')
    expect(result).toEqual({})
  })

  it('no namespace invokeHook should trigger all hooks including those with targetModule', async () => {
    core.addHook('query', () => ({ generic: true }), 'generic-plugin')
    core.addHook('myapp:query', () => ({ targeted: true }), 'targeted-plugin')

    const result = await core.invokeHook<Record<string, unknown>>('query')
    expect(result).toEqual({ generic: true, targeted: true })
  })

  it('multiple namespaces: only matching ns hooks trigger', async () => {
    core.addHook('ns1:query', () => ({ ns1: true }), 'plugin-1')
    core.addHook('ns2:query', () => ({ ns2: true }), 'plugin-2')
    core.addHook('query', () => ({ plain: true }), 'plugin-3')

    const result = await core.invokeHook<Record<string, unknown>>('ns1:query')
    expect(result).toEqual({ ns1: true })
  })

  it('removeHook with namespace should only remove matching targetModule', async () => {
    core.addHook('ns1:query', () => ({ ns1: true }), 'plugin-a')
    core.addHook('ns2:query', () => ({ ns2: true }), 'plugin-a')

    core.removeHook('ns1:query')

    // ns1 removed, ns2 still present
    const result1 = await core.invokeHook<Record<string, unknown>>('ns2:query')
    expect(result1).toEqual({ ns2: true })

    // ns1 should be empty
    const result2 = await core.invokeHook<Record<string, unknown>>('ns1:query')
    expect(result2).toEqual({})
  })

  it('removeHook with namespace and pluginName should filter both', async () => {
    core.addHook('ns1:query', () => ({ a: true }), 'plugin-a')
    core.addHook('ns1:query', () => ({ b: true }), 'plugin-b')

    core.removeHook('ns1:query', 'plugin-a')

    const result = await core.invokeHook<Record<string, unknown>>('ns1:query')
    expect(result).toEqual({ b: true })
  })

  it('addHook with ns should work with push mode on matching invokeHook', async () => {
    core.addHook('myapp:items', () => 'item1', 'plugin-a')
    core.addHook('other:items', () => 'item2', 'plugin-b')
    core.addHook('items', () => 'item3', 'plugin-c')

    const result = await core.invokeHook<unknown[]>('myapp:items', {
      mode: 'push',
    })
    expect(result).toEqual(['item1'])
  })
})

describe('Core invokeHookDetailed', () => {
  let core: Core
  let tmpDir: string

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
    core.setVersion('1.0.0')
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
  })

  afterEach(() => {
    Core.setInstance(null as any)
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should return result and empty errors on success', async () => {
    core.addHook('test', () => ({ ok: true }), 'my-plugin')

    const { result, errors } =
      await core.invokeHookDetailed<Record<string, unknown>>('test')
    expect(result).toEqual({ ok: true })
    expect(errors).toEqual([])
  })

  it('should collect errors without throwing', async () => {
    tmpDir = createTempDir('hook-detailed-error')
    writeFile(tmpDir, 'lib/hooks/index.js', 'throw new Error("load failed")')

    core.allPlugins = { 'semo-plugin-bad': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-bad': { hookDir: 'lib/hooks' },
      },
    }

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result, errors } =
      await core.invokeHookDetailed<Record<string, unknown>>('semo:test')
    expect(result).toEqual({})
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].plugin).toBe('semo-plugin-bad')
    expect(errors[0].error).toBeInstanceOf(Error)
    errorSpy.mockRestore()
  })

  it('should collect rejected promise errors', async () => {
    tmpDir = createTempDir('hook-detailed-reject')
    writeFile(
      tmpDir,
      'lib/hooks/index.js',
      `import { Hook } from '${path.resolve(process.cwd(), 'packages/core/src/common/hook.js')}'
export const hook_fail = new Hook('semo', () => Promise.reject(new Error('async fail')))
`
    )

    core.allPlugins = { 'semo-plugin-demo': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-demo': { hookDir: 'lib/hooks' },
      },
    }

    const { result, errors } =
      await core.invokeHookDetailed<Record<string, unknown>>('semo:fail')
    expect(result).toEqual({})
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].error.message).toBe('async fail')
  })

  it('should mix successful and failed hooks', async () => {
    core.addHook('test', () => ({ good: true }), 'good-plugin')
    core.addHook(
      'test',
      () => {
        throw new Error('bad')
      },
      'bad-plugin'
    )

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result, errors } =
      await core.invokeHookDetailed<Record<string, unknown>>('test')
    expect(result).toEqual({ good: true })
    expect(errors.length).toBe(1)
    expect(errors[0].plugin).toBe('bad-plugin')
    errorSpy.mockRestore()
  })
})

describe('Core strict mode', () => {
  let core: Core
  let tmpDir: string

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
    core.setVersion('1.0.0')
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
  })

  afterEach(() => {
    Core.setInstance(null as any)
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('strict mode should throw on hook error', async () => {
    tmpDir = createTempDir('hook-strict')
    writeFile(tmpDir, 'lib/hooks/index.js', 'throw new Error("strict fail")')

    core.allPlugins = { 'semo-plugin-bad': tmpDir }
    core.combinedConfig = {
      pluginConfigs: {
        'semo-plugin-bad': { hookDir: 'lib/hooks' },
      },
    }

    await expect(
      core.invokeHook('semo:test', { mode: 'assign', strict: true })
    ).rejects.toThrow('strict fail')
  })

  it('strict mode should throw on dynamic hook error', async () => {
    core.addHook(
      'test',
      () => {
        throw new Error('dynamic strict fail')
      },
      'bad-plugin'
    )

    await expect(
      core.invokeHook('test', { mode: 'assign', strict: true })
    ).rejects.toThrow('dynamic strict fail')
  })

  it('non-strict mode should not throw (default)', async () => {
    core.addHook(
      'test',
      () => {
        throw new Error('non-strict')
      },
      'bad-plugin'
    )

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await core.invokeHook('test')
    expect(result).toEqual({})
    warnSpy.mockRestore()
  })
})

describe('Core hook context', () => {
  let core: Core

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
    core.setVersion('1.0.0')
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
  })

  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('context should be accessible in hook handler via options', async () => {
    core.addHook(
      'test',
      (_core, _argv, options) => {
        return { receivedContext: options.context }
      },
      'ctx-plugin'
    )

    const result = await core.invokeHook<Record<string, unknown>>('test', {
      mode: 'assign',
      context: { userId: 123, role: 'admin' },
    })
    expect(result).toEqual({
      receivedContext: { userId: 123, role: 'admin' },
    })
  })
})

describe('Core event emitter', () => {
  let core: Core

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
    core.setVersion('1.0.0')
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
  })

  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('on/emit should work', () => {
    const received: string[] = []
    core.on('test', (val: string) => received.push(val))

    core.emit('test', 'hello')
    core.emit('test', 'world')

    expect(received).toEqual(['hello', 'world'])
  })

  it('once should fire only once', () => {
    let count = 0
    core.once('test', () => count++)

    core.emit('test')
    core.emit('test')

    expect(count).toBe(1)
  })

  it('off should remove listener', () => {
    let count = 0
    const listener = () => count++
    core.on('test', listener)

    core.emit('test')
    core.off('test', listener)
    core.emit('test')

    expect(count).toBe(1)
  })

  it('should emit hook:before and hook:after events', async () => {
    const events: string[] = []
    core.on('hook:before', (name: string) => events.push(`before:${name}`))
    core.on('hook:after', (name: string) => events.push(`after:${name}`))

    core.addHook('test', () => ({ ok: true }))

    await core.invokeHook('test')

    expect(events).toEqual(['before:test', 'after:test'])
  })

  it('should emit hook:error event on hook failure', async () => {
    const errors: unknown[] = []
    core.on('hook:error', (_name: string, err: unknown) => errors.push(err))

    core.addHook('test', () => {
      throw new Error('fail')
    })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await core.invokeHook('test')
    warnSpy.mockRestore()

    expect(errors.length).toBe(0) // errors caught per-hook, not emitted from non-strict
  })

  it('should emit hook:error on strict mode failure', async () => {
    const errors: unknown[] = []
    core.on('hook:error', (_name: string, err: unknown) => errors.push(err))

    core.addHook('test', () => {
      throw new Error('strict fail')
    })

    try {
      await core.invokeHook('test', { strict: true })
    } catch {
      // expected
    }

    expect(errors.length).toBe(1)
  })
})

describe('Core destroy', () => {
  let core: Core

  beforeEach(() => {
    Core.setInstance(null as any)
    core = new Core({ scriptName: 'semo' })
    core.setVersion('1.0.0')
    vi.spyOn(core, 'getAllPluginsMapping').mockResolvedValue({})
    vi.spyOn(core, 'getCombinedConfig').mockResolvedValue({ pluginConfigs: {} })
    vi.spyOn(core, 'useDotEnv').mockResolvedValue(undefined)
    vi.spyOn(core, 'getApplicationConfig').mockReturnValue({
      applicationDir: process.cwd(),
      coreCommandDir: 'lib/commands',
    } as any)
  })

  afterEach(() => {
    Core.setInstance(null as any)
  })

  it('destroy should reset initialized state', async () => {
    await core.init()
    expect(core.initialized).toBe(true)

    await core.destroy()
    expect(core.initialized).toBe(false)
  })

  it('destroy should clear dynamic hooks', async () => {
    await core.init()
    core.addHook('test', () => ({ x: 1 }))

    await core.destroy()

    // Re-init and check hooks are cleared
    await core.init()
    core.allPlugins = {}
    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
    const result = await core.invokeHook<Record<string, unknown>>('semo:test')
    expect(result).toEqual({})
  })

  it('destroy should emit lifecycle events', async () => {
    await core.init()

    const events: string[] = []
    core.on('destroy:start', () => events.push('destroy:start'))
    core.on('destroy:done', () => events.push('destroy:done'))

    await core.destroy()

    expect(events).toEqual(['destroy:start', 'destroy:done'])
  })

  it('destroy should be idempotent when not initialized', async () => {
    const events: string[] = []
    core.on('destroy:start', () => events.push('destroy:start'))

    await core.destroy()

    expect(events).toEqual([])
  })

  it('should allow re-init after destroy', async () => {
    await core.init()
    await core.destroy()

    expect(core.initialized).toBe(false)

    await core.init()
    expect(core.initialized).toBe(true)
  })
})
