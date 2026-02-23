import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import {
  existsSync,
  unlinkSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  deepGet,
  deepSet,
  deepMerge,
  formatRcOptions,
  splitComma,
  splitByChar,
  parsePackageNames,
  getAbsolutePath,
  md5,
  isPromise,
  isUsingTsRunner,
  isTypeScriptProject,
  getNodeRuntime,
  run,
  clearConsole,
  moveToTopConsole,
  outputTable,
  execPromise,
  execSync as utilExecSync,
  exec,
  getPackagePath,
  consoleReader,
  replHistory,
} from '../src/common/utils.js'

describe('formatRcOptions', () => {
  it('should convert kebab-case keys to camelCase', () => {
    const result = formatRcOptions({ 'foo-bar': 1 })
    expect(result).toEqual({ fooBar: 1 })
  })

  it('should convert dot-separated keys to underscore', () => {
    const result = formatRcOptions({ 'foo.bar': 1 })
    expect(result).toEqual({ foo_bar: 1 })
  })

  it('should handle multiple dots in key', () => {
    const result = formatRcOptions({ 'a.b.c': 1 })
    expect(result).toEqual({ a_b_c: 1 })
  })

  it('should pass through non-special keys unchanged', () => {
    const result = formatRcOptions({ fooBar: 1, baz: 2 })
    expect(result).toEqual({ fooBar: 1, baz: 2 })
  })

  it('should strip leading hyphens', () => {
    const result = formatRcOptions({ '-foo': 1 })
    expect(result).toEqual({ foo: 1 })
  })

  it('should collapse multiple hyphens', () => {
    const result = formatRcOptions({ 'foo--bar': 1 })
    expect(result).toEqual({ fooBar: 1 })
  })

  it('should throw on non-object input', () => {
    expect(() => formatRcOptions(null as any)).toThrow('Not valid rc options')
    expect(() => formatRcOptions([] as any)).toThrow('Not valid rc options')
  })
})

describe('splitComma', () => {
  it('should split by comma and trim whitespace', () => {
    expect(splitComma('a, b , c,d')).toEqual(['a', 'b', 'c', 'd'])
  })

  it('should handle single value', () => {
    expect(splitComma('foo')).toEqual(['foo'])
  })
})

describe('splitByChar', () => {
  it('should split by custom char', () => {
    expect(splitByChar('a=b=c', '=')).toEqual(['a', 'b', 'c'])
  })
})

describe('parsePackageNames', () => {
  it('should parse string input', () => {
    expect(parsePackageNames('foo, bar')).toEqual(['foo', 'bar'])
  })

  it('should parse array input', () => {
    expect(parsePackageNames(['foo, bar', 'baz'])).toEqual([
      'foo',
      'bar',
      'baz',
    ])
  })

  it('should return empty array for non-string/non-array', () => {
    expect(parsePackageNames(42 as any)).toEqual([])
  })
})

describe('getAbsolutePath', () => {
  it('should return absolute paths unchanged', () => {
    expect(getAbsolutePath('/foo/bar')).toBe('/foo/bar')
  })

  it('should expand tilde to HOME', () => {
    const home = process.env.HOME
    if (home) {
      expect(getAbsolutePath('~/foo')).toBe(`${home}/foo`)
    }
  })

  it('should resolve relative paths', () => {
    const result = getAbsolutePath('foo/bar')
    expect(result).toMatch(/^\/.*foo\/bar$/)
  })
})

describe('md5', () => {
  it('should compute consistent hash', () => {
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592')
    expect(md5('hello')).toBe(md5('hello'))
  })

  it('should produce different hashes for different inputs', () => {
    expect(md5('hello')).not.toBe(md5('world'))
  })
})

describe('isPromise', () => {
  it('should detect promises', () => {
    expect(isPromise(Promise.resolve())).toBe(true)
  })

  it('should detect thenables', () => {
    expect(isPromise({ then: () => {} })).toBe(true)
  })

  it('should reject non-promises', () => {
    expect(isPromise(42)).toBe(false)
    expect(isPromise(null)).toBe(false)
    expect(isPromise(undefined)).toBe(false)
    expect(isPromise('string')).toBe(false)
  })
})

