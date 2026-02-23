import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'
import {
  createTempDir,
  removeTempDir,
} from '../../../core/tests/helpers/test-utils.js'
import { existsSync, readFileSync, mkdirSync } from 'node:fs'
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

vi.mock('node:child_process', async (importOriginal) => {
  const orig = await importOriginal<typeof import('node:child_process')>()
  return {
    ...orig,
    spawnSync: vi.fn().mockReturnValue({ status: 0, stdout: '', stderr: '' }),
  }
})

// ---- generate/command ----
describe('generate/command handler', () => {
  let handler: typeof import('../../src/commands/generate/command.js').handler
  let tmpDir: string

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/generate/command.js')
    handler = mod.handler
    tmpDir = createTempDir('gen-cmd')
  })

  afterEach(() => {
    removeTempDir(tmpDir)
  })

  it('reports error when commandDir is missing', async () => {
    const { error } = await import('@semo/core')
    const argv = createMockArgv({
      name: 'test-cmd',
      commandDir: undefined,
      commandMakeDir: undefined,
      scriptName: 'semo',
      format: 'esm',
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('commandDir'))
  })

  it('creates esm command file', async () => {
    const { success } = await import('@semo/core')
    const cmdDir = path.resolve(tmpDir, 'commands')
    mkdirSync(cmdDir, { recursive: true })

    const argv = createMockArgv({
      name: 'hello',
      description: 'Say hello',
      commandDir: cmdDir,
      scriptName: 'semo',
      format: 'esm',
    })
    await handler(argv)
    expect(success).toHaveBeenCalled()
    const filePath = path.resolve(cmdDir, 'hello.js')
    expect(existsSync(filePath)).toBe(true)
    const content = readFileSync(filePath, 'utf8')
    expect(content).toContain("command = 'hello'")
  })

  it('creates typescript command file', async () => {
    const { success } = await import('@semo/core')
    const cmdDir = path.resolve(tmpDir, 'commands')
    mkdirSync(cmdDir, { recursive: true })

    const argv = createMockArgv({
      name: 'myts',
      commandDir: cmdDir,
      scriptName: 'semo',
      format: 'typescript',
      typescript: true,
    })
    await handler(argv)
    expect(success).toHaveBeenCalled()
    expect(existsSync(path.resolve(cmdDir, 'myts.ts'))).toBe(true)
  })

  it('reports error when command file already exists', async () => {
    const { error } = await import('@semo/core')
    const cmdDir = path.resolve(tmpDir, 'commands')
    mkdirSync(cmdDir, { recursive: true })
    const { writeFileSync } = await import('node:fs')
    writeFileSync(path.resolve(cmdDir, 'existing.js'), 'content')

    const argv = createMockArgv({
      name: 'existing',
      commandDir: cmdDir,
      scriptName: 'semo',
      format: 'esm',
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('Command file exist!')
  })

  it('uses extend directory when --extend is specified', async () => {
    const { success } = await import('@semo/core')
    const extendDir = path.resolve(tmpDir, 'extends')

    const argv = createMockArgv({
      name: 'extcmd',
      extend: 'myplugin',
      extendDir,
      extendMakeDir: undefined,
      scriptName: 'semo',
      format: 'esm',
    })
    await handler(argv)
    expect(success).toHaveBeenCalled()
    expect(
      existsSync(
        path.resolve(extendDir, 'semo-plugin-myplugin/src/commands/extcmd.js')
      )
    ).toBe(true)
  })

  it('uses plugin directory when --plugin is specified', async () => {
    const { success } = await import('@semo/core')
    const pluginDir = path.resolve(tmpDir, 'plugins')

    const argv = createMockArgv({
      name: 'plgcmd',
      plugin: 'test',
      pluginDir,
      pluginMakeDir: undefined,
      scriptName: 'semo',
      format: 'esm',
    })
    await handler(argv)
    expect(success).toHaveBeenCalled()
    expect(
      existsSync(
        path.resolve(pluginDir, 'semo-plugin-test/src/commands/plgcmd.js')
      )
    ).toBe(true)
  })

  it('supports nested command names (subdir)', async () => {
    const { success } = await import('@semo/core')
    const cmdDir = path.resolve(tmpDir, 'commands')
    mkdirSync(cmdDir, { recursive: true })

    const argv = createMockArgv({
      name: 'parent/child',
      commandDir: cmdDir,
      scriptName: 'semo',
      format: 'esm',
    })
    await handler(argv)
    expect(success).toHaveBeenCalled()
    expect(existsSync(path.resolve(cmdDir, 'parent/child.js'))).toBe(true)
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/generate/command.js')
    expect(mod.command).toBe('command <name> [description]')
    expect(mod.aliases).toBe('c')
    expect(mod.plugin).toBe('semo')
  })
})

// ---- generate/plugin ----
describe('generate/plugin handler', () => {
  let handler: typeof import('../../src/commands/generate/plugin.js').handler
  let tmpDir: string

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/generate/plugin.js')
    handler = mod.handler
    tmpDir = createTempDir('gen-plugin')
  })

  afterEach(() => {
    removeTempDir(tmpDir)
  })

  it('reports error when pluginDir is missing', async () => {
    const { error } = await import('@semo/core')
    const argv = createMockArgv({
      name: 'test',
      pluginDir: undefined,
      pluginMakeDir: undefined,
      scriptName: 'semo',
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('pluginDir'))
  })

  it('reports error when plugin name is invalid', async () => {
    const { error } = await import('@semo/core')
    const argv = createMockArgv({
      name: 'InvalidName!',
      pluginDir: tmpDir,
      pluginMakeDir: undefined,
      scriptName: 'semo',
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('Plugin name invalid!')
  })

  it('reports error when destination exists and no force', async () => {
    const { error } = await import('@semo/core')
    const pluginPath = path.resolve(tmpDir, 'semo-plugin-existing')
    mkdirSync(pluginPath, { recursive: true })

    const argv = createMockArgv({
      name: 'existing',
      pluginDir: tmpDir,
      pluginMakeDir: undefined,
      scriptName: 'semo',
      force: false,
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('Destination existed, command abort!')
  })

  it('removes existing and recreates with --force', async () => {
    const { warn } = await import('@semo/core')
    const pluginPath = path.resolve(tmpDir, 'semo-plugin-forced')
    mkdirSync(pluginPath, { recursive: true })

    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any)

    const argv = createMockArgv({
      name: 'forced',
      pluginDir: tmpDir,
      pluginMakeDir: undefined,
      scriptName: 'semo',
      force: true,
    })
    await handler(argv)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('deleted'))
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/generate/plugin.js')
    expect(mod.command).toBe('plugin <name>')
    expect(mod.aliases).toBe('p')
  })
})
