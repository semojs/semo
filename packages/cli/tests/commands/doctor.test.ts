import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'

vi.mock('@semo/core', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@semo/core')>()
  return { ...orig, error: vi.fn(), info: vi.fn(), outputTable: vi.fn() }
})

// Mock yaml for config file parse tests
vi.mock('yaml', () => ({
  default: { parse: vi.fn((s: string) => JSON.parse(s)) },
}))

// fs mocks
vi.mock('node:fs', async (importOriginal) => {
  const orig = await importOriginal<typeof import('node:fs')>()
  return {
    ...orig,
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn().mockReturnValue('{}'),
  }
})

describe('doctor command', () => {
  let handler: typeof import('../../src/commands/doctor.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/doctor.js')
    handler = mod.handler
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/doctor.js')
    expect(mod.command).toBe('doctor')
    expect(mod.aliases).toBe('doc')
    expect(mod.plugin).toBe('semo')
  })

  it('outputs doctor report table', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({}),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: {},
      },
    })
    await handler(argv)
    expect(outputTable).toHaveBeenCalled()
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    // Should have at least: Node version, Core version, Script name, Config file, Config schema
    expect(rows.length).toBeGreaterThanOrEqual(5)
  })

  it('shows Node.js version check', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({}),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: {},
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    expect(rows[0][0]).toBe('Node.js version')
  })

  it('shows Core version', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({}),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: {},
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    expect(rows[1][0]).toBe('Core version')
    expect(rows[1][2]).toBe('2.0.21')
  })

  it('shows Script name', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'mysemo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({}),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: {},
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    expect(rows[2][0]).toBe('Script name')
    expect(rows[2][2]).toBe('mysemo')
  })

  it('shows config file not found as WARN', async () => {
    const { existsSync } = await import('node:fs')
    vi.mocked(existsSync).mockReturnValue(false)

    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({}),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: {},
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    const configRow = rows.find((r) => r[0] === 'Config file')!
    expect(configRow[2]).toContain('not found')
  })

  it('shows config file parse error as FAIL', async () => {
    const fs = await import('node:fs')
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return String(p).endsWith('.semorc.yml')
    })
    vi.mocked(fs.readFileSync).mockReturnValue('invalid: yaml: [')
    const yamlMod = await import('yaml')
    vi.mocked(yamlMod.default.parse).mockImplementation(() => {
      throw new Error('parse error')
    })

    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({}),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: {},
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    const configRow = rows.find((r) => r[0] === 'Config file')!
    expect(configRow[2]).toContain('parse error')
  })

  it('skips home config directory plugin with PASS', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({}),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: { '.semo': '/Users/test/.semo' },
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    const pluginRow = rows.find((r) => r[0] === 'Plugin: .semo')!
    expect(pluginRow[2]).toContain('home config')
  })

  it('checks plugin health - path not found', async () => {
    const fs = await import('node:fs')
    vi.mocked(fs.existsSync).mockReturnValue(false)

    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({}),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: { 'semo-plugin-test': '/nonexistent/path' },
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    const pluginRow = rows.find((r) => r[0] === 'Plugin: semo-plugin-test')!
    expect(pluginRow[2]).toContain('path not found')
  })

  it('checks plugin health - valid plugin', async () => {
    const fs = await import('node:fs')
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue('{"name":"semo-plugin-test"}')
    const yamlMod = await import('yaml')
    vi.mocked(yamlMod.default.parse).mockReturnValue({})

    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({}),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: { 'semo-plugin-test': '/some/path' },
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    const pluginRow = rows.find((r) => r[0] === 'Plugin: semo-plugin-test')!
    expect(pluginRow[2]).toBe('/some/path')
  })

  it('shows config schema validation pass when no schema', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({}),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: {},
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    const schemaRow = rows.find((r) => r[0] === 'Config schema')!
    expect(schemaRow[2]).toContain('No schema declared')
  })

  it('shows config schema validation failure', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({
          commandDir: { type: 'string', required: true },
        }),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: {},
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    const schemaRow = rows.find((r) => r[0] === 'Config schema')!
    expect(schemaRow[2]).toContain('commandDir')
  })

  it('shows config schema validation pass when valid', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockResolvedValue({
          commandDir: { type: 'string' },
        }),
        getApplicationConfig: vi
          .fn()
          .mockReturnValue({ commandDir: 'lib/commands' }),
        allPlugins: {},
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    const schemaRow = rows.find((r) => r[0] === 'Config schema')!
    expect(schemaRow[2]).toContain('All fields valid')
  })

  it('handles invokeHook error gracefully', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      $core: {
        version: '2.0.21',
        invokeHook: vi.fn().mockRejectedValue(new Error('hook error')),
        getApplicationConfig: vi.fn().mockReturnValue({}),
        allPlugins: {},
      },
    })
    await handler(argv)
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    const schemaRow = rows.find((r) => r[0] === 'Config schema')!
    expect(schemaRow[2]).toContain('hook error')
  })
})
