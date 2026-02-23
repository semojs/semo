import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'
import {
  createTempDir,
  removeTempDir,
} from '../../../core/tests/helpers/test-utils.js'
import { mkdirSync, writeFileSync } from 'node:fs'
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

vi.mock('rimraf', () => ({
  rimraf: { sync: vi.fn() },
}))

vi.mock('node:child_process', async (importOriginal) => {
  const orig = await importOriginal<typeof import('node:child_process')>()
  return {
    ...orig,
    spawnSync: vi
      .fn()
      .mockReturnValue({ status: 0, stdout: '4.0K\t/tmp/x', stderr: '' }),
  }
})

describe('cleanup handler', () => {
  let handler: typeof import('../../src/commands/cleanup.js').handler
  let tmpDir: string
  let origHome: string | undefined

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/cleanup.js')
    handler = mod.handler
    tmpDir = createTempDir('cleanup')
    origHome = process.env.HOME
  })

  afterEach(() => {
    process.env.HOME = origHome
    removeTempDir(tmpDir)
  })

  it('prints info when nothing to cleanup', async () => {
    const { info } = await import('@semo/core')
    process.env.HOME = tmpDir
    const argv = createMockArgv({
      $core: {
        appConfig: {},
        invokeHook: vi.fn().mockResolvedValue({}),
      },
    })
    await handler(argv)
    expect(info).toHaveBeenCalledWith('Nothing to cleanup.')
  })

  it('prompts for type selection when type not specified', async () => {
    process.env.HOME = tmpDir
    // Create a cache dir to make cleanup steps non-empty
    const cacheDir = path.resolve(tmpDir, '.semo', 'cache')
    mkdirSync(cacheDir, { recursive: true })

    const argv = createMockArgv({
      type: undefined,
      yes: true,
      $core: {
        appConfig: {},
        invokeHook: vi.fn().mockResolvedValue({}),
      },
      $prompt: {
        select: vi.fn().mockResolvedValue('cache'),
      },
    })
    await handler(argv)
    expect(argv.$prompt.select).toHaveBeenCalled()
  })

  it('uses provided type without prompting', async () => {
    process.env.HOME = tmpDir
    const cacheDir = path.resolve(tmpDir, '.semo', 'cache')
    mkdirSync(cacheDir, { recursive: true })

    const { rimraf } = await import('rimraf')
    const argv = createMockArgv({
      type: 'cache',
      yes: true,
      $core: {
        appConfig: {},
        invokeHook: vi.fn().mockResolvedValue({}),
      },
    })
    await handler(argv)
    expect(rimraf.sync).toHaveBeenCalled()
  })

  it('reports error for invalid cleanup type', async () => {
    const { error } = await import('@semo/core')
    process.env.HOME = tmpDir
    const cacheDir = path.resolve(tmpDir, '.semo', 'cache')
    mkdirSync(cacheDir, { recursive: true })

    const argv = createMockArgv({
      type: 'nonexistent-type',
      $core: {
        appConfig: {},
        invokeHook: vi.fn().mockResolvedValue({}),
      },
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('Invalid cleanup type.')
  })

  it('does not cleanup when user declines confirmation', async () => {
    const { info } = await import('@semo/core')
    process.env.HOME = tmpDir
    const cacheDir = path.resolve(tmpDir, '.semo', 'cache')
    mkdirSync(cacheDir, { recursive: true })

    const { rimraf } = await import('rimraf')
    const argv = createMockArgv({
      type: 'cache',
      yes: false,
      $core: {
        appConfig: {},
        invokeHook: vi.fn().mockResolvedValue({}),
      },
      $prompt: {
        confirm: vi.fn().mockResolvedValue(false),
      },
    })
    await handler(argv)
    expect(rimraf.sync).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalledWith('Nothing has been cleanup!')
  })

  it('skips manifest when cleaning all', async () => {
    process.env.HOME = tmpDir
    const cacheDir = path.resolve(tmpDir, '.semo', 'cache')
    mkdirSync(cacheDir, { recursive: true })
    writeFileSync(path.resolve(cacheDir, 'plugin-manifest.json'), '{}')

    const { rimraf } = await import('rimraf')
    const argv = createMockArgv({
      type: 'all',
      yes: true,
      $core: {
        appConfig: {},
        invokeHook: vi.fn().mockResolvedValue({}),
      },
    })
    await handler(argv)
    // Should call rimraf but skip the manifest key
    const calls = vi.mocked(rimraf.sync).mock.calls
    const cleanedPaths = calls.map((c) => String(c[0]))
    expect(cleanedPaths.some((p) => p.includes('plugin-manifest.json'))).toBe(
      false
    )
  })

  it('includes hook-provided cleanup steps', async () => {
    process.env.HOME = tmpDir
    const cacheDir = path.resolve(tmpDir, '.semo', 'cache')
    mkdirSync(cacheDir, { recursive: true })

    const appDir = path.resolve(tmpDir, 'myapp')
    const customCache = path.resolve(appDir, 'custom-cache')
    mkdirSync(customCache, { recursive: true })

    const { rimraf } = await import('rimraf')
    const argv = createMockArgv({
      type: 'all',
      yes: true,
      $core: {
        appConfig: { applicationDir: appDir },
        invokeHook: vi.fn().mockResolvedValue({ 'custom-cache': customCache }),
      },
    })
    await handler(argv)
    const calls = vi.mocked(rimraf.sync).mock.calls
    const cleanedPaths = calls.map((c) => String(c[0]))
    expect(cleanedPaths).toContain(customCache)
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/cleanup.js')
    expect(mod.command).toBe('cleanup [type]')
    expect(mod.aliases).toBe('clean')
    expect(mod.plugin).toBe('semo')
  })
})
