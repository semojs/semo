import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import {
  loadPluginManifest,
  savePluginManifest,
  clearPluginManifest,
  getLocalManifestPath,
  getGlobalManifestPath,
  loadLocalPluginManifest,
  saveLocalPluginManifest,
  clearLocalPluginManifest,
} from '../src/common/plugin-cache.js'
import { createTempDir, removeTempDir } from './helpers/test-utils.js'

const TEST_SCRIPT = '__test_semo__'
const TEST_VERSION = '1.0.0-test'

describe('plugin-cache', () => {
  const cacheDir = path.resolve(process.env.HOME!, `.${TEST_SCRIPT}`, 'cache')
  const cachePath = path.resolve(cacheDir, 'plugin-manifest.json')

  beforeEach(() => {
    if (existsSync(cachePath)) {
      rmSync(cachePath)
    }
  })

  afterEach(() => {
    if (existsSync(cacheDir)) {
      rmSync(cacheDir, { recursive: true })
    }
    const parentDir = path.resolve(process.env.HOME!, `.${TEST_SCRIPT}`)
    if (existsSync(parentDir)) {
      rmSync(parentDir, { recursive: true })
    }
  })

  it('should return null when no cache exists', () => {
    const result = loadPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toBeNull()
  })

  it('should save and load plugin manifest successfully', () => {
    // Use a real existing path so the path-existence check passes
    const plugins = { 'semo-plugin-test': process.cwd() }

    savePluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)
    expect(existsSync(cachePath)).toBe(true)

    // Should successfully load because: same version, fresh timestamp, same cwd, paths exist
    const result = loadPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toEqual(plugins)
  })

  it('should save with correct JSON structure', () => {
    const plugins = { 'semo-plugin-test': '/path/to/test' }
    savePluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)

    const content = JSON.parse(readFileSync(cachePath, 'utf8'))
    expect(content.version).toBe(TEST_VERSION)
    expect(content.plugins).toEqual(plugins)
    expect(content.timestamp).toBeGreaterThan(0)
    expect(content.rcHash).toBeTruthy()
  })

  it('should invalidate cache when version changes', () => {
    const plugins = { 'semo-plugin-test': process.cwd() }
    savePluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)

    const result = loadPluginManifest(TEST_SCRIPT, '2.0.0-different')
    expect(result).toBeNull()
  })

  it('should invalidate cache when plugin paths no longer exist', () => {
    const plugins = { 'semo-plugin-test': '/nonexistent/path/12345' }
    savePluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)

    const result = loadPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toBeNull()
  })

  it('should invalidate cache when TTL expires', () => {
    const plugins = { 'semo-plugin-test': process.cwd() }
    savePluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)

    // Tamper with timestamp to simulate expiration
    const content = JSON.parse(readFileSync(cachePath, 'utf8'))
    content.timestamp = Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
    writeFileSync(cachePath, JSON.stringify(content))

    const result = loadPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toBeNull()
  })

  it('should invalidate cache when rcHash changes', () => {
    const plugins = { 'semo-plugin-test': process.cwd() }
    savePluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)

    // Tamper with rcHash
    const content = JSON.parse(readFileSync(cachePath, 'utf8'))
    content.rcHash = 'different-hash-value'
    writeFileSync(cachePath, JSON.stringify(content))

    const result = loadPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toBeNull()
  })

  it('should return null when cache file contains invalid JSON', () => {
    mkdirSync(cacheDir, { recursive: true })
    writeFileSync(cachePath, 'not valid json {{{')

    const result = loadPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toBeNull()
  })

  it('should clear plugin manifest', () => {
    const plugins = { 'semo-plugin-test': '/path/to/test' }
    savePluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)
    expect(existsSync(cachePath)).toBe(true)

    clearPluginManifest(TEST_SCRIPT)
    expect(existsSync(cachePath)).toBe(false)
  })

  it('should handle clear when no cache exists', () => {
    // Should not throw
    expect(() => clearPluginManifest(TEST_SCRIPT)).not.toThrow()
  })

  it('should handle missing HOME for save', () => {
    const originalHome = process.env.HOME
    delete process.env.HOME
    // Should silently return without writing
    expect(() =>
      savePluginManifest(TEST_SCRIPT, TEST_VERSION, {})
    ).not.toThrow()
    process.env.HOME = originalHome
  })

  it('should handle missing HOME for load', () => {
    const originalHome = process.env.HOME
    delete process.env.HOME
    const result = loadPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toBeNull()
    process.env.HOME = originalHome
  })

  it('should handle missing HOME for clear', () => {
    const originalHome = process.env.HOME
    delete process.env.HOME
    expect(() => clearPluginManifest(TEST_SCRIPT)).not.toThrow()
    process.env.HOME = originalHome
  })
})

describe('local plugin manifest', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = createTempDir('local-manifest')
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    removeTempDir(tmpDir)
  })

  it('getLocalManifestPath returns cwd-based path', () => {
    const p = getLocalManifestPath()
    expect(p).toBe(path.resolve(tmpDir, 'semo-plugin-manifest.json'))
  })

  it('getGlobalManifestPath returns home-based path', () => {
    const p = getGlobalManifestPath('semo')
    expect(p).toBe(
      path.resolve(process.env.HOME!, '.semo', 'cache', 'plugin-manifest.json')
    )
  })

  it('should return null when no local manifest exists', () => {
    const result = loadLocalPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toBeNull()
  })

  it('should save and load local manifest', () => {
    const plugins = { 'semo-plugin-test': tmpDir }
    saveLocalPluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)

    const localPath = getLocalManifestPath()
    expect(existsSync(localPath)).toBe(true)

    const result = loadLocalPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toEqual(plugins)
  })

  it('should invalidate local manifest when version changes', () => {
    const plugins = { 'semo-plugin-test': tmpDir }
    saveLocalPluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)

    const result = loadLocalPluginManifest(TEST_SCRIPT, '9.9.9')
    expect(result).toBeNull()
  })

  it('should NOT invalidate local manifest by TTL', () => {
    const plugins = { 'semo-plugin-test': tmpDir }
    saveLocalPluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)

    // Tamper with timestamp to simulate old manifest
    const localPath = getLocalManifestPath()
    const content = JSON.parse(readFileSync(localPath, 'utf8'))
    content.timestamp = Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days ago
    writeFileSync(localPath, JSON.stringify(content))

    const result = loadLocalPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toEqual(plugins)
  })

  it('should invalidate local manifest when plugin paths no longer exist', () => {
    const plugins = { 'semo-plugin-gone': '/nonexistent/path/12345' }
    saveLocalPluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)

    const result = loadLocalPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toBeNull()
  })

  it('should return null for invalid JSON in local manifest', () => {
    const localPath = getLocalManifestPath()
    writeFileSync(localPath, 'not valid json')

    const result = loadLocalPluginManifest(TEST_SCRIPT, TEST_VERSION)
    expect(result).toBeNull()
  })

  it('should clear local manifest', () => {
    const plugins = { 'semo-plugin-test': tmpDir }
    saveLocalPluginManifest(TEST_SCRIPT, TEST_VERSION, plugins)

    const localPath = getLocalManifestPath()
    expect(existsSync(localPath)).toBe(true)

    clearLocalPluginManifest()
    expect(existsSync(localPath)).toBe(false)
  })

  it('should handle clear when no local manifest exists', () => {
    expect(() => clearLocalPluginManifest()).not.toThrow()
  })
})
