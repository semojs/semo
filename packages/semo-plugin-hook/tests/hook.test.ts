import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockArgv } from '../../core/tests/helpers/mock-argv.js'

vi.mock('@semo/core', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@semo/core')>()
  return {
    ...orig,
    error: vi.fn(),
    info: vi.fn(),
    fatal: vi.fn(),
    jsonLog: vi.fn(),
    colorize: orig.colorize,
    outputTable: vi.fn(),
  }
})

// ---- hook/info ----
describe('hook/info handler', () => {
  let handler: typeof import('../src/commands/hook/info.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../src/commands/hook/info.js')
    handler = mod.handler
  })

  it('calls fatal when no hook name provided', async () => {
    const { fatal } = await import('@semo/core')
    vi.mocked(fatal).mockImplementation((msg: any) => {
      throw new Error(String(msg))
    })
    const argv = createMockArgv({ hook: undefined })
    await expect(handler(argv)).rejects.toThrow('A hook is required.')
    expect(fatal).toHaveBeenCalledWith('A hook is required.')
  })

  it('strips hook_ prefix from hook name', async () => {
    const argv = createMockArgv({
      hook: 'hook_status',
      $core: { invokeHook: vi.fn().mockResolvedValue({ data: 'test' }) },
    })
    await handler(argv)
    expect(argv.$core.invokeHook).toHaveBeenCalledWith(
      'status',
      { mode: 'group' },
      argv
    )
  })

  it('invokes hook with group mode when no module specified', async () => {
    const hookResult = { semo: { version: '1.0' } }
    const argv = createMockArgv({
      hook: 'status',
      $core: { invokeHook: vi.fn().mockResolvedValue(hookResult) },
    })
    const { jsonLog } = await import('@semo/core')
    await handler(argv)
    expect(jsonLog).toHaveBeenCalledWith(hookResult)
  })

  it('invokes hook with replace mode and include when module specified', async () => {
    const argv = createMockArgv({
      hook: 'status',
      module: 'semo',
      $core: { invokeHook: vi.fn().mockResolvedValue({}) },
    })
    await handler(argv)
    expect(argv.$core.invokeHook).toHaveBeenCalledWith(
      'status',
      { include: ['semo'], mode: 'replace' },
      argv
    )
  })

  it('exports correct metadata', async () => {
    const mod = await import('../src/commands/hook/info.js')
    expect(mod.command).toBe('info <hook> [module]')
    expect(mod.plugin).toBe('hook')
  })
})

// ---- hook/list ----
describe('hook/list handler', () => {
  let handler: typeof import('../src/commands/hook/list.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../src/commands/hook/list.js')
    handler = mod.handler
  })

  it('renders table with hook info', async () => {
    const { outputTable, Hook } = await import('@semo/core')
    const hookObj = new Hook('semo', {
      status: 'Shows status',
      repl: 'REPL hook',
    })
    const argv = createMockArgv({
      $core: {
        invokeHook: vi.fn().mockResolvedValue({ semo: hookObj }),
      },
    })
    await handler(argv)
    expect(outputTable).toHaveBeenCalled()
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    // Header + 2 hooks
    expect(rows.length).toBe(3)
  })

  it('handles plain object hook values', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      $core: {
        invokeHook: vi.fn().mockResolvedValue({
          'test-plugin': {
            getHook: () => ({ myhook: 'description' }),
          },
        }),
      },
    })
    await handler(argv)
    expect(outputTable).toHaveBeenCalled()
  })

  it('exports correct metadata', async () => {
    const mod = await import('../src/commands/hook/list.js')
    expect(mod.command).toEqual(['list', '$0'])
    expect(mod.aliases).toEqual(['ls'])
  })
})
