import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'
import {
  createTempDir,
  removeTempDir,
} from '../../../core/tests/helpers/test-utils.js'
import { writeFileSync } from 'node:fs'
import path from 'node:path'

vi.mock('@semo/core', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@semo/core')>()
  return {
    ...orig,
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  }
})

describe('manifest command', () => {
  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/manifest.js')
    expect(mod.command).toBe('manifest')
    expect(mod.plugin).toBe('semo')
    expect(typeof mod.builder).toBe('function')
    expect(typeof mod.handler).toBe('function')
  })
})

describe('manifest/cache handler', () => {
  let handler: typeof import('../../src/commands/manifest/cache.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/manifest/cache.js')
    handler = mod.handler
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/manifest/cache.js')
    expect(mod.command).toEqual(['cache', '$0'])
    expect(mod.plugin).toBe('semo')
  })

  it('calls generateManifest with global option', async () => {
    const { success } = await import('@semo/core')
    const generateManifest = vi
      .fn()
      .mockResolvedValue({ 'semo-plugin-a': '/a' })
    const argv = createMockArgv({
      global: true,
      local: false,
      $core: { generateManifest },
    })
    await handler(argv)
    expect(generateManifest).toHaveBeenCalledWith({
      global: true,
      local: false,
    })
    expect(success).toHaveBeenCalledWith(expect.stringContaining('global'))
    expect(success).toHaveBeenCalledWith(expect.stringContaining('1 plugin'))
  })

  it('calls generateManifest for local by default', async () => {
    const { success } = await import('@semo/core')
    const generateManifest = vi
      .fn()
      .mockResolvedValue({ 'semo-plugin-a': '/a', 'semo-plugin-b': '/b' })
    const argv = createMockArgv({
      global: false,
      local: false,
      $core: { generateManifest },
    })
    await handler(argv)
    expect(generateManifest).toHaveBeenCalledWith({
      global: false,
      local: false,
    })
    expect(success).toHaveBeenCalledWith(expect.stringContaining('local'))
    expect(success).toHaveBeenCalledWith(expect.stringContaining('2 plugin'))
  })

  it('calls generateManifest with local option', async () => {
    const generateManifest = vi
      .fn()
      .mockResolvedValue({ 'semo-plugin-a': '/a' })
    const argv = createMockArgv({
      global: false,
      local: true,
      $core: { generateManifest },
    })
    await handler(argv)
    expect(generateManifest).toHaveBeenCalledWith({
      global: false,
      local: true,
    })
  })

  it('shows info when no plugins found', async () => {
    const { info } = await import('@semo/core')
    const generateManifest = vi.fn().mockResolvedValue({})
    const argv = createMockArgv({
      global: false,
      local: false,
      $core: { generateManifest },
    })
    await handler(argv)
    expect(info).toHaveBeenCalledWith(expect.stringContaining('no plugins'))
  })
})

describe('manifest/list handler', () => {
  let handler: typeof import('../../src/commands/manifest/list.js').handler
  let tmpDir: string

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/manifest/list.js')
    handler = mod.handler
    tmpDir = createTempDir('manifest-list')
  })

  afterEach(() => {
    removeTempDir(tmpDir)
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/manifest/list.js')
    expect(mod.command).toEqual(['list', 'ls'])
    expect(mod.plugin).toBe('semo')
  })

  it('shows not found when no manifests exist', async () => {
    const { info } = await import('@semo/core')
    const argv = createMockArgv({
      $core: {
        getManifestPaths: () => ({
          local: path.resolve(tmpDir, 'semo-plugin-manifest.json'),
          global: path.resolve(tmpDir, 'global-manifest.json'),
        }),
      },
    })
    await handler(argv)
    expect(info).toHaveBeenCalledTimes(2)
    expect(info).toHaveBeenCalledWith(expect.stringContaining('not found'))
  })

  it('shows plugin count when manifest exists', async () => {
    const { info } = await import('@semo/core')
    const localPath = path.resolve(tmpDir, 'semo-plugin-manifest.json')
    writeFileSync(
      localPath,
      JSON.stringify({
        version: '1.0.0',
        timestamp: Date.now(),
        rcHash: 'abc',
        plugins: { 'semo-plugin-a': '/a', 'semo-plugin-b': '/b' },
      })
    )

    const argv = createMockArgv({
      $core: {
        getManifestPaths: () => ({
          local: localPath,
          global: path.resolve(tmpDir, 'nonexistent.json'),
        }),
      },
    })
    await handler(argv)
    expect(info).toHaveBeenCalledWith(expect.stringContaining('2 plugins'))
  })

  it('shows invalid for corrupt manifest', async () => {
    const { info } = await import('@semo/core')
    const localPath = path.resolve(tmpDir, 'semo-plugin-manifest.json')
    writeFileSync(localPath, 'not json')

    const argv = createMockArgv({
      $core: {
        getManifestPaths: () => ({
          local: localPath,
          global: path.resolve(tmpDir, 'nonexistent.json'),
        }),
      },
    })
    await handler(argv)
    expect(info).toHaveBeenCalledWith(expect.stringContaining('invalid'))
  })
})

