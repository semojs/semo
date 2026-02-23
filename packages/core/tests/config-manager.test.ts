import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  parseRcFile,
  getApplicationConfig,
  getCombinedConfig,
  parsePluginConfig,
  getNodeEnv,
  extendConfigFromRc,
} from '../src/common/config-manager.js'
import {
  createTempDir,
  removeTempDir,
  writeYaml,
  writeJson,
  writeFile,
  createConfigManagerContext,
} from './helpers/test-utils.js'
import path from 'node:path'

describe('getNodeEnv', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv
    } else {
      delete process.env.NODE_ENV
    }
  })

  it('should return NODE_ENV when no argv', () => {
    process.env.NODE_ENV = 'production'
    expect(getNodeEnv()).toBe('production')
  })

  it('should default to development when NODE_ENV not set', () => {
    delete process.env.NODE_ENV
    expect(getNodeEnv()).toBe('development')
  })

  it('should use nodeEnvKey from argv', () => {
    process.env.MY_ENV = 'staging'
    expect(getNodeEnv({ nodeEnvKey: 'MY_ENV' })).toBe('staging')
    delete process.env.MY_ENV
  })

  it('should use nodeEnv from argv as key name', () => {
    process.env.CUSTOM_ENV = 'test'
    expect(getNodeEnv({ nodeEnv: 'CUSTOM_ENV' })).toBe('test')
    delete process.env.CUSTOM_ENV
  })

  it('should default to development when env key not found', () => {
    expect(getNodeEnv({ nodeEnvKey: 'NONEXISTENT_KEY' })).toBe('development')
  })
})

describe('parsePluginConfig', () => {
  it('should return empty object for empty plugin name', () => {
    const result = parsePluginConfig({ scriptName: 'semo' }, '')
    expect(result).toEqual({})
  })

  it('should extract config from $plugin by short name', () => {
    const argv = {
      scriptName: 'semo',
      $plugin: { test: { key: 'value' } },
    }
    const result = parsePluginConfig(argv, 'semo-plugin-test')
    expect(result).toEqual({ key: 'value' })
  })

  it('should extract config from $plugin by full name', () => {
    const argv = {
      scriptName: 'semo',
      $plugin: { 'semo-plugin-test': { key: 'value2' } },
    }
    const result = parsePluginConfig(argv, 'test')
    expect(result).toEqual({ key: 'value2' })
  })

  it('should return empty object when $plugin has no matching key', () => {
    const argv = {
      scriptName: 'semo',
      $plugin: { other: { key: 'value' } },
    }
    const result = parsePluginConfig(argv, 'semo-plugin-test')
    expect(result).toEqual({})
  })

  it('should return empty object when no $plugin', () => {
    const argv = { scriptName: 'semo' }
    const result = parsePluginConfig(argv, 'semo-plugin-test')
    expect(result).toEqual({})
  })

  it('should handle plugin name without prefix', () => {
    const argv = {
      scriptName: 'semo',
      $plugin: { test: { port: 3000 } },
    }
    const result = parsePluginConfig(argv, 'test')
    expect(result).toEqual({ port: 3000 })
  })

  it('should format rc options (kebab to camel)', () => {
    const argv = {
      scriptName: 'semo',
      $plugin: { test: { 'my-option': 'val' } },
    }
    const result = parsePluginConfig(argv, 'test')
    expect(result).toEqual({ myOption: 'val' })
  })
})

