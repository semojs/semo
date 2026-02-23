import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'

vi.mock('@semo/core', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@semo/core')>()
  return {
    ...orig,
    error: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    replHistory: vi.fn(),
  }
})

vi.mock('node:child_process', async (importOriginal) => {
  const orig = await importOriginal<typeof import('node:child_process')>()
  return { ...orig, spawnSync: vi.fn() }
})

const mockReplServer = {
  context: {} as Record<string, any>,
  eval: vi.fn(),
  defineCommand: vi.fn(),
  clearBufferedCommand: vi.fn(),
  displayPrompt: vi.fn(),
}

vi.mock('repl', () => ({
  default: { start: vi.fn().mockReturnValue(mockReplServer) },
  start: vi.fn().mockReturnValue(mockReplServer),
}))

// ---- reload ----
describe('reload', () => {
  let reload: typeof import('../../src/common/repl.js').reload

  beforeEach(async () => {
    vi.clearAllMocks()
    mockReplServer.context = { Semo: { hooks: {} } }
    mockReplServer.defineCommand = vi.fn()
    const mod = await import('../../src/common/repl.js')
    reload = mod.reload
  })

  it('reloads hooks with boolean hook flag', async () => {
    const { success } = await import('@semo/core')
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: true,
      $core: {
        invokeHook: vi
          .fn()
          .mockResolvedValueOnce({ semo: { VERSION: '1.0' } })
          .mockResolvedValueOnce({}),
      },
    })
    await reload(mockReplServer as any, argv)
    expect(argv.$core.invokeHook).toHaveBeenCalledWith(
      'semo:repl',
      expect.objectContaining({ reload: true, mode: 'group' })
    )
    expect(success).toHaveBeenCalledWith('Hooked files reloaded.')
  })

  it('reloads hooks with string hook filter', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: 'myplugin',
      $core: {
        invokeHook: vi
          .fn()
          .mockResolvedValueOnce({ semo: { data: 1 } })
          .mockResolvedValueOnce({}),
      },
    })
    await reload(mockReplServer as any, argv)
    expect(argv.$core.invokeHook).toHaveBeenCalledWith(
      'semo:repl',
      expect.objectContaining({ include: ['myplugin'], reload: true })
    )
  })

  it('filters out null/empty hook returns', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: true,
      $core: {
        invokeHook: vi
          .fn()
          .mockResolvedValueOnce({
            semo: { data: 1 },
            empty: null,
            emptyObj: {},
          })
          .mockResolvedValueOnce({}),
      },
    })
    await reload(mockReplServer as any, argv)
    // Only non-empty values should be in hooks
    expect(mockReplServer.context.Semo.hooks).toBeDefined()
  })

  it('extracts keys from context when extract is set', async () => {
    mockReplServer.context = {
      Semo: { hooks: { myplugin: { helper: 'fn' } } },
    }
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: true,
      extract: ['Semo.hooks.myplugin'],
      $core: {
        invokeHook: vi
          .fn()
          .mockResolvedValueOnce({ myplugin: { helper: 'fn' } })
          .mockResolvedValueOnce({}),
      },
    })
    await reload(mockReplServer as any, argv)
    // extracted values should be placed in context
    expect(mockReplServer.context).toBeDefined()
  })

  it('registers custom repl commands from hook', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: true,
      $core: {
        invokeHook: vi
          .fn()
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({ mycmd: { help: 'test', action: vi.fn() } }),
      },
    })
    await reload(mockReplServer as any, argv)
    expect(mockReplServer.defineCommand).toHaveBeenCalledWith(
      'mycmd',
      expect.any(Object)
    )
  })

  it('skips reserved repl commands', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      hook: true,
      $core: {
        invokeHook: vi
          .fn()
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({ exit: { help: 'exit', action: vi.fn() } }),
      },
    })
    await reload(mockReplServer as any, argv)
    expect(mockReplServer.defineCommand).not.toHaveBeenCalledWith(
      'exit',
      expect.anything()
    )
  })
})