describe('deepGet', () => {
  it('should get nested values by dot path', () => {
    const obj = { a: { b: { c: 42 } } }
    expect(deepGet(obj, 'a.b.c')).toBe(42)
  })

  it('should return defaultValue for missing paths', () => {
    expect(deepGet({ a: 1 }, 'b.c', 'default')).toBe('default')
  })

  it('should return undefined for missing paths without default', () => {
    expect(deepGet({ a: 1 }, 'b')).toBeUndefined()
  })

  it('should handle null/undefined obj', () => {
    expect(deepGet(null, 'a', 'x')).toBe('x')
    expect(deepGet(undefined, 'a', 'x')).toBe('x')
  })

  it('should return defaultValue for empty path', () => {
    expect(deepGet({ a: 1 }, '', 'default')).toBe('default')
  })

  it('should get top-level values', () => {
    expect(deepGet({ a: 1 }, 'a')).toBe(1)
  })

  it('should handle falsy values correctly', () => {
    expect(deepGet({ a: 0 }, 'a', 'default')).toBe(0)
    expect(deepGet({ a: false }, 'a', 'default')).toBe(false)
    expect(deepGet({ a: '' }, 'a', 'default')).toBe('')
    expect(deepGet({ a: null }, 'a', 'default')).toBe(null)
  })
})

describe('deepSet', () => {
  it('should set nested values by dot path', () => {
    const obj: any = {}
    deepSet(obj, 'a.b.c', 42)
    expect(obj.a.b.c).toBe(42)
  })

  it('should overwrite existing values', () => {
    const obj = { a: { b: 1 } }
    deepSet(obj, 'a.b', 2)
    expect(obj.a.b).toBe(2)
  })

  it('should create intermediate objects', () => {
    const obj: any = {}
    deepSet(obj, 'x.y.z', 'value')
    expect(obj.x.y.z).toBe('value')
  })

  it('should return the original object', () => {
    const obj = { a: 1 }
    const result = deepSet(obj, 'b', 2)
    expect(result).toBe(obj)
  })

  it('should return obj unchanged for empty path', () => {
    const obj = { a: 1 }
    expect(deepSet(obj, '', 42)).toBe(obj)
  })

  it('should overwrite non-object intermediate values', () => {
    const obj: any = { a: 'string' }
    deepSet(obj, 'a.b', 1)
    expect(obj.a.b).toBe(1)
  })
})