describe('parseRcFile', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should load and parse .semorc.yml', () => {
    tmpDir = createTempDir('rc-file')
    writeYaml(
      tmpDir,
      '.semorc.yml',
      'commandDir: lib/commands\nhookDir: lib/hooks\n'
    )
    writeJson(tmpDir, 'package.json', { version: '1.2.3' })

    const ctx = createConfigManagerContext()
    const result = parseRcFile(ctx, 'semo-plugin-test', tmpDir)

    expect(result.commandDir).toBe('lib/commands')
    expect(result.hookDir).toBe('lib/hooks')
    expect(result.version).toBe('1.2.3')
  })

  it('should cache results for same plugin+path', () => {
    tmpDir = createTempDir('rc-cache')
    writeYaml(tmpDir, '.semorc.yml', 'commandDir: lib/commands\n')
    writeJson(tmpDir, 'package.json', { version: '1.0.0' })

    const ctx = createConfigManagerContext()
    const result1 = parseRcFile(ctx, 'plugin-a', tmpDir)
    const result2 = parseRcFile(ctx, 'plugin-a', tmpDir)

    expect(result1).toBe(result2) // Same reference (cached)
  })

  it('should use zero-config convention when no .semorc.yml', () => {
    tmpDir = createTempDir('rc-zero')
    // Create lib/commands directory to trigger auto-detection
    writeFile(path.resolve(tmpDir, 'lib/commands'), '.gitkeep', '')
    writeFile(path.resolve(tmpDir, 'lib/hooks'), '.gitkeep', '')
    writeJson(tmpDir, 'package.json', { version: '2.0.0' })

    const ctx = createConfigManagerContext()
    const result = parseRcFile(ctx, 'semo-plugin-test', tmpDir)

    expect(result.commandDir).toBe('lib/commands')
    expect(result.hookDir).toBe('lib/hooks')
    expect(result.version).toBe('2.0.0')
  })

  it('should set version to 0.0.0 when package.json missing', () => {
    tmpDir = createTempDir('rc-nopkg')
    writeYaml(tmpDir, '.semorc.yml', 'commandDir: lib/commands\n')

    const ctx = createConfigManagerContext()
    const result = parseRcFile(ctx, 'semo-plugin-test', tmpDir)

    expect(result.version).toBe('0.0.0')
  })

  it('should set version to 0.0.0 for zero-config when package.json missing', () => {
    tmpDir = createTempDir('rc-zero-nopkg')

    const ctx = createConfigManagerContext()
    const result = parseRcFile(ctx, 'semo-plugin-test', tmpDir)

    expect(result.version).toBe('0.0.0')
  })

  it('should handle malformed YAML gracefully', () => {
    tmpDir = createTempDir('rc-bad-yaml')
    writeYaml(tmpDir, '.semorc.yml', ': invalid: yaml: [[[')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ctx = createConfigManagerContext()
    const result = parseRcFile(ctx, 'semo-plugin-test', tmpDir)

    expect(result).toEqual({})
    warnSpy.mockRestore()
  })
})

describe('getApplicationConfig', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should return basic config with applicationDir', () => {
    tmpDir = createTempDir('app-config')
    const ctx = createConfigManagerContext()
    const result = getApplicationConfig(ctx, { cwd: tmpDir })

    expect(result.applicationDir).toBe(tmpDir)
    expect(result.coreCommandDir).toBe('lib/commands')
  })

  it('should cache config when no cwd option', () => {
    const ctx = createConfigManagerContext()
    const result1 = getApplicationConfig(ctx)
    const result2 = getApplicationConfig(ctx)

    expect(result1).toBe(result2) // Same reference
  })

  it('should not cache when cwd is provided', () => {
    tmpDir = createTempDir('app-nocache')
    const ctx = createConfigManagerContext()

    const result1 = getApplicationConfig(ctx, { cwd: tmpDir })
    getApplicationConfig(ctx, { cwd: tmpDir })

    // Different references since cwd triggers fresh computation
    expect(result1.applicationDir).toBe(tmpDir)
  })

  it('should load config from package.json semo key', () => {
    tmpDir = createTempDir('app-pkg-config')
    writeJson(tmpDir, 'package.json', {
      name: 'my-app',
      version: '3.0.0',
      semo: { pluginDir: 'custom-plugins' },
    })

    const ctx = createConfigManagerContext()
    const result = getApplicationConfig(ctx, { cwd: tmpDir })

    expect(result.name).toBe('my-app')
    expect(result.version).toBe('3.0.0')
    expect(result.pluginDir).toBe('custom-plugins')
  })

  it('should load and merge .semorc.yml config', () => {
    tmpDir = createTempDir('app-rc')
    writeYaml(
      tmpDir,
      '.semorc.yml',
      'commandDir: src/commands\nhookDir: src/hooks\n'
    )
    writeJson(tmpDir, 'package.json', { name: 'test-app', version: '1.0.0' })

    const ctx = createConfigManagerContext()
    const result = getApplicationConfig(ctx, { cwd: tmpDir })

    expect(result.commandDir).toBe('src/commands')
    expect(result.hookDir).toBe('src/hooks')
  })

  it('should handle malformed .semorc.yml gracefully', () => {
    tmpDir = createTempDir('app-bad-rc')
    writeYaml(tmpDir, '.semorc.yml', ': bad: yaml [[[')
    writeJson(tmpDir, 'package.json', { name: 'test' })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ctx = createConfigManagerContext()
    const result = getApplicationConfig(ctx, { cwd: tmpDir })

    expect(result).toBeTruthy()
    warnSpy.mockRestore()
  })

  it('should use process.cwd() as applicationDir when no config found', () => {
    const ctx = createConfigManagerContext()
    const result = getApplicationConfig(ctx, {
      cwd: '/tmp/nonexistent-semo-dir',
    })

    expect(result.applicationDir).toBe('/tmp/nonexistent-semo-dir')
  })
})