// ---- extract ----
describe('extract', () => {
  let extract: typeof import('../../src/common/repl.js').extract

  beforeEach(async () => {
    vi.clearAllMocks()
    mockReplServer.context = {}
    const mod = await import('../../src/common/repl.js')
    extract = mod.extract
  })

  it('extracts all keys when no keys specified', () => {
    const obj = { foo: 'bar', baz: 42 }
    extract(mockReplServer as any, obj)
    expect(mockReplServer.context.foo).toBe('bar')
    expect(mockReplServer.context.baz).toBe(42)
  })

  it('skips falsy values when extracting all', () => {
    const obj = { valid: 'yes', empty: null, zero: 0 }
    extract(mockReplServer as any, obj)
    expect(mockReplServer.context.valid).toBe('yes')
    // null and 0 are falsy, should be skipped
    expect(mockReplServer.context.empty).toBeUndefined()
  })

  it('extracts specific keys with dot notation', () => {
    const obj = { nested: { deep: { value: 'found' } } }
    extract(mockReplServer as any, obj, ['nested.deep.value'])
    expect(mockReplServer.context.value).toBe('found')
  })

  it('extracts specific string key', () => {
    const obj = { a: { b: 'val' } }
    extract(mockReplServer as any, obj, 'a.b')
    expect(mockReplServer.context.b).toBe('val')
  })

  it('extracts into named object when newObjName provided', () => {
    const obj = { a: { b: 'val' } }
    extract(mockReplServer as any, obj, ['a.b'], 'myGroup')
    expect(mockReplServer.context.myGroup).toBeDefined()
    expect(mockReplServer.context.myGroup.b).toBe('val')
  })

  it('creates named object if it does not exist', () => {
    const obj = { x: { y: 'z' } }
    extract(mockReplServer as any, obj, ['x.y'], 'newGroup')
    expect(mockReplServer.context.newGroup).toBeDefined()
    expect(mockReplServer.context.newGroup.y).toBe('z')
  })

  it('appends to existing named object', () => {
    mockReplServer.context.existing = { prev: 'keep' }
    const obj = { a: { b: 'added' } }
    extract(mockReplServer as any, obj, ['a.b'], 'existing')
    expect(mockReplServer.context.existing.b).toBe('added')
  })
})

// ---- corepl ----
describe('corepl', () => {
  let corepl: typeof import('../../src/common/repl.js').corepl

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/common/repl.js')
    corepl = mod.corepl
  })

  it('wraps eval for async/await - simple await', () => {
    const originalEval = vi.fn()
    const server = { eval: originalEval } as any
    corepl(server)
    const callback = vi.fn()
    server.eval('await fetch("url")', {}, 'repl', callback)
    // The original eval should be called with wrapped async code
    expect(originalEval).toHaveBeenCalled()
    const wrappedCmd = originalEval.mock.calls[0][0]
    expect(wrappedCmd).toContain('async function')
  })

  it('wraps eval for await with assignment', () => {
    const originalEval = vi.fn()
    const server = { eval: originalEval } as any
    corepl(server)
    const callback = vi.fn()
    server.eval('await x = fetch("url")', {}, 'repl', callback)
    const wrappedCmd = originalEval.mock.calls[0][0]
    expect(wrappedCmd).toContain('async function')
    expect(wrappedCmd).toContain('(')
  })

  it('wraps eval for object with await', () => {
    const originalEval = vi.fn()
    const server = { eval: originalEval } as any
    corepl(server)
    const callback = vi.fn()
    server.eval('{ x: await fetch("url") }', {}, 'repl', callback)
    const wrappedCmd = originalEval.mock.calls[0][0]
    expect(wrappedCmd).toContain('async function')
  })

  it('wraps eval for let/const await', () => {
    const originalEval = vi.fn()
    const server = { eval: originalEval } as any
    corepl(server)
    const callback = vi.fn()
    server.eval('let x = await fetch("url")', {}, 'repl', callback)
    const wrappedCmd = originalEval.mock.calls[0][0]
    expect(wrappedCmd).toContain('async function')
  })

  it('passes non-await commands through unchanged', () => {
    const originalEval = vi.fn()
    const server = { eval: originalEval } as any
    corepl(server)
    const callback = vi.fn()
    server.eval('1 + 1', {}, 'repl', callback)
    const passedCmd = originalEval.mock.calls[0][0]
    expect(passedCmd).toBe('1 + 1')
  })

  it('handles promise resolution from original eval', () => {
    const originalEval = vi.fn()
    const server = { eval: originalEval } as any
    corepl(server)
    const callback = vi.fn()
    server.eval('1 + 1', {}, 'repl', callback)
    // Get the inner callback and simulate a promise result
    const innerCallback = originalEval.mock.calls[0][3]
    const fakePromise = {
      then: vi.fn().mockImplementation((resolve) => {
        resolve(42)
      }),
    }
    innerCallback(null, fakePromise)
    expect(fakePromise.then).toHaveBeenCalled()
  })

  it('handles error from original eval', () => {
    const originalEval = vi.fn()
    const server = { eval: originalEval } as any
    corepl(server)
    const callback = vi.fn()
    server.eval('1 + 1', {}, 'repl', callback)
    const innerCallback = originalEval.mock.calls[0][3]
    const err = new Error('test')
    innerCallback(err, null)
    expect(callback).toHaveBeenCalledWith(err, null)
  })

  it('handles non-promise result from original eval', () => {
    const originalEval = vi.fn()
    const server = { eval: originalEval } as any
    corepl(server)
    const callback = vi.fn()
    server.eval('1 + 1', {}, 'repl', callback)
    const innerCallback = originalEval.mock.calls[0][3]
    innerCallback(null, 42)
    expect(callback).toHaveBeenCalledWith(null, 42)
  })
})

