import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'

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

describe('run handler', () => {
  let handler: typeof import('../../src/commands/run.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/run.js')
    handler = mod.handler
  })

  it('normalizes plugin name with prefix', async () => {
    const argv = createMockArgv({
      plugin: 'test',
      force: false,
      _: ['run'],
      '--': [],
      scriptName: 'semo',
      $input: '',
    })
    await handler(argv)
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      'semo-plugin-test',
      'run-plugin-cache',
      true,
      false
    )
  })

  it('does not double-prefix plugin name', async () => {
    const argv = createMockArgv({
      plugin: 'semo-plugin-already',
      force: false,
      _: ['run'],
      '--': [],
      scriptName: 'semo',
      $input: '',
    })
    await handler(argv)
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      'semo-plugin-already',
      'run-plugin-cache',
      true,
      false
    )
  })

  it('adds scope prefix when specified', async () => {
    const argv = createMockArgv({
      plugin: 'test',
      scope: 'myorg',
      force: false,
      _: ['run'],
      '--': [],
      scriptName: 'semo',
      $input: '',
    })
    await handler(argv)
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      '@myorg/semo-plugin-test',
      'run-plugin-cache',
      true,
      false
    )
  })

  it('reports error when plugin install fails', async () => {
    const { error } = await import('@semo/core')
    const argv = createMockArgv({
      plugin: 'broken',
      _: ['run'],
      '--': [],
      scriptName: 'semo',
      $input: '',
      $core: {
        installPackage: vi.fn().mockImplementation(() => {
          throw new Error('not found')
        }),
      },
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('not found'))
  })

  it('installs dependent plugins with --with', async () => {
    const argv = createMockArgv({
      plugin: 'main',
      with: ['dep1', 'dep2'],
      force: false,
      _: ['run'],
      '--': [],
      scriptName: 'semo',
      $input: '',
    })
    await handler(argv)
    expect(argv.$core.installPackage).toHaveBeenCalledTimes(3)
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      'semo-plugin-main',
      'run-plugin-cache',
      true,
      false
    )
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      'semo-plugin-dep1',
      'run-plugin-cache',
      true,
      false
    )
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      'semo-plugin-dep2',
      'run-plugin-cache',
      true,
      false
    )
  })

  it('spawns command after install', async () => {
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any)

    const argv = createMockArgv({
      plugin: 'test',
      _: ['run'],
      '--': [],
      scriptName: 'semo',
      $input: '',
    })
    await handler(argv)
    // Should call spawnSync for the actual command execution (not just `which`)
    expect(spawnSync).toHaveBeenCalled()
  })

  it('reports error when dependent plugin install fails', async () => {
    const { error } = await import('@semo/core')
    const installMock = vi
      .fn()
      .mockImplementationOnce(() => {}) // main plugin succeeds
      .mockImplementationOnce(() => {
        throw new Error('dep failed')
      }) // dep fails
    const argv = createMockArgv({
      plugin: 'main',
      with: 'dep',
      force: false,
      _: ['run'],
      '--': [],
      scriptName: 'semo',
      $input: '',
      $core: { installPackage: installMock },
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('not found'))
  })

  it('runs without plugin name', async () => {
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any)

    const argv = createMockArgv({
      plugin: undefined,
      force: false,
      _: ['run'],
      '--': [],
      scriptName: 'semo',
      $input: '',
    })
    await handler(argv)
    // Should still call spawnSync for command execution
    expect(spawnSync).toHaveBeenCalled()
  })

  it('passes additional args from --', async () => {
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any)

    const argv = createMockArgv({
      plugin: 'test',
      force: false,
      _: ['run'],
      '--': ['--verbose', '--debug'],
      scriptName: 'semo',
      $input: '',
    })
    await handler(argv)
    // The last spawnSync call should include the extra args
    const calls = vi.mocked(spawnSync).mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall[1]).toEqual(
      expect.arrayContaining(['--verbose', '--debug'])
    )
  })

  it('handles spawn error gracefully', async () => {
    const { error } = await import('@semo/core')
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockImplementation((cmd: any) => {
      if (cmd === 'which') return { status: 0 } as any
      throw new Error('spawn error')
    })

    const argv = createMockArgv({
      plugin: 'test',
      force: false,
      _: ['run'],
      '--': [],
      scriptName: 'semo',
      $input: '',
      verbose: false,
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('spawn error')
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/run.js')
    expect(mod.command).toBe('run [plugin]')
    expect(mod.plugin).toBe('semo')
  })
})