describe('getCombinedConfig', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should merge plugin configs with app config', async () => {
    tmpDir = createTempDir('combined')
    writeYaml(
      tmpDir,
      '.semorc.yml',
      'commandDir: lib/commands\nhookDir: lib/hooks\n'
    )
    writeJson(tmpDir, 'package.json', { version: '1.0.0' })

    const ctx = createConfigManagerContext({
      allPlugins: { 'semo-plugin-test': tmpDir },
      getApplicationConfig: () => ({
        applicationDir: tmpDir,
        commandDir: 'app/commands',
      }),
    })

    const result = await getCombinedConfig(ctx, {})

    expect(result.pluginConfigs).toBeTruthy()
    expect(result.pluginConfigs!['semo-plugin-test']).toBeTruthy()
    expect(result.pluginConfigs!['semo-plugin-test'].commandDir).toBe(
      'lib/commands'
    )
  })

  it('should call getAllPluginsMapping when allPlugins is empty', async () => {
    tmpDir = createTempDir('combined-load')
    writeYaml(tmpDir, '.semorc.yml', 'commandDir: lib/commands\n')
    writeJson(tmpDir, 'package.json', { version: '1.0.0' })

    const getAllPluginsMappingFn = vi.fn().mockResolvedValue({
      'semo-plugin-test': tmpDir,
    })
    const ctx = createConfigManagerContext({
      allPlugins: {},
      getAllPluginsMapping: getAllPluginsMappingFn,
      getApplicationConfig: () => ({}),
    })

    await getCombinedConfig(ctx, {})
    expect(getAllPluginsMappingFn).toHaveBeenCalled()
  })

  it('should handle empty plugins', async () => {
    const ctx = createConfigManagerContext({
      allPlugins: {},
      getAllPluginsMapping: async () => ({}),
      getApplicationConfig: () => ({}),
    })

    const result = await getCombinedConfig(ctx, {})
    expect(result.pluginConfigs).toEqual({})
  })
})

describe('extendConfigFromRc', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should merge RC file config into argv', () => {
    tmpDir = createTempDir('extend-rc')
    writeYaml(tmpDir, 'custom.yml', 'port: 3000\nhost: localhost\n')

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createConfigManagerContext()
    const result = extendConfigFromRc(ctx, { existing: true }, 'custom.yml', '')

    expect(result.port).toBe(3000)
    expect(result.host).toBe('localhost')
    expect(result.existing).toBe(true)
    process.cwd = originalCwd
  })

  it('should merge with prefix into nested path', () => {
    tmpDir = createTempDir('extend-prefix')
    writeYaml(tmpDir, 'db.yml', 'host: db.local\nport: 5432\n')

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createConfigManagerContext()
    const result = extendConfigFromRc(
      ctx,
      { database: {} },
      'db.yml',
      'database'
    )

    expect(result.database.host).toBe('db.local')
    expect(result.database.port).toBe(5432)
    process.cwd = originalCwd
  })

  it('should handle array of RC paths', () => {
    tmpDir = createTempDir('extend-array')
    writeYaml(tmpDir, 'a.yml', 'keyA: valueA\n')
    writeYaml(tmpDir, 'b.yml', 'keyB: valueB\n')

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createConfigManagerContext()
    const result = extendConfigFromRc(ctx, {}, ['a.yml', 'b.yml'], '')

    expect(result.keyA).toBe('valueA')
    expect(result.keyB).toBe('valueB')
    process.cwd = originalCwd
  })

  it('should skip nonexistent RC files', () => {
    const ctx = createConfigManagerContext()
    const result = extendConfigFromRc(
      ctx,
      { existing: 1 },
      '/nonexistent.yml',
      ''
    )
    expect(result.existing).toBe(1)
  })

  it('should handle malformed RC file gracefully', () => {
    tmpDir = createTempDir('extend-bad')
    writeYaml(tmpDir, 'bad.yml', ': invalid [[[')

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ctx = createConfigManagerContext()
    const result = extendConfigFromRc(ctx, { ok: true }, 'bad.yml', '')

    expect(result.ok).toBe(true)
    warnSpy.mockRestore()
    process.cwd = originalCwd
  })
})

