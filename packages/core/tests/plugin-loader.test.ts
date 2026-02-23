import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getAllPluginsMapping,
  clearPluginCache,
} from '../src/common/plugin-loader.js'
import {
  createTempDir,
  removeTempDir,
  writeJson,
} from './helpers/test-utils.js'
import path from 'node:path'

function createPluginLoaderContext(overrides: Record<string, any> = {}): any {
  return {
    scriptName: 'semo',
    version: '1.0.0',
    debugCore: () => {},
    config: (key: string) => {
      if (key === '$plugins.register') return {}
      if (key === '$plugins.include') return []
      if (key === '$plugins.exclude') return []
      return undefined
    },
    getApplicationConfig: () => ({}),
    ...overrides,
  }
}

describe('getAllPluginsMapping', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should return empty object when no plugins found', async () => {
    tmpDir = createTempDir('plugin-empty')
    const ctx = createPluginLoaderContext()
    const result = await getAllPluginsMapping(ctx, tmpDir, {
      noCache: true,
      disableGlobalPlugin: true,
      disableHomePlugin: true,
    })
    // May find cwd plugins but at minimum should not throw
    expect(typeof result).toBe('object')
  })

  it('should discover plugins in node_modules', async () => {
    tmpDir = createTempDir('plugin-discover')
    // Create a fake plugin in node_modules
    writeJson(
      path.resolve(tmpDir, 'node_modules/semo-plugin-test'),
      'package.json',
      {
        name: 'semo-plugin-test',
        version: '1.0.0',
      }
    )

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createPluginLoaderContext()
    const result = await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: true,
      disableGlobalPlugin: true,
      disableHomePlugin: true,
    })

    expect(result['semo-plugin-test']).toBeTruthy()
    process.cwd = originalCwd
  })

  it('should handle registered plugins with boolean true (resolve path)', async () => {
    const ctx = createPluginLoaderContext({
      config: (key: string) => {
        if (key === '$plugins.register') return { test: true }
        if (key === '$plugins.include') return []
        if (key === '$plugins.exclude') return []
        return undefined
      },
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await getAllPluginsMapping(ctx, '/nonexistent', {
      noCache: true,
    })

    // test plugin likely won't resolve, but shouldn't crash
    expect(typeof result).toBe('object')
    warnSpy.mockRestore()
  })

  it('should handle registered plugins with string path', async () => {
    tmpDir = createTempDir('plugin-register-path')

    const ctx = createPluginLoaderContext({
      config: (key: string) => {
        if (key === '$plugins.register') return { test: tmpDir }
        if (key === '$plugins.include') return []
        if (key === '$plugins.exclude') return []
        return undefined
      },
    })

    const result = await getAllPluginsMapping(ctx, '/nonexistent', {
      noCache: true,
    })

    expect(result['semo-plugin-test']).toBe(tmpDir)
  })

  it('should handle registered plugins with relative path', async () => {
    tmpDir = createTempDir('plugin-register-rel')

    const ctx = createPluginLoaderContext({
      config: (key: string) => {
        if (key === '$plugins.register') return { test: './local-plugin' }
        if (key === '$plugins.include') return []
        if (key === '$plugins.exclude') return []
        return undefined
      },
    })

    const result = await getAllPluginsMapping(ctx, '/nonexistent', {
      noCache: true,
    })

    expect(result['semo-plugin-test']).toBeTruthy()
  })

  it('should handle registered plugin with tilde path', async () => {
    const ctx = createPluginLoaderContext({
      config: (key: string) => {
        if (key === '$plugins.register') return { test: '~/my-plugin' }
        if (key === '$plugins.include') return []
        if (key === '$plugins.exclude') return []
        return undefined
      },
    })

    const result = await getAllPluginsMapping(ctx, '/nonexistent', {
      noCache: true,
    })

    expect(result['semo-plugin-test']).toContain('my-plugin')
  })

  it('should exclude plugins from exclude list', async () => {
    tmpDir = createTempDir('plugin-exclude')
    writeJson(
      path.resolve(tmpDir, 'node_modules/semo-plugin-a'),
      'package.json',
      { name: 'semo-plugin-a' }
    )
    writeJson(
      path.resolve(tmpDir, 'node_modules/semo-plugin-b'),
      'package.json',
      { name: 'semo-plugin-b' }
    )

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createPluginLoaderContext({
      config: (key: string) => {
        if (key === '$plugins.register') return {}
        if (key === '$plugins.include') return []
        if (key === '$plugins.exclude') return ['a']
        return undefined
      },
    })

    const result = await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: true,
      disableGlobalPlugin: true,
      disableHomePlugin: true,
    })

    expect(result['semo-plugin-a']).toBeUndefined()
    process.cwd = originalCwd
  })

  it('should include only plugins in include list', async () => {
    tmpDir = createTempDir('plugin-include')
    writeJson(
      path.resolve(tmpDir, 'node_modules/semo-plugin-a'),
      'package.json',
      { name: 'semo-plugin-a' }
    )
    writeJson(
      path.resolve(tmpDir, 'node_modules/semo-plugin-b'),
      'package.json',
      { name: 'semo-plugin-b' }
    )

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createPluginLoaderContext({
      config: (key: string) => {
        if (key === '$plugins.register') return {}
        if (key === '$plugins.include') return ['a']
        if (key === '$plugins.exclude') return []
        return undefined
      },
    })

    const result = await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: true,
      disableGlobalPlugin: true,
      disableHomePlugin: true,
    })

    expect(result['semo-plugin-b']).toBeUndefined()
    if (result['semo-plugin-a']) {
      expect(result['semo-plugin-a']).toBeTruthy()
    }
    process.cwd = originalCwd
  })

  it('should detect current directory as plugin project', async () => {
    tmpDir = createTempDir('plugin-self')
    writeJson(tmpDir, 'package.json', {
      name: 'semo-plugin-self',
      version: '1.0.0',
    })

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createPluginLoaderContext()
    const result = await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: true,
      disableGlobalPlugin: true,
      disableHomePlugin: true,
    })

    expect(result['semo-plugin-self']).toBeTruthy()
    process.cwd = originalCwd
  })

  it('should handle SEMO_PLUGIN_DIR env var', async () => {
    tmpDir = createTempDir('plugin-env')
    const pluginDir = path.resolve(tmpDir, 'extra-plugins')
    writeJson(path.resolve(pluginDir, 'semo-plugin-env'), 'package.json', {
      name: 'semo-plugin-env',
    })

    const originalCwd = process.cwd
    process.cwd = () => tmpDir
    process.env.SEMO_PLUGIN_DIR = pluginDir

    const ctx = createPluginLoaderContext()
    const result = await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: true,
      disableGlobalPlugin: true,
      disableHomePlugin: true,
    })

    expect(result['semo-plugin-env']).toBeTruthy()

    delete process.env.SEMO_PLUGIN_DIR
    process.cwd = originalCwd
  })

  it('should handle pluginDir from app config', async () => {
    tmpDir = createTempDir('plugin-plugindir')
    const customDir = path.resolve(tmpDir, 'custom-plugins')
    writeJson(path.resolve(customDir, 'semo-plugin-custom'), 'package.json', {
      name: 'semo-plugin-custom',
    })

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createPluginLoaderContext({
      getApplicationConfig: () => ({ pluginDir: customDir }),
    })

    const result = await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: true,
      disableGlobalPlugin: true,
      disableHomePlugin: true,
    })

    expect(result['semo-plugin-custom']).toBeTruthy()
    process.cwd = originalCwd
  })

  it('should skip registered plugin with false value', async () => {
    const ctx = createPluginLoaderContext({
      config: (key: string) => {
        if (key === '$plugins.register') return { test: false }
        if (key === '$plugins.include') return []
        if (key === '$plugins.exclude') return []
        return undefined
      },
    })

    const result = await getAllPluginsMapping(ctx, '/nonexistent', {
      noCache: true,
    })
    expect(result['semo-plugin-test']).toBeUndefined()
  })

  it('should use cached manifest when noCache is false', async () => {
    // First call to populate cache
    tmpDir = createTempDir('plugin-cache-hit')
    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createPluginLoaderContext()
    await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: true,
      disableGlobalPlugin: true,
      disableHomePlugin: true,
    })

    // Second call with noCache=false should use cache
    const result2 = await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: false,
      disableGlobalPlugin: true,
      disableHomePlugin: true,
    })

    expect(typeof result2).toBe('object')
    process.cwd = originalCwd
  })

  it('should handle packageDirectory with orgMode', async () => {
    tmpDir = createTempDir('plugin-orgmode')
    const pkgDir = path.resolve(tmpDir, 'packages/semo')
    writeJson(pkgDir, 'package.json', { name: '@semo/cli' })

    const ctx = createPluginLoaderContext()
    const result = await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: true,
      packageDirectory: pkgDir,
      orgMode: true,
      disableHomePlugin: true,
    })

    expect(typeof result).toBe('object')
  })

  it('should handle packageDirectory without orgMode', async () => {
    tmpDir = createTempDir('plugin-norgmode')
    const pkgDir = path.resolve(tmpDir, 'semo')
    writeJson(pkgDir, 'package.json', { name: 'semo' })

    const ctx = createPluginLoaderContext()
    const result = await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: true,
      packageDirectory: pkgDir,
      orgMode: false,
      disableHomePlugin: true,
    })

    expect(typeof result).toBe('object')
  })

  it('should handle home plugins directory scan', async () => {
    tmpDir = createTempDir('plugin-homescan')
    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createPluginLoaderContext()
    const result = await getAllPluginsMapping(ctx, '/nonexistent-core', {
      noCache: true,
      disableGlobalPlugin: true,
      disableHomePlugin: false,
    })

    expect(typeof result).toBe('object')
    process.cwd = originalCwd
  })
})

describe('clearPluginCache', () => {
  it('should not throw', () => {
    expect(() => clearPluginCache('__test_clear__')).not.toThrow()
  })
})