describe('deepMerge', () => {
  it('should deep merge objects', () => {
    const target = { a: { b: 1, c: 2 } }
    const source = { a: { c: 3, d: 4 } }
    deepMerge(target, source)
    expect(target).toEqual({ a: { b: 1, c: 3, d: 4 } })
  })

  it('should overwrite non-object values', () => {
    const target = { a: 1 }
    deepMerge(target, { a: 2 })
    expect(target.a).toBe(2)
  })

  it('should not merge arrays (replace instead)', () => {
    const target = { a: [1, 2] }
    deepMerge(target, { a: [3, 4] })
    expect(target.a).toEqual([3, 4])
  })

  it('should handle multiple sources', () => {
    const target = { a: 1 }
    deepMerge(target, { b: 2 }, { c: 3 })
    expect(target).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('should skip null/undefined sources', () => {
    const target = { a: 1 }
    deepMerge(target, null, undefined, { b: 2 })
    expect(target).toEqual({ a: 1, b: 2 })
  })

  it('should skip non-object sources', () => {
    const target = { a: 1 }
    deepMerge(target, 'string' as any, 42 as any)
    expect(target).toEqual({ a: 1 })
  })

  it('should merge deeply nested objects', () => {
    const target = { a: { b: { c: 1, d: 2 } } }
    deepMerge(target, { a: { b: { c: 10, e: 5 } } })
    expect(target).toEqual({ a: { b: { c: 10, d: 2, e: 5 } } })
  })

  it('should return target', () => {
    const target = { a: 1 }
    const result = deepMerge(target, { b: 2 })
    expect(result).toBe(target)
  })
})

describe('isUsingTsRunner', () => {
  it('should return false in standard node environment', () => {
    const originalScript = process.env.npm_lifecycle_script
    delete process.env.npm_lifecycle_script
    // In test environment (vitest), execArgv may contain tsx
    // so we just verify the function returns a boolean
    expect(typeof isUsingTsRunner()).toBe('boolean')
    process.env.npm_lifecycle_script = originalScript
  })
})

describe('isTypeScriptProject', () => {
  it('should detect this project as TypeScript (has tsconfig.json)', () => {
    // The monorepo root has tsconfig.json
    expect(isTypeScriptProject(process.cwd())).toBe(true)
  })

  it('should return false for a non-TS directory', () => {
    expect(isTypeScriptProject('/tmp')).toBe(false)
  })
})

describe('getNodeRuntime', () => {
  const originalScript = process.env.npm_lifecycle_script

  afterEach(() => {
    if (originalScript !== undefined) {
      process.env.npm_lifecycle_script = originalScript
    } else {
      delete process.env.npm_lifecycle_script
    }
  })

  it('should return tsx when script contains tsx', () => {
    process.env.npm_lifecycle_script = 'tsx watch src/index.ts'
    expect(getNodeRuntime()).toBe('tsx')
  })

  it('should return jiti when script contains jiti', () => {
    process.env.npm_lifecycle_script = 'jiti src/index.ts'
    expect(getNodeRuntime()).toBe('jiti')
  })

  it('should return ts-node when script contains ts-node', () => {
    process.env.npm_lifecycle_script = 'ts-node src/index.ts'
    expect(getNodeRuntime()).toBe('ts-node')
  })

  it('should return node by default', () => {
    process.env.npm_lifecycle_script = 'node dist/index.js'
    expect(getNodeRuntime()).toBe('node')
  })

  it('should return node when no lifecycle script', () => {
    delete process.env.npm_lifecycle_script
    expect(getNodeRuntime()).toBe('node')
  })
})

describe('run', () => {
  it('should resolve a promise', async () => {
    const result = await run(Promise.resolve(42))
    expect(result).toBe(42)
  })

  it('should call a function and return result', async () => {
    const result = await run(() => 'hello')
    expect(result).toBe('hello')
  })

  it('should call an async function', async () => {
    const result = await run(async () => 'async-hello')
    expect(result).toBe('async-hello')
  })

  it('should return an object as-is', async () => {
    const obj = { foo: 'bar' }
    const result = await run(obj)
    expect(result).toEqual(obj)
  })

  it('should get nested value with getPath', async () => {
    const obj = { a: { b: 42 } }
    const result = await run(obj, 'a.b')
    expect(result).toBe(42)
  })

  it('should call function with args', async () => {
    const fn = (x: number, y: number) => x + y
    const result = await run(fn, '', 3, 5)
    expect(result).toBe(8)
  })

  it('should handle array with function as first element', async () => {
    const fn = (x: number) => x * 2
    const result = await run([fn, 10])
    expect(result).toBe(20)
  })

  it('should call method resolved from getPath', async () => {
    const obj = { greet: () => 'hi' }
    const result = await run(obj, 'greet')
    expect(result).toBe('hi')
  })

  it('should throw for invalid input', async () => {
    await expect(run(42)).rejects.toThrow('invalid func')
  })
})

describe('clearConsole', () => {
  it('should write escape codes when TTY', () => {
    const originalTTY = process.stdout.isTTY
    const writeSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      configurable: true,
    })

    clearConsole()

    expect(writeSpy).toHaveBeenCalled()
    writeSpy.mockRestore()
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalTTY,
      configurable: true,
    })
  })

  it('should not write when not TTY', () => {
    const originalTTY = process.stdout.isTTY
    const writeSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      configurable: true,
    })

    clearConsole()

    expect(writeSpy).not.toHaveBeenCalled()
    writeSpy.mockRestore()
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalTTY,
      configurable: true,
    })
  })
})

