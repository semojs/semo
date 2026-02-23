import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'
import {
  createTempDir,
  removeTempDir,
} from '../../../core/tests/helpers/test-utils.js'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import yaml from 'yaml'

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

function mockCwd(dir: string) {
  return vi.spyOn(process, 'cwd').mockReturnValue(dir)
}

describe('init handler', () => {
  let handler: typeof import('../../src/commands/init.js').handler
  let tmpDir: string
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/init.js')
    handler = mod.handler
    tmpDir = createTempDir('init')
    cwdSpy = mockCwd(tmpDir)
  })

  afterEach(() => {
    cwdSpy.mockRestore()
    removeTempDir(tmpDir)
  })

  it('creates default rc file and directories', async () => {
    const { info } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      $prompt: {
        confirm: vi.fn().mockResolvedValue(true),
        select: vi.fn().mockResolvedValue('npm'),
      },
    })
    await handler(argv)
    expect(info).toHaveBeenCalledWith(expect.stringContaining('rc created'))
    const rcPath = path.resolve(tmpDir, '.semorc.yml')
    expect(existsSync(rcPath)).toBe(true)
    const config = yaml.parse(readFileSync(rcPath, 'utf8'))
    expect(config.commandDir).toBe('bin/semo/commands')
  })

  it('creates plugin mode rc file', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      plugin: true,
      force: true,
      $prompt: {
        confirm: vi.fn().mockResolvedValue(true),
        select: vi.fn().mockResolvedValue('npm'),
      },
    })
    await handler(argv)
    const rcPath = path.resolve(tmpDir, '.semorc.yml')
    expect(existsSync(rcPath)).toBe(true)
    const config = yaml.parse(readFileSync(rcPath, 'utf8'))
    expect(config.commandDir).toBe('src/commands')
    expect(config.hookDir).toBe('src/hooks')
  })

  it('creates typescript plugin mode rc file', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      plugin: true,
      typescript: true,
      force: true,
      $prompt: {
        confirm: vi.fn().mockResolvedValue(true),
        select: vi.fn().mockResolvedValue('npm'),
      },
    })
    await handler(argv)
    const rcPath = path.resolve(tmpDir, '.semorc.yml')
    const config = yaml.parse(readFileSync(rcPath, 'utf8'))
    expect(config.typescript).toBe(true)
    expect(config.commandDir).toBe('lib/commands')
    expect(config.commandMakeDir).toBe('src/commands')
  })

  it('warns and returns when user declines override', async () => {
    const { warn } = await import('@semo/core')
    // Create existing rc file
    const rcPath = path.resolve(tmpDir, '.semorc.yml')
    const { writeFileSync } = await import('node:fs')
    writeFileSync(rcPath, 'existing: true')

    const argv = createMockArgv({
      scriptName: 'semo',
      force: false,
      $prompt: {
        confirm: vi.fn().mockResolvedValue(false),
        select: vi.fn().mockResolvedValue('npm'),
      },
    })
    await handler(argv)
    expect(warn).toHaveBeenCalledWith('User aborted!')
  })

  it('force flag skips confirmation', async () => {
    const { info } = await import('@semo/core')
    // Create existing rc file
    const rcPath = path.resolve(tmpDir, '.semorc.yml')
    const { writeFileSync } = await import('node:fs')
    writeFileSync(rcPath, 'existing: true')

    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      $prompt: { confirm: vi.fn(), select: vi.fn().mockResolvedValue('npm') },
    })
    await handler(argv)
    expect(info).toHaveBeenCalledWith(expect.stringContaining('rc created'))
    // confirm should not be called since force is true
    expect(argv.$prompt.confirm).not.toHaveBeenCalled()
  })

  it('creates directories defined in rc', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      $prompt: {
        confirm: vi.fn().mockResolvedValue(true),
        select: vi.fn().mockResolvedValue('npm'),
      },
    })
    await handler(argv)
    expect(existsSync(path.resolve(tmpDir, 'bin/semo/commands'))).toBe(true)
    expect(existsSync(path.resolve(tmpDir, 'bin/semo/hooks'))).toBe(true)
  })

  it('uses detected package manager from lock file', async () => {
    const { writeFileSync } = await import('node:fs')
    writeFileSync(path.resolve(tmpDir, 'pnpm-lock.yaml'), '')
    const { info } = await import('@semo/core')

    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      add: 'some-package',
      $prompt: {
        confirm: vi.fn().mockResolvedValue(true),
        select: vi.fn().mockResolvedValue('npm'),
      },
    })
    await handler(argv)
    expect(info).toHaveBeenCalledWith(expect.stringContaining('pnpm'))
  })

  it('prompts for package manager when no lock file found', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      add: 'some-package',
      pm: '',
      $prompt: {
        confirm: vi.fn().mockResolvedValue(true),
        select: vi.fn().mockResolvedValue('npm'),
      },
    })
    await handler(argv)
    expect(argv.$prompt.select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('package manager'),
      })
    )
  })

  it('uses explicit pm option without detection', async () => {
    const { spawnSync } = await import('node:child_process')
    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      add: 'my-dep',
      pm: 'yarn',
      $prompt: { confirm: vi.fn().mockResolvedValue(true), select: vi.fn() },
    })
    await handler(argv)
    expect(spawnSync).toHaveBeenCalledWith(
      'yarn',
      expect.arrayContaining(['add', 'my-dep']),
      expect.any(Object)
    )
  })

  it('installs addDev packages with -D flag', async () => {
    const { spawnSync } = await import('node:child_process')
    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      addDev: 'vitest',
      pm: 'npm',
      $prompt: { confirm: vi.fn().mockResolvedValue(true), select: vi.fn() },
    })
    await handler(argv)
    expect(spawnSync).toHaveBeenCalledWith(
      'npm',
      expect.arrayContaining(['install', 'vitest', '-D']),
      expect.any(Object)
    )
  })

  it('runs npm init when package.json does not exist', async () => {
    const { spawnSync } = await import('node:child_process')
    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      pm: 'npm',
      $prompt: { confirm: vi.fn().mockResolvedValue(true), select: vi.fn() },
    })
    await handler(argv)
    // Should call npm init since no package.json
    expect(spawnSync).toHaveBeenCalledWith(
      'npm',
      ['init', '--yes'],
      expect.any(Object)
    )
  })

  it('runs pnpm init without --yes', async () => {
    const { spawnSync } = await import('node:child_process')
    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      pm: 'pnpm',
      $prompt: { confirm: vi.fn().mockResolvedValue(true), select: vi.fn() },
    })
    await handler(argv)
    // pnpm init doesn't take --yes
    expect(spawnSync).toHaveBeenCalledWith('pnpm', ['init'], expect.any(Object))
  })

  it('reports error when pm command not found', async () => {
    const { error } = await import('@semo/core')
    const { spawnSync } = await import('node:child_process')
    // Make `which` return status 1 for the pm check
    vi.mocked(spawnSync).mockImplementation((cmd: any, _args: any) => {
      if (cmd === 'which') return { status: 1 } as any
      return { status: 0, stdout: '', stderr: '' } as any
    })

    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      add: 'some-package',
      pm: 'bun',
      $prompt: { confirm: vi.fn().mockResolvedValue(true), select: vi.fn() },
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('bun package manager not found.')
  })

  it('handles error in handler catch block', async () => {
    const { error } = await import('@semo/core')
    // Force an error by failing cwd path
    cwdSpy.mockReturnValue('/nonexistent/path/that/will/fail')

    const argv = createMockArgv({
      scriptName: 'semo',
      force: true,
      $prompt: { confirm: vi.fn().mockResolvedValue(true), select: vi.fn() },
    })
    await handler(argv)
    expect(error).toHaveBeenCalled()
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/init.js')
    expect(mod.command).toBe('init')
    expect(mod.aliases).toBe('i')
    expect(mod.plugin).toBe('semo')
  })
})
