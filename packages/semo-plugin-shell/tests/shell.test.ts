import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockArgv } from '../../core/tests/helpers/mock-argv.js'

vi.mock('@semo/core', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@semo/core')>()
  return {
    ...orig,
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    replHistory: vi.fn(),
    splitByChar: orig.splitByChar,
  }
})

// Mock node:repl to avoid actually starting a REPL
const mockReplServer = {
  context: {} as Record<string, any>,
  eval: vi.fn(),
  start: vi.fn(),
  defineCommand: vi.fn(),
}

vi.mock('node:repl', () => ({
  default: {
    start: vi.fn().mockReturnValue(mockReplServer),
  },
}))

vi.mock('node:child_process', async (importOriginal) => {
  const orig = await importOriginal<typeof import('node:child_process')>()
  return { ...orig, execSync: vi.fn() }
})

// ---- shell command handler ----
describe('shell handler', () => {
  let handler: typeof import('../src/commands/shell.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    mockReplServer.context = {}
    const mod = await import('../src/commands/shell.js')
    handler = mod.handler
  })

  it('calls openRepl with argv context', async () => {
    const repl = await import('node:repl')
    const argv = createMockArgv({
      scriptName: 'semo',
      prompt: '$ ',
      prefix: 'semo',
      debug: false,
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
      },
    })
    const result = await handler(argv)
    expect(repl.default.start).toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('uses plugin config for prefix and prompt', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        getPluginConfig: vi
          .fn()
          .mockReturnValueOnce('myprefix')
          .mockReturnValueOnce('>> ')
          .mockReturnValueOnce(true),
      },
    })
    await handler(argv)
    expect(argv.prefix).toBe('myprefix')
    expect(argv.prompt).toBe('>> ')
    expect(argv.debug).toBe(true)
  })

  it('returns true on error', async () => {
    const { error } = await import('@semo/core')
    // Make node:repl.start throw
    const repl = await import('node:repl')
    vi.mocked(repl.default.start).mockImplementationOnce(() => {
      throw new Error('repl error')
    })

    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
      },
    })
    const result = await handler(argv)
    expect(error).toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('exports correct metadata', async () => {
    const mod = await import('../src/commands/shell.js')
    expect(mod.command).toBe('shell')
    expect(mod.aliases).toBe('sh')
    expect(mod.plugin).toBe('shell')
  })

  it('exports builder function with correct options', async () => {
    const mod = await import('../src/commands/shell.js')
    const yargs = { option: vi.fn() }
    mod.builder(yargs)
    expect(yargs.option).toHaveBeenCalledWith('prompt', expect.any(Object))
    expect(yargs.option).toHaveBeenCalledWith('prefix', expect.any(Object))
    expect(yargs.option).toHaveBeenCalledWith('debug', expect.any(Object))
  })
})

// ---- corepl utility ----
describe('corepl', () => {
  let corepl: typeof import('../src/common/utils.js').corepl

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../src/common/utils.js')
    corepl = mod.corepl
  })

  it('sets custom eval on repl server', () => {
    const server = { eval: vi.fn() } as any
    corepl(server)
    expect(typeof server.eval).toBe('function')
  })

  it('handles empty command in eval', () => {
    const server = { eval: vi.fn() } as any
    corepl(server)
    const callback = vi.fn()
    server.eval('', { argv: { scriptName: 'semo', prefix: '' } }, '', callback)
    expect(callback).toHaveBeenCalled()
  })

  it('handles prefix change command', async () => {
    const { success } = await import('@semo/core')
    const server = { eval: vi.fn() } as any
    corepl(server)
    const callback = vi.fn()
    const context = { argv: { scriptName: 'semo', prefix: 'semo' } }
    server.eval('prefix = newprefix', context, '', callback)
    expect(context.argv.prefix).toBe('newprefix')
    expect(success).toHaveBeenCalled()
  })

  it('warns on recursive shell call', async () => {
    const { warn } = await import('@semo/core')
    const server = { eval: vi.fn() } as any
    corepl(server)
    const callback = vi.fn()
    server.eval(
      'shell sub',
      { argv: { scriptName: 'semo', prefix: 'semo' } },
      '',
      callback
    )
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Recursive'))
  })

  it('executes shell command via execSync', async () => {
    const { execSync } = await import('node:child_process')
    const server = { eval: vi.fn() } as any
    corepl(server)
    const callback = vi.fn()
    server.eval(
      'ls -la',
      { argv: { scriptName: 'semo', prefix: '', debug: false } },
      '',
      callback
    )
    expect(execSync).toHaveBeenCalledWith(
      ' ls -la',
      expect.objectContaining({ stdio: 'inherit' })
    )
    expect(callback).toHaveBeenCalled()
  })
})
