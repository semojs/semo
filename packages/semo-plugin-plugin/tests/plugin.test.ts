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
    colorize: orig.colorize,
    outputTable: vi.fn(),
  }
})

// ---- plugin/install ----
describe('plugin/install handler', () => {
  let handler: typeof import('../src/commands/plugin/install.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../src/commands/plugin/install.js')
    handler = mod.handler
  })

  it('adds semo-plugin- prefix when not present', async () => {
    const argv = createMockArgv({ plugin: ['foo'] })
    await handler(argv)
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      ['semo-plugin-foo'],
      'home-plugin-cache',
      true,
      undefined
    )
  })

  it('does not double-prefix if already present', async () => {
    const argv = createMockArgv({ plugin: ['semo-plugin-bar'] })
    await handler(argv)
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      ['semo-plugin-bar'],
      'home-plugin-cache',
      true,
      undefined
    )
  })

  it('adds scope prefix when scope is specified', async () => {
    const argv = createMockArgv({ plugin: ['test'], scope: 'myorg' })
    await handler(argv)
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      ['@myorg/semo-plugin-test'],
      'home-plugin-cache',
      true,
      undefined
    )
  })

  it('handles single plugin as string', async () => {
    const argv = createMockArgv({ plugin: 'single' })
    await handler(argv)
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      ['semo-plugin-single'],
      'home-plugin-cache',
      true,
      undefined
    )
  })

  it('passes force flag', async () => {
    const argv = createMockArgv({ plugin: ['x'], force: true })
    await handler(argv)
    expect(argv.$core.installPackage).toHaveBeenCalledWith(
      ['semo-plugin-x'],
      'home-plugin-cache',
      true,
      true
    )
  })

  it('exports correct metadata', async () => {
    const mod = await import('../src/commands/plugin/install.js')
    expect(mod.command).toBe('install <plugin...>')
    expect(mod.aliases).toBe('i')
  })
})

// ---- plugin/uninstall ----
describe('plugin/uninstall handler', () => {
  let handler: typeof import('../src/commands/plugin/uninstall.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../src/commands/plugin/uninstall.js')
    handler = mod.handler
  })

  it('adds semo-plugin- prefix and calls uninstallPackage', async () => {
    const argv = createMockArgv({ plugin: ['myplugin'] })
    await handler(argv)
    expect(argv.$core.uninstallPackage).toHaveBeenCalledWith(
      ['semo-plugin-myplugin'],
      'home-plugin-cache',
      true
    )
  })

  it('adds scope prefix when scope is specified', async () => {
    const argv = createMockArgv({ plugin: ['test'], scope: 'myorg' })
    await handler(argv)
    expect(argv.$core.uninstallPackage).toHaveBeenCalledWith(
      ['@myorg/semo-plugin-test'],
      'home-plugin-cache',
      true
    )
  })

  it('handles single plugin as string', async () => {
    const argv = createMockArgv({ plugin: 'one' })
    await handler(argv)
    expect(argv.$core.uninstallPackage).toHaveBeenCalledWith(
      ['semo-plugin-one'],
      'home-plugin-cache',
      true
    )
  })

  it('exports correct metadata', async () => {
    const mod = await import('../src/commands/plugin/uninstall.js')
    expect(mod.command).toBe('uninstall <plugin...>')
    expect(mod.aliases).toBe('un')
  })
})

// ---- plugin/list ----
describe('plugin/list handler', () => {
  let handler: typeof import('../src/commands/plugin/list.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../src/commands/plugin/list.js')
    handler = mod.handler
  })

  it('warns when no local plugins found', async () => {
    const { warn } = await import('@semo/core')
    const argv = createMockArgv({
      $core: { allPlugins: {}, combinedConfig: { pluginConfigs: {} } },
    })
    await handler(argv)
    expect(warn).toHaveBeenCalledWith('No plugins found.')
  })

  it('outputs table for local plugins', async () => {
    const { outputTable } = await import('@semo/core')
    const argv = createMockArgv({
      $core: {
        allPlugins: { 'semo-plugin-test': '/fake/path' },
        combinedConfig: { pluginConfigs: {} },
      },
    })
    await handler(argv)
    expect(outputTable).toHaveBeenCalled()
  })

  it('fetches remote plugins when --remote is set', async () => {
    const { outputTable } = await import('@semo/core')
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ results: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const argv = createMockArgv({
      remote: true,
      $core: {
        allPlugins: {},
        combinedConfig: { pluginConfigs: {} },
      },
    })
    await handler(argv)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('npms.io'))
    expect(outputTable).toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('shows remote plugins with installed/update status', async () => {
    const { outputTable } = await import('@semo/core')
    const mockFetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          results: [
            {
              package: {
                name: 'semo-plugin-test',
                version: '2.0.0',
                description: 'Test plugin',
              },
            },
            {
              package: {
                name: 'semo-plugin-other',
                version: '1.0.0',
                description:
                  'Other plugin with a long description that should be truncated at some point',
              },
            },
          ],
        }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const argv = createMockArgv({
      remote: true,
      $core: {
        allPlugins: { 'semo-plugin-test': '/path/test' },
        combinedConfig: {
          pluginConfigs: {
            'semo-plugin-test': { version: '1.0.0' },
          },
        },
      },
    })
    await handler(argv)
    expect(outputTable).toHaveBeenCalled()
    const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
    // header + 2 results
    expect(rows.length).toBe(3)
    // First result should be installed (sorted first)
    expect(rows[1][3]).toContain('Installed')
    // Second result should not be installed
    expect(rows[2][3]).toBe('Not installed')

    vi.unstubAllGlobals()
  })

  it('shortens plugin location with HOME replacement', async () => {
    const { outputTable } = await import('@semo/core')
    const origHome = process.env.HOME
    process.env.HOME = '/home/user'
    try {
      const argv = createMockArgv({
        $core: {
          allPlugins: { 'semo-plugin-test': '/home/user/.semo/plugins/test' },
          combinedConfig: { pluginConfigs: {} },
        },
      })
      await handler(argv)
      expect(outputTable).toHaveBeenCalled()
      const rows = vi.mocked(outputTable).mock.calls[0][0] as string[][]
      expect(rows[1][2]).toContain('~')
    } finally {
      process.env.HOME = origHome
    }
  })
})

// ---- plugins (namespace) ----
describe('plugins namespace handler', () => {
  let handler: typeof import('../src/commands/plugins.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../src/commands/plugins.js')
    handler = mod.handler
  })

  it('prints info when no subcommand', async () => {
    const { info } = await import('@semo/core')
    const argv = createMockArgv({ _: ['plugin'] })
    await handler(argv)
    expect(info).toHaveBeenCalledTimes(2)
  })

  it('does not print when subcommand present', async () => {
    const { info } = await import('@semo/core')
    const argv = createMockArgv({ _: ['plugin', 'install'] })
    await handler(argv)
    expect(info).not.toHaveBeenCalled()
  })
})