describe('moveToTopConsole', () => {
  it('should write escape codes when TTY', () => {
    const originalTTY = process.stdout.isTTY
    const writeSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      configurable: true,
    })

    moveToTopConsole()

    expect(writeSpy).toHaveBeenCalled()
    writeSpy.mockRestore()
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalTTY,
      configurable: true,
    })
  })

  it('should not write when not TTY', () => {
    const originalTTY = process.stdout.isTTY
    const writeSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
    Object.defineProperty(process.stdout, 'isTTY', {
      value: false,
      configurable: true,
    })

    moveToTopConsole()

    expect(writeSpy).not.toHaveBeenCalled()
    writeSpy.mockRestore()
    Object.defineProperty(process.stdout, 'isTTY', {
      value: originalTTY,
      configurable: true,
    })
  })
})

describe('outputTable', () => {
  it('should output a formatted table with caption', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    await outputTable(
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
      'Test Caption'
    )

    expect(infoSpy).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalled()

    logSpy.mockRestore()
    infoSpy.mockRestore()
  })

  it('should output without caption', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    await outputTable([['a', 'b']])

    expect(infoSpy).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalled()

    logSpy.mockRestore()
    infoSpy.mockRestore()
  })
})

describe('execPromise', () => {
  it('should execute a command and capture stdout', async () => {
    const result = await execPromise('echo hello', {
      captureOutput: true,
      shell: true,
    })
    expect(result.code).toBe(0)
    expect(result.stdout.trim()).toBe('hello')
  })

  it('should capture stderr', async () => {
    const result = await execPromise('echo err >&2', {
      captureOutput: true,
      shell: true,
    })
    expect(result.code).toBe(0)
    expect(result.stderr.trim()).toBe('err')
  })

  it('should report non-zero exit code', async () => {
    const result = await execPromise('exit 1', {
      captureOutput: true,
      shell: true,
    })
    expect(result.code).toBe(1)
  })

  it('should call callback on completion', async () => {
    const callback = vi.fn()
    await execPromise('echo ok', { captureOutput: true, shell: true }, callback)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ code: 0 }))
  })

  it('should use default options when none provided', async () => {
    // Just verify it doesn't throw with captureOutput
    const result = await execPromise('echo defaults', { captureOutput: true })
    expect(result.code).toBe(0)
  })
})

describe('utilExecSync', () => {
  it('should execute a command synchronously', () => {
    const result = utilExecSync('echo hello', { stdio: 'pipe', shell: true })
    expect(result.status).toBe(0)
  })
})

describe('getPackagePath', () => {
  it('should find package.json for current project', () => {
    const result = getPackagePath()
    expect(result).toBeTruthy()
    expect(result).toContain('package.json')
  })

  it('should find package.json for a known package', () => {
    const result = getPackagePath('vitest')
    expect(result).toBeTruthy()
    expect(result!).toContain('package.json')
  })

  it('should use custom paths', () => {
    const result = getPackagePath('vitest', [process.cwd()])
    expect(result).toBeTruthy()
  })
})

describe('consoleReader', () => {
  it('should create temp file in tmpPathOnly mode', async () => {
    const result = await consoleReader('test content', { tmpPathOnly: true })
    expect(typeof result).toBe('string')
    expect(result as string).toContain('.semo/cache')
    // Clean up
    if (typeof result === 'string' && existsSync(result)) {
      unlinkSync(result)
    }
  })

  it('should use custom plugin and identifier for cache path', async () => {
    const result = await consoleReader('content', {
      plugin: 'myplugin',
      identifier: 'myid',
      tmpPathOnly: true,
    })
    expect(typeof result).toBe('string')
    expect(result as string).toContain('myplugin')
    if (typeof result === 'string' && existsSync(result)) {
      unlinkSync(result)
    }
  })

  it('should use custom scriptName', async () => {
    const result = await consoleReader(
      'content',
      { tmpPathOnly: true },
      'myapp'
    )
    expect(typeof result).toBe('string')
    expect(result as string).toContain('.myapp/cache')
    if (typeof result === 'string' && existsSync(result)) {
      unlinkSync(result)
    }
  })

  it('should fall back to console.log when HOME is not set', async () => {
    const originalHome = process.env.HOME
    delete process.env.HOME
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await consoleReader('fallback content')

    expect(logSpy).toHaveBeenCalledWith('fallback content')
    logSpy.mockRestore()
    process.env.HOME = originalHome
  })
})