describe('manifest/cleanup handler', () => {
  let handler: typeof import('../../src/commands/manifest/cleanup.js').handler
  let tmpDir: string

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/manifest/cleanup.js')
    handler = mod.handler
    tmpDir = createTempDir('manifest-cleanup')
  })

  afterEach(() => {
    removeTempDir(tmpDir)
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/manifest/cleanup.js')
    expect(mod.command).toEqual(['cleanup', 'clean'])
    expect(mod.plugin).toBe('semo')
  })

  it('removes local manifest when it exists', async () => {
    const { success } = await import('@semo/core')
    const localPath = path.resolve(tmpDir, 'local-manifest.json')
    writeFileSync(localPath, '{}')

    const clearLocalPluginCache = vi.fn()
    const argv = createMockArgv({
      global: false,
      $core: {
        getManifestPaths: () => ({
          local: localPath,
          global: '/tmp/nonexistent.json',
        }),
        clearLocalPluginCache,
        clearPluginCache: vi.fn(),
      },
    })
    await handler(argv)
    expect(clearLocalPluginCache).toHaveBeenCalled()
    expect(success).toHaveBeenCalledWith('Local manifest removed.')
  })

  it('shows info when local manifest not found', async () => {
    const { info } = await import('@semo/core')
    const argv = createMockArgv({
      global: false,
      $core: {
        getManifestPaths: () => ({
          local: path.resolve(tmpDir, 'nonexistent.json'),
          global: '/tmp/nonexistent.json',
        }),
        clearLocalPluginCache: vi.fn(),
        clearPluginCache: vi.fn(),
      },
    })
    await handler(argv)
    expect(info).toHaveBeenCalledWith(
      'Local manifest not found, nothing to remove.'
    )
  })

  it('removes global manifest when --global and it exists', async () => {
    const { success } = await import('@semo/core')
    const globalPath = path.resolve(tmpDir, 'global-manifest.json')
    writeFileSync(globalPath, '{}')

    const clearPluginCache = vi.fn()
    const argv = createMockArgv({
      global: true,
      $core: {
        getManifestPaths: () => ({
          local: '/tmp/nonexistent.json',
          global: globalPath,
        }),
        clearPluginCache,
        clearLocalPluginCache: vi.fn(),
      },
    })
    await handler(argv)
    expect(clearPluginCache).toHaveBeenCalled()
    expect(success).toHaveBeenCalledWith('Global manifest removed.')
  })

  it('shows info when global manifest not found', async () => {
    const { info } = await import('@semo/core')
    const argv = createMockArgv({
      global: true,
      $core: {
        getManifestPaths: () => ({
          local: '/tmp/nonexistent.json',
          global: path.resolve(tmpDir, 'nonexistent.json'),
        }),
        clearPluginCache: vi.fn(),
        clearLocalPluginCache: vi.fn(),
      },
    })
    await handler(argv)
    expect(info).toHaveBeenCalledWith(
      'Global manifest not found, nothing to remove.'
    )
  })
})
