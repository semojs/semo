import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'
import {
  createTempDir,
  removeTempDir,
  writeFile,
} from '../../../core/tests/helpers/test-utils.js'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'

// Mock @semo/core log functions used at module level
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

// Mock child_process for config/list
vi.mock('node:child_process', async (importOriginal) => {
  const orig = await importOriginal<typeof import('node:child_process')>()
  return {
    ...orig,
    spawn: vi.fn().mockReturnValue({ on: vi.fn() }),
    spawnSync: vi.fn().mockReturnValue({ status: 0, stdout: '', stderr: '' }),
  }
})

function mockCwd(dir: string) {
  return vi.spyOn(process, 'cwd').mockReturnValue(dir)
}

// ---- config/utils ----
describe('config/utils - resolveConfigPath', () => {
  let resolveConfigPath: typeof import('../../src/commands/config/utils.js').resolveConfigPath

  beforeEach(async () => {
    const mod = await import('../../src/commands/config/utils.js')
    resolveConfigPath = mod.resolveConfigPath
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns local config path when global is false', () => {
    const result = resolveConfigPath('semo', false)
    expect(result).toBe(path.resolve(process.cwd(), '.semorc.yml'))
  })

  it('returns global config path when global is true and HOME is set', () => {
    const origHome = process.env.HOME
    process.env.HOME = '/tmp/fakehome'
    try {
      const result = resolveConfigPath('semo', true)
      expect(result).toBe('/tmp/fakehome/.semo/.semorc.yml')
    } finally {
      process.env.HOME = origHome
    }
  })

  it('returns empty string when global is true and HOME is unset', () => {
    const origHome = process.env.HOME
    delete process.env.HOME
    try {
      const result = resolveConfigPath('semo', true)
      expect(result).toBe('')
    } finally {
      process.env.HOME = origHome
    }
  })

  it('uses custom scriptName for path', () => {
    const result = resolveConfigPath('myapp', false)
    expect(result).toBe(path.resolve(process.cwd(), '.myapprc.yml'))
  })
})

// ---- config/get ----
describe('config/get handler', () => {
  let handler: typeof import('../../src/commands/config/get.js').handler
  let tmpDir: string
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    const mod = await import('../../src/commands/config/get.js')
    handler = mod.handler
    tmpDir = createTempDir('config-get')
    cwdSpy = mockCwd(tmpDir)
  })

  afterEach(() => {
    cwdSpy.mockRestore()
    removeTempDir(tmpDir)
    vi.restoreAllMocks()
  })

  it('reports error when config file does not exist', async () => {
    const argv = createMockArgv({
      configKey: 'foo',
      scriptName: 'semo',
      global: false,
    })
    await handler(argv)
    expect(argv.$error).toHaveBeenCalledWith('Config file not found.')
  })

  it('outputs found config value', async () => {
    writeFile(tmpDir, '.semorc.yml', yaml.stringify({ foo: { bar: 'baz' } }))
    const argv = createMockArgv({
      configKey: 'foo.bar',
      scriptName: 'semo',
      global: false,
    })
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await handler(argv)
    expect(consoleSpy).toHaveBeenCalled()
    expect(consoleSpy.mock.calls[0][0]).toContain('baz')
    consoleSpy.mockRestore()
  })

  it('warns when config key not found', async () => {
    writeFile(tmpDir, '.semorc.yml', yaml.stringify({ foo: 'bar' }))
    const argv = createMockArgv({
      configKey: 'nonexistent',
      scriptName: 'semo',
      global: false,
    })
    await handler(argv)
    expect(argv.$warn).toHaveBeenCalledWith(
      expect.stringContaining('nonexistent')
    )
  })
})

// ---- config/set ----
describe('config/set handler', () => {
  let handler: typeof import('../../src/commands/config/set.js').handler
  let tmpDir: string
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    const mod = await import('../../src/commands/config/set.js')
    handler = mod.handler
    tmpDir = createTempDir('config-set')
    cwdSpy = mockCwd(tmpDir)
  })

  afterEach(() => {
    cwdSpy.mockRestore()
    removeTempDir(tmpDir)
    vi.restoreAllMocks()
  })

  it('converts boolean type correctly', async () => {
    writeFile(tmpDir, '.semorc.yml', yaml.stringify({ placeholder: true }))
    const argv = createMockArgv({
      configKey: 'myBool',
      configValue: 'true',
      configType: 'boolean',
      scriptName: 'semo',
      global: false,
    })
    await handler(argv)
    expect(argv.$success).toHaveBeenCalled()
    const parsed = yaml.parse(
      readFileSync(path.resolve(tmpDir, '.semorc.yml'), 'utf8')
    )
    expect(parsed.myBool).toBe(true)
  })

  it('converts number type correctly', async () => {
    writeFile(tmpDir, '.semorc.yml', yaml.stringify({ placeholder: true }))
    const argv = createMockArgv({
      configKey: 'port',
      configValue: '8080',
      configType: 'number',
      scriptName: 'semo',
      global: false,
    })
    await handler(argv)
    expect(argv.$success).toHaveBeenCalled()
    const parsed = yaml.parse(
      readFileSync(path.resolve(tmpDir, '.semorc.yml'), 'utf8')
    )
    expect(parsed.port).toBe(8080)
  })

  it('reports error when local config file does not exist', async () => {
    const argv = createMockArgv({
      configKey: 'foo',
      configValue: 'bar',
      configType: 'string',
      scriptName: 'semo',
      global: false,
    })
    await handler(argv)
    expect(argv.$error).toHaveBeenCalledWith(
      expect.stringContaining('Config file not found')
    )
  })

  it('creates nested keys with dot notation', async () => {
    writeFile(tmpDir, '.semorc.yml', yaml.stringify({ placeholder: true }))
    const argv = createMockArgv({
      configKey: 'a.b.c',
      configValue: 'deep',
      configType: 'string',
      scriptName: 'semo',
      global: false,
    })
    await handler(argv)
    const parsed = yaml.parse(
      readFileSync(path.resolve(tmpDir, '.semorc.yml'), 'utf8')
    )
    expect(parsed.a.b.c).toBe('deep')
  })

  it('sets value in global config file', async () => {
    cwdSpy.mockRestore()
    const globalHome = path.resolve(tmpDir, 'globalhome')
    const globalRc = path.resolve(globalHome, '.semo', '.semorc.yml')
    // Pre-create the directory and an initial config file
    writeFile(
      path.resolve(globalHome, '.semo'),
      '.semorc.yml',
      yaml.stringify({ existing: 'val' })
    )
    const origHome = process.env.HOME
    process.env.HOME = globalHome
    try {
      const argv = createMockArgv({
        configKey: 'test',
        configValue: 'val',
        configType: 'string',
        scriptName: 'semo',
        global: true,
      })
      await handler(argv)
      expect(argv.$success).toHaveBeenCalled()
      const parsed = yaml.parse(readFileSync(globalRc, 'utf8'))
      expect(parsed.test).toBe('val')
      expect(parsed.existing).toBe('val')
    } finally {
      process.env.HOME = origHome
    }
  })
})