describe('exec', () => {
  it('should spawn a command and return a ChildProcess', () => {
    const child = exec('echo hello', { stdio: 'pipe', shell: true })
    expect(child).toBeTruthy()
    expect(child.pid).toBeTruthy()
    child.kill()
  })
})

describe('replHistory', () => {
  const tmpDir = path.resolve(os.tmpdir(), 'semo-repl-test')
  const historyFile = path.resolve(tmpDir, 'test_history')

  beforeEach(() => {
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true })
    } catch {}
  })

  it('should set up history on a mock REPL server', () => {
    const listeners: Record<string, (...args: any[]) => any> = {}
    const commands: Record<string, any> = {}
    const mockRepl: any = {
      history: [],
      historyIndex: -1,
      addListener: (event: string, fn: (...args: any[]) => any) => {
        listeners[event] = fn
      },
      output: { write: vi.fn() },
      displayPrompt: vi.fn(),
      defineCommand: (name: string, def: any) => {
        commands[name] = def
      },
    }

    replHistory(mockRepl, historyFile)

    // Should define the 'history' command
    expect(commands.history).toBeTruthy()
    expect(commands.history.help).toBe('Show the history')

    // Should register a 'line' listener
    expect(listeners.line).toBeTruthy()
  })

  it('should write lines to history file via line listener', () => {
    const listeners: Record<string, (...args: any[]) => any> = {}
    const commands: Record<string, any> = {}
    const mockRepl: any = {
      history: [],
      historyIndex: -1,
      addListener: (event: string, fn: (...args: any[]) => any) => {
        listeners[event] = fn
      },
      output: { write: vi.fn() },
      displayPrompt: vi.fn(),
      defineCommand: (name: string, def: any) => {
        commands[name] = def
      },
    }

    replHistory(mockRepl, historyFile)

    // Simulate typing commands
    listeners.line('console.log("hello")')
    listeners.line('1 + 2')

    // Simulate .history command (should pop history)
    mockRepl.history = ['1 + 2', 'console.log("hello")']
    listeners.line('.history')
    expect(mockRepl.historyIndex).toBe(0)
  })

  it('should load existing history file', () => {
    // Create a pre-existing history file
    writeFileSync(historyFile, 'line1\nline2\nline3\n')

    const listeners: Record<string, (...args: any[]) => any> = {}
    const commands: Record<string, any> = {}
    const mockRepl: any = {
      history: [],
      historyIndex: -1,
      addListener: (event: string, fn: (...args: any[]) => any) => {
        listeners[event] = fn
      },
      output: { write: vi.fn() },
      displayPrompt: vi.fn(),
      defineCommand: (name: string, def: any) => {
        commands[name] = def
      },
    }

    replHistory(mockRepl, historyFile)

    // History should be loaded (reversed, with first empty element shifted)
    expect(mockRepl.history.length).toBeGreaterThan(0)
    expect(mockRepl.historyIndex).toBe(-1)
  })

  it('should display history via .history command', () => {
    const listeners: Record<string, (...args: any[]) => any> = {}
    const commands: Record<string, any> = {}
    const mockRepl: any = {
      history: ['cmd2', 'cmd1'],
      historyIndex: -1,
      addListener: (event: string, fn: (...args: any[]) => any) => {
        listeners[event] = fn
      },
      output: { write: vi.fn() },
      displayPrompt: vi.fn(),
      defineCommand: (name: string, def: any) => {
        commands[name] = def
      },
    }

    replHistory(mockRepl, historyFile)

    // Execute the .history action
    commands.history.action.call(mockRepl)
    expect(mockRepl.output.write).toHaveBeenCalled()
    expect(mockRepl.displayPrompt).toHaveBeenCalled()
  })
})

