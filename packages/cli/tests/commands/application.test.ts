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
    colorize: orig.colorize,
  }
})

describe('application handler', () => {
  let handler: typeof import('../../src/commands/application.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/application.js')
    handler = mod.handler
  })

  it('prints info when called with no subcommand (_.length === 1)', async () => {
    const { info } = await import('@semo/core')
    const argv = createMockArgv({ _: ['application'] })
    handler(argv)
    expect(info).toHaveBeenCalledTimes(3)
  })

  it('does not print info when subcommand is present (_.length > 1)', async () => {
    const { info } = await import('@semo/core')
    const argv = createMockArgv({ _: ['application', 'sub'] })
    handler(argv)
    expect(info).not.toHaveBeenCalled()
  })

  it('exports correct command metadata', async () => {
    const mod = await import('../../src/commands/application.js')
    expect(mod.command).toBe('application')
    expect(mod.aliases).toBe('app')
    expect(mod.plugin).toBe('semo')
    expect(mod.desc).toBeTruthy()
  })
})
