import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'
import {
  createTempDir,
  removeTempDir,
  writeFile,
} from '../../../core/tests/helpers/test-utils.js'

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

// Mock the repl module to avoid actually starting a REPL
vi.mock('../../src/common/repl.js', () => ({
  openRepl: vi.fn().mockResolvedValue(undefined),
  importPackage: vi.fn().mockReturnValue(() => ({})),
}))

describe('repl handler', () => {
  let handler: typeof import('../../src/commands/repl.js').handler

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/repl.js')
    handler = mod.handler
  })

  it('calls openRepl with context', async () => {
    const { openRepl } = await import('../../src/common/repl.js')
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: false,
      prompt: '>>> ',
      extract: '',
      require: [],
      import: [],
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
        invokeHook: vi.fn().mockResolvedValue({}),
      },
    })
    await handler(argv)
    expect(openRepl).toHaveBeenCalled()
    const context = vi.mocked(openRepl).mock.calls[0][0]
    expect(context).toHaveProperty('Semo')
    expect(context.Semo).toHaveProperty('argv')
  })

  it('invokes repl hook when hook option is true', async () => {
    const { openRepl } = await import('../../src/common/repl.js')
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: true,
      prompt: '>>> ',
      extract: '',
      require: [],
      import: [],
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
        invokeHook: vi.fn().mockResolvedValue({
          semo: { VERSION: '1.0' },
        }),
      },
    })
    await handler(argv)
    expect(argv.$core.invokeHook).toHaveBeenCalledWith(
      'semo:repl',
      expect.objectContaining({ mode: 'group' })
    )
    const context = vi.mocked(openRepl).mock.calls[0][0]
    expect(context.Semo.hooks).toBeDefined()
  })

  it('extracts values from context with string extract', async () => {
    const { openRepl } = await import('../../src/common/repl.js')
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: true,
      prompt: '>>> ',
      extract: 'Semo.hooks',
      require: [],
      import: [],
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
        invokeHook: vi.fn().mockResolvedValue({
          semo: { myval: 42 },
        }),
      },
    })
    await handler(argv)
    const context = vi.mocked(openRepl).mock.calls[0][0]
    // extract should place 'hooks' key at context root
    expect(context).toHaveProperty('hooks')
  })

  it('imports required packages', async () => {
    const { openRepl } = await import('../../src/common/repl.js')
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: false,
      prompt: '>>> ',
      extract: '',
      require: ['lodash:_'],
      import: [],
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
        invokeHook: vi.fn().mockResolvedValue({}),
      },
    })
    await handler(argv)
    const context = vi.mocked(openRepl).mock.calls[0][0]
    expect(context).toHaveProperty('_')
  })

  it('invokes hook with string filter', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: 'myplugin,other',
      prompt: '>>> ',
      extract: '',
      require: [],
      import: [],
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
        invokeHook: vi.fn().mockResolvedValue({
          'semo-plugin-myplugin': { data: 1 },
        }),
      },
    })
    await handler(argv)
    expect(argv.$core.invokeHook).toHaveBeenCalledWith(
      'semo:repl',
      expect.objectContaining({ include: expect.any(Array) })
    )
  })

  it('shortens plugin prefix keys in hook results', async () => {
    const { openRepl } = await import('../../src/common/repl.js')
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: true,
      prompt: '>>> ',
      extract: '',
      require: [],
      import: [],
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
        invokeHook: vi.fn().mockResolvedValue({
          'semo-plugin-myplugin': { helper: 'fn' },
          semo: { VERSION: '1.0' },
        }),
      },
    })
    await handler(argv)
    const context = vi.mocked(openRepl).mock.calls[0][0]
    expect(context.Semo.hooks).toBeDefined()
  })

  it('handles extract as object', async () => {
    const { openRepl } = await import('../../src/common/repl.js')
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: true,
      prompt: '>>> ',
      extract: { Semo: ['hooks'] },
      require: [],
      import: [],
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
        invokeHook: vi.fn().mockResolvedValue({
          semo: { data: 'value' },
        }),
      },
    })
    await handler(argv)
    const context = vi.mocked(openRepl).mock.calls[0][0]
    expect(context).toHaveProperty('hooks')
  })

  it('reads config defaults from getPluginConfig', async () => {
    const getPluginConfig = vi
      .fn()
      .mockReturnValueOnce(true) // repl.hook
      .mockReturnValueOnce(false) // hook fallback (unused since first returned true)
      .mockReturnValueOnce('$ ') // repl.prompt
      .mockReturnValueOnce('> ') // prompt fallback (unused)
      .mockReturnValueOnce('') // repl.extract
      .mockReturnValueOnce('') // extract fallback
      .mockReturnValueOnce([]) // repl.require
      .mockReturnValueOnce([]) // require fallback
      .mockReturnValueOnce([]) // repl.import
      .mockReturnValueOnce([]) // import fallback

    const argv = createMockArgv({
      scriptName: 'semo',
      // These are undefined so handler reads from config
      hook: undefined,
      prompt: undefined,
      extract: undefined,
      require: undefined,
      import: undefined,
      $core: {
        getPluginConfig,
        invokeHook: vi.fn().mockResolvedValue({}),
      },
    })
    await handler(argv)
    expect(getPluginConfig).toHaveBeenCalled()
  })

  it('handles error in handler', async () => {
    const { error } = await import('@semo/core')
    const { openRepl } = await import('../../src/common/repl.js')
    vi.mocked(openRepl).mockRejectedValueOnce(new Error('repl crashed'))

    const argv = createMockArgv({
      scriptName: 'semo',
      hook: false,
      prompt: '>>> ',
      extract: '',
      require: [],
      import: [],
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
        invokeHook: vi.fn().mockResolvedValue({}),
      },
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('repl crashed'))
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/repl.js')
    expect(mod.command).toBe('repl [replFile]')
    expect(mod.aliases).toBe('r')
    expect(mod.plugin).toBe('semo')
  })
})

describe('repl with replFile', () => {
  let handler: typeof import('../../src/commands/repl.js').handler
  let tmpDir: string
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/repl.js')
    handler = mod.handler
    tmpDir = createTempDir('repl-file')
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  })

  afterEach(() => {
    cwdSpy.mockRestore()
    removeTempDir(tmpDir)
  })

  it('loads repl file with handler export', async () => {
    const { openRepl } = await import('../../src/common/repl.js')
    writeFile(
      tmpDir,
      'repl-setup.mjs',
      'export const handler = async (argv, ctx) => { return { customVar: 42 } }'
    )
    const argv = createMockArgv({
      scriptName: 'semo',
      replFile: 'repl-setup.mjs',
      hook: false,
      prompt: '>>> ',
      extract: '',
      require: [],
      import: [],
      $core: {
        getPluginConfig: vi.fn().mockReturnValue(undefined),
        invokeHook: vi.fn().mockResolvedValue({}),
      },
    })
    await handler(argv)
    const context = vi.mocked(openRepl).mock.calls[0][0]
    expect(context).toHaveProperty('customVar', 42)
  })
})