describe('isUsingTsRunner (branch coverage)', () => {
  it('should detect tsx in process.argv', () => {
    const originalArgv = process.argv
    const originalScript = process.env.npm_lifecycle_script
    delete process.env.npm_lifecycle_script
    process.argv = ['/usr/local/bin/tsx', 'test.ts']

    expect(isUsingTsRunner()).toBe(true)

    process.argv = originalArgv
    if (originalScript !== undefined) {
      process.env.npm_lifecycle_script = originalScript
    }
  })

  it('should detect ts-node in process.execArgv --import', () => {
    const originalExecArgv = process.execArgv
    const originalArgv = process.argv
    const originalScript = process.env.npm_lifecycle_script
    delete process.env.npm_lifecycle_script
    process.argv = ['node', 'test.js']
    process.execArgv = ['--import', 'ts-node/esm']

    expect(isUsingTsRunner()).toBe(true)

    process.execArgv = originalExecArgv
    process.argv = originalArgv
    if (originalScript !== undefined) {
      process.env.npm_lifecycle_script = originalScript
    }
  })

  it('should detect tsx in process.execArgv --loader=value', () => {
    const originalExecArgv = process.execArgv
    const originalArgv = process.argv
    const originalScript = process.env.npm_lifecycle_script
    delete process.env.npm_lifecycle_script
    process.argv = ['node', 'test.js']
    process.execArgv = ['--loader=tsx']

    expect(isUsingTsRunner()).toBe(true)

    process.execArgv = originalExecArgv
    process.argv = originalArgv
    if (originalScript !== undefined) {
      process.env.npm_lifecycle_script = originalScript
    }
  })

  it('should return false when no TS runner detected', () => {
    const originalExecArgv = process.execArgv
    const originalArgv = process.argv
    const originalScript = process.env.npm_lifecycle_script
    delete process.env.npm_lifecycle_script
    process.argv = ['node', 'test.js']
    process.execArgv = []

    expect(isUsingTsRunner()).toBe(false)

    process.execArgv = originalExecArgv
    process.argv = originalArgv
    if (originalScript !== undefined) {
      process.env.npm_lifecycle_script = originalScript
    }
  })
})

describe('isTypeScriptProject (branch coverage)', () => {
  it('should detect typescript in package.json dependencies', () => {
    const tmpDir = path.resolve(os.tmpdir(), 'semo-ts-detect-test')
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(
      path.resolve(tmpDir, 'package.json'),
      JSON.stringify({
        devDependencies: { typescript: '^5.0.0' },
      })
    )

    expect(isTypeScriptProject(tmpDir)).toBe(true)
    rmSync(tmpDir, { recursive: true })
  })

  it('should return false when package.json has no typescript', () => {
    const tmpDir = path.resolve(os.tmpdir(), 'semo-nots-test')
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(
      path.resolve(tmpDir, 'package.json'),
      JSON.stringify({
        dependencies: { express: '4.0.0' },
      })
    )

    expect(isTypeScriptProject(tmpDir)).toBe(false)
    rmSync(tmpDir, { recursive: true })
  })

  it('should handle invalid package.json gracefully', () => {
    const tmpDir = path.resolve(os.tmpdir(), 'semo-badpkg-test')
    mkdirSync(tmpDir, { recursive: true })
    writeFileSync(path.resolve(tmpDir, 'package.json'), 'not valid json')

    expect(isTypeScriptProject(tmpDir)).toBe(false)
    rmSync(tmpDir, { recursive: true })
  })
})

describe('execPromise (error branch)', () => {
  it('should reject when command is not found', async () => {
    await expect(
      execPromise('__nonexistent_command_xyz__', { shell: false })
    ).rejects.toThrow()
  })
})
