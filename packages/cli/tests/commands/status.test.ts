import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'

vi.mock('@semo/core', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@semo/core')>()
  return { ...orig, error: vi.fn(), info: vi.fn(), outputTable: vi.fn() }
})

describe('status handler', () => {
  let handler: typeof import('../../src/commands/status.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/status.js')
    handler = mod.handler
  })

  it('outputs status table from hook results', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        invokeHook: vi.fn().mockResolvedValue({
          semo: { version: '2.0.0', node: '20.0.0' },
        }),
      },
    })
    await handler(argv)
    expect(outputTable).toHaveBeenCalled()
  })

  it('skips empty hook results', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        invokeHook: vi.fn().mockResolvedValue({
          semo: {},
          empty: null,
        }),
      },
    })
    await handler(argv)
    expect(outputTable).not.toHaveBeenCalled()
  })

  it('handles error gracefully', async () => {
    const { error } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        invokeHook: vi.fn().mockRejectedValue(new Error('hook failed')),
      },
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('hook failed')
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/status.js')
    expect(mod.command).toBe('status')
    expect(mod.aliases).toBe('st')
    expect(mod.plugin).toBe('semo')
  })
})