// ---- config/delete ----
describe('config/delete handler', () => {
  let handler: typeof import('../../src/commands/config/delete.js').handler
  let tmpDir: string
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    const mod = await import('../../src/commands/config/delete.js')
    handler = mod.handler
    tmpDir = createTempDir('config-del')
    cwdSpy = mockCwd(tmpDir)
  })

  afterEach(() => {
    cwdSpy.mockRestore()
    removeTempDir(tmpDir)
    vi.restoreAllMocks()
  })

  it('reports error when config file not found', async () => {
    const argv = createMockArgv({
      configKey: 'foo',
      scriptName: 'semo',
      global: false,
    })
    await handler(argv)
    expect(argv.$error).toHaveBeenCalledWith('Config file not found.')
  })

  it('reports error when key not found in config', async () => {
    writeFile(tmpDir, '.semorc.yml', yaml.stringify({ existing: 'value' }))
    const argv = createMockArgv({
      configKey: 'nonexistent',
      scriptName: 'semo',
      global: false,
    })
    await handler(argv)
    expect(argv.$error).toHaveBeenCalledWith(
      expect.stringContaining('not found')
    )
  })

  it('cancels deletion when user declines', async () => {
    writeFile(tmpDir, '.semorc.yml', yaml.stringify({ mykey: 'myval' }))
    const argv = createMockArgv({
      configKey: 'mykey',
      scriptName: 'semo',
      global: false,
      $prompt: { confirm: vi.fn().mockResolvedValue(false) },
    })
    await handler(argv)
    expect(argv.$info).toHaveBeenCalledWith(expect.stringContaining('canceled'))
    expect(readFileSync(path.resolve(tmpDir, '.semorc.yml'), 'utf8')).toContain(
      'mykey'
    )
  })

  it('deletes key when user confirms', async () => {
    writeFile(
      tmpDir,
      '.semorc.yml',
      yaml.stringify({ mykey: 'myval', other: 'keep' })
    )
    const argv = createMockArgv({
      configKey: 'mykey',
      scriptName: 'semo',
      global: false,
      $prompt: { confirm: vi.fn().mockResolvedValue(true) },
    })
    await handler(argv)
    expect(argv.$success).toHaveBeenCalled()
    const parsed = yaml.parse(
      readFileSync(path.resolve(tmpDir, '.semorc.yml'), 'utf8')
    )
    expect(parsed.mykey).toBeUndefined()
    expect(parsed.other).toBe('keep')
  })
})

// ---- config/list ----
describe('config/list handler', () => {
  let handler: typeof import('../../src/commands/config/list.js').handler
  let tmpDir: string
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    const mod = await import('../../src/commands/config/list.js')
    handler = mod.handler
    tmpDir = createTempDir('config-list')
    cwdSpy = mockCwd(tmpDir)
  })

  afterEach(() => {
    cwdSpy.mockRestore()
    removeTempDir(tmpDir)
    vi.restoreAllMocks()
  })

  it('reports error when config file not found', async () => {
    const argv = createMockArgv({ scriptName: 'semo', global: false })
    await handler(argv)
    expect(argv.$error).toHaveBeenCalledWith('Config file not found.')
  })

  it('spawns less when config file exists', async () => {
    writeFile(tmpDir, '.semorc.yml', 'foo: bar')
    const { spawn } = await import('node:child_process')
    const argv = createMockArgv({ scriptName: 'semo', global: false })
    await handler(argv)
    expect(spawn).toHaveBeenCalledWith(
      'less',
      expect.arrayContaining([expect.stringContaining('.semorc.yml')]),
      { stdio: 'inherit' }
    )
  })

  it('reports error when watch mode and watch command not found', async () => {
    writeFile(tmpDir, '.semorc.yml', 'foo: bar')
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 1 } as any)
    const argv = createMockArgv({
      scriptName: 'semo',
      global: false,
      watch: true,
    })
    await handler(argv)
    expect(argv.$error).toHaveBeenCalledWith(expect.stringContaining('watch'))
  })
})