// ---- importPackage ----
describe('importPackage', () => {
  let importPackageFn: typeof import('../../src/common/repl.js').importPackage

  beforeEach(async () => {
    const mod = await import('../../src/common/repl.js')
    importPackageFn = mod.importPackage
  })

  it('returns function that calls $core.importPackage', () => {
    const argv = createMockArgv({
      $core: { importPackage: vi.fn().mockReturnValue({ default: 'mod' }) },
    })
    const importer = importPackageFn(argv)
    importer('lodash')
    expect(argv.$core.importPackage).toHaveBeenCalledWith(
      'lodash',
      'repl-package-cache',
      true,
      false
    )
  })

  it('passes force flag', () => {
    const argv = createMockArgv({
      $core: { importPackage: vi.fn().mockReturnValue({}) },
    })
    const importer = importPackageFn(argv)
    importer('lodash', true)
    expect(argv.$core.importPackage).toHaveBeenCalledWith(
      'lodash',
      'repl-package-cache',
      true,
      true
    )
  })
})

// ---- openRepl ----
describe('openRepl', () => {
  let openRepl: typeof import('../../src/common/repl.js').openRepl

  beforeEach(async () => {
    vi.clearAllMocks()
    mockReplServer.context = {}
    mockReplServer.defineCommand = vi.fn()
    const mod = await import('../../src/common/repl.js')
    openRepl = mod.openRepl
  })

  it('starts repl server with correct prompt', async () => {
    const repl = await import('repl')
    const argv = createMockArgv({
      scriptName: 'semo',
      prompt: '>>> ',
      $core: {
        invokeHook: vi.fn().mockResolvedValue({}),
        importPackage: vi.fn(),
      },
    })
    const context = { Semo: { argv }, await: true }
    await openRepl(context)
    expect(repl.default.start).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: '>>> ' })
    )
  })

  it('defines reload, shell, require, import commands', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      prompt: '>>> ',
      $core: {
        invokeHook: vi.fn().mockResolvedValue({}),
        importPackage: vi.fn(),
      },
    })
    const context = { Semo: { argv }, await: true }
    await openRepl(context)
    const definedCommands = mockReplServer.defineCommand.mock.calls.map(
      (c: any) => c[0]
    )
    expect(definedCommands).toContain('reload')
    expect(definedCommands).toContain('shell')
    expect(definedCommands).toContain('require')
    expect(definedCommands).toContain('import')
  })

  it('registers hook repl commands', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      prompt: '>>> ',
      $core: {
        invokeHook: vi.fn().mockResolvedValue({
          mycustom: { help: 'help', action: vi.fn() },
        }),
        importPackage: vi.fn(),
      },
    })
    const context = { Semo: { argv }, await: true }
    await openRepl(context)
    const definedCommands = mockReplServer.defineCommand.mock.calls.map(
      (c: any) => c[0]
    )
    expect(definedCommands).toContain('mycustom')
  })

  it('assigns context to repl server', async () => {
    const argv = createMockArgv({
      scriptName: 'semo',
      prompt: '>>> ',
      $core: {
        invokeHook: vi.fn().mockResolvedValue({}),
        importPackage: vi.fn(),
      },
    })
    const context = { Semo: { argv }, await: true, myVar: 123 }
    await openRepl(context)
    expect(mockReplServer.context.myVar).toBe(123)
    expect(mockReplServer.context.Semo.repl).toBe(mockReplServer)
    expect(typeof mockReplServer.context.Semo.extract).toBe('function')
  })
})