describe('extendConfigFromRc - env-specific files', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should load env-specific RC file when it exists', () => {
    tmpDir = createTempDir('extend-env')
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'

    writeYaml(tmpDir, 'config.yml', 'base: true\n')
    writeYaml(tmpDir, 'config.test.yml', 'envSpecific: true\n')

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createConfigManagerContext()
    const result = extendConfigFromRc(ctx, {}, 'config.yml', '')

    expect(result.base).toBe(true)
    expect(result.envSpecific).toBe(true)

    process.cwd = originalCwd
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should merge env-specific RC with prefix', () => {
    tmpDir = createTempDir('extend-env-prefix')
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'staging'

    writeYaml(tmpDir, 'db.yml', 'host: main-db\n')
    writeYaml(tmpDir, 'db.staging.yml', 'host: staging-db\nport: 5433\n')

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createConfigManagerContext()
    const result = extendConfigFromRc(ctx, { db: {} }, 'db.yml', 'db')

    expect(result.db.host).toBe('staging-db')
    expect(result.db.port).toBe(5433)

    process.cwd = originalCwd
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should handle malformed env-specific RC file gracefully', () => {
    tmpDir = createTempDir('extend-env-bad')
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'

    writeYaml(tmpDir, 'cfg.yml', 'ok: true\n')
    writeYaml(tmpDir, 'cfg.test.yml', ': bad [[[')

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ctx = createConfigManagerContext()
    const result = extendConfigFromRc(ctx, {}, 'cfg.yml', '')

    expect(result.ok).toBe(true)
    warnSpy.mockRestore()
    process.cwd = originalCwd
    process.env.NODE_ENV = originalNodeEnv
  })
})

describe('getApplicationConfig - advanced branches', () => {
  let tmpDir: string

  afterEach(() => {
    if (tmpDir) removeTempDir(tmpDir)
  })

  it('should merge env-specific .semorc.{env}.yml', () => {
    tmpDir = createTempDir('app-env')
    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'

    writeYaml(tmpDir, '.semorc.yml', 'commandDir: lib/commands\n')
    writeYaml(tmpDir, '.semorc.test.yml', 'testMode: true\n')
    writeJson(tmpDir, 'package.json', { name: 'test-app', version: '1.0.0' })

    const ctx = createConfigManagerContext()
    const result = getApplicationConfig(ctx, { cwd: tmpDir })

    expect(result.commandDir).toBe('lib/commands')
    expect(result.testMode).toBe(true)

    process.env.NODE_ENV = originalNodeEnv
  })

  it('should handle home rc file when it exists', () => {
    // This test verifies the home rc loading path.
    // We test with a non-home cwd so the homeSemoYamlRcPath is checked.
    tmpDir = createTempDir('app-home')
    writeJson(tmpDir, 'package.json', { name: 'my-app', version: '1.0.0' })

    const ctx = createConfigManagerContext()
    const result = getApplicationConfig(ctx, { cwd: tmpDir })

    expect(result.name).toBe('my-app')
    expect(result.applicationDir).toBe(tmpDir)
  })

  it('should handle scriptName key in package.json', () => {
    tmpDir = createTempDir('app-scriptkey')
    writeJson(tmpDir, 'package.json', {
      name: 'my-app',
      version: '2.0.0',
      semo: {
        'plugin-dir': 'custom-plugins',
        'hook-dir': 'custom-hooks',
      },
    })

    const ctx = createConfigManagerContext()
    const result = getApplicationConfig(ctx, { cwd: tmpDir })

    // formatRcOptions converts kebab-case to camelCase
    expect(result.pluginDir).toBe('custom-plugins')
    expect(result.hookDir).toBe('custom-hooks')
  })

  it('should use process.cwd() when configPath not found and no cwd', () => {
    const ctx = createConfigManagerContext()
    const result = getApplicationConfig(ctx, {
      cwd: '/tmp/nonexistent-dir-xyz',
    })

    expect(result.applicationDir).toBe('/tmp/nonexistent-dir-xyz')
  })
})
