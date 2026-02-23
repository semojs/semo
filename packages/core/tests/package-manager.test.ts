import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

// Mock node:child_process at module level for ESM compatibility
vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(() => ({
    status: 0,
    stdout: '',
    stderr: '',
    output: [],
    signal: null,
    pid: 0,
  })),
}))

import {
  convertToPrivate,
  loadPackageInfo,
  loadCorePackageInfo,
  resolvePackage,
  loadPluginRc,
  installPackage,
  uninstallPackage,
  importPackage,
} from '../src/common/package-manager.js'
import {
  createTempDir,
  removeTempDir,
  writeJson,
  writeFile,
} from './helpers/test-utils.js'
import path from 'node:path'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const spawnSyncMock = vi.mocked(spawnSync)

function createPackageManagerContext(overrides: Record<string, any> = {}): any {
  return {
    scriptName: 'semo',
    parsedArgv: { scriptName: 'semo' },
    debugCore: () => {},
    parseRcFile: () => ({}),
    ...overrides,
  }
}

describe('convertToPrivate', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should set private:true in package.json', () => {
    tmpDir = createTempDir('convert-private')
    const pkgPath = writeJson(tmpDir, 'package.json', {
      name: 'test',
      version: '1.0.0',
    })

    convertToPrivate(pkgPath)

    const result = JSON.parse(readFileSync(pkgPath, 'utf8'))
    expect(result.private).toBe(true)
    expect(result.name).toBe('test')
  })

  it('should handle nonexistent file gracefully', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    convertToPrivate('/nonexistent/package.json')
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('should handle invalid JSON gracefully', () => {
    tmpDir = createTempDir('convert-bad')
    writeFile(tmpDir, 'package.json', 'not json')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    convertToPrivate(path.resolve(tmpDir, 'package.json'))
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})

describe('loadPackageInfo', () => {
  it('should load current project package.json', () => {
    const result = loadPackageInfo()
    expect(result).toBeTruthy()
    expect(result.name).toBeTruthy()
  })

  it('should load named package info', () => {
    const result = loadPackageInfo('vitest')
    expect(result.name).toBe('vitest')
  })

  it('should throw for nonexistent package', () => {
    expect(() =>
      loadPackageInfo('__nonexistent_package_xyz__', ['/tmp'])
    ).toThrow()
  })
})

describe('loadCorePackageInfo', () => {
  it('should load core package info from __dirname', () => {
    const coreDir = path.resolve(process.cwd(), 'packages/core/src/common')
    const result = loadCorePackageInfo(coreDir)
    expect(result.name).toBe('@semo/core')
  })

  it('should return empty object for nonexistent path', () => {
    const result = loadCorePackageInfo('/nonexistent/deep/path')
    expect(result).toEqual({})
  })
})

describe('resolvePackage', () => {
  it('should resolve a known package', () => {
    const result = resolvePackage('semo', 'vitest', '', false)
    expect(result).toContain('vitest')
  })

  it('should throw for unknown package', () => {
    expect(() =>
      resolvePackage('semo', '__nonexistent_xyz__', '', false)
    ).toThrow()
  })
})

describe('loadPluginRc', () => {
  it('should throw when package not found (getPackagePath throws)', () => {
    const ctx = createPackageManagerContext()
    expect(() => loadPluginRc(ctx, '__nonexistent__', '', false)).toThrow()
  })
})

describe('installPackage', () => {
  let tmpDir: string

  beforeEach(() => {
    spawnSyncMock.mockClear()
  })

  afterEach(() => {
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should call npm install for missing packages', async () => {
    const ctx = createPackageManagerContext({
      parsedArgv: { scriptName: '__test_install__' },
    })

    await installPackage(ctx, '__nonexistent_pkg__', '', false)

    // spawnSync called for ensureDownloadDir (npm init) and for installing the package
    expect(spawnSyncMock).toHaveBeenCalled()
  })

  it('should handle force flag with --force', async () => {
    const ctx = createPackageManagerContext({
      parsedArgv: { scriptName: '__test_force__' },
    })

    await installPackage(ctx, '__nonexistent_pkg__', '', false, true)

    const forceCall = spawnSyncMock.mock.calls.find(
      (call) => Array.isArray(call[1]) && call[1].includes('--force')
    )
    expect(forceCall).toBeTruthy()
  })

  it('should handle array of package names', async () => {
    const ctx = createPackageManagerContext({
      parsedArgv: { scriptName: '__test_array__' },
    })

    await installPackage(ctx, ['pkg-a', 'pkg-b'] as any, '', false)

    expect(spawnSyncMock).toHaveBeenCalled()
  })

  it('should use home dir when home=true', async () => {
    const ctx = createPackageManagerContext({
      parsedArgv: { scriptName: '__test_home__' },
    })

    await installPackage(ctx, '__nonexistent_pkg__', 'node_modules', true)

    expect(spawnSyncMock).toHaveBeenCalled()
  })

  it('should fallback scriptName to semo when parsedArgv is empty', async () => {
    const ctx = createPackageManagerContext({
      parsedArgv: {},
    })

    await installPackage(ctx, '__nonexistent_pkg__', '', false)

    expect(spawnSyncMock).toHaveBeenCalled()
  })
})

describe('uninstallPackage', () => {
  beforeEach(() => {
    spawnSyncMock.mockClear()
  })

  it('should call npm uninstall', async () => {
    const ctx = createPackageManagerContext({
      parsedArgv: { scriptName: '__test_uninstall__' },
    })

    await uninstallPackage(ctx, 'some-package', '', false)

    const uninstallCall = spawnSyncMock.mock.calls.find(
      (call) => Array.isArray(call[1]) && call[1].includes('uninstall')
    )
    expect(uninstallCall).toBeTruthy()
  })

  it('should handle array of package names', async () => {
    const ctx = createPackageManagerContext({
      parsedArgv: { scriptName: '__test_unarray__' },
    })

    await uninstallPackage(ctx, ['pkg-a', 'pkg-b'] as any, '', false)

    expect(spawnSyncMock).toHaveBeenCalled()
  })

  it('should fallback scriptName to semo', async () => {
    const ctx = createPackageManagerContext({
      parsedArgv: {},
    })

    await uninstallPackage(ctx, 'some-package', '', false)

    expect(spawnSyncMock).toHaveBeenCalled()
  })
})

describe('importPackage', () => {
  beforeEach(() => {
    spawnSyncMock.mockClear()
  })

  it('should try to import and install if not found', async () => {
    const ctx = createPackageManagerContext()

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await importPackage(ctx, '__nonexistent_module__', '', false)
    warnSpy.mockRestore()

    // spawnSync called for install attempt after MODULE_NOT_FOUND
    expect(spawnSyncMock).toHaveBeenCalled()
  })

  it('should handle force import with --force', async () => {
    const ctx = createPackageManagerContext()

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await importPackage(ctx, '__nonexistent_module__', '', false, true)
    warnSpy.mockRestore()

    const forceCall = spawnSyncMock.mock.calls.find(
      (call) => Array.isArray(call[1]) && call[1].includes('install')
    )
    expect(forceCall).toBeTruthy()
  })

  it('should return undefined when module cannot be imported', async () => {
    const ctx = createPackageManagerContext()

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await importPackage(ctx, '__truly_nonexistent__', '', false)
    warnSpy.mockRestore()

    // After failed install, returns undefined
    expect(result).toBeUndefined()
  })

  it('should use location parameter for download dir', async () => {
    const ctx = createPackageManagerContext()

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await importPackage(ctx, '__nonexistent_module__', 'custom-location', false)
    warnSpy.mockRestore()

    expect(spawnSyncMock).toHaveBeenCalled()
  })
})
