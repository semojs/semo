import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  log,
  info,
  warn,
  error,
  success,
  colorize,
  colorfulLog,
  fatal,
  jsonLog,
  logJson,
} from '../src/common/log.js'

describe('log', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log a message', () => {
    log('hello')
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('should log empty string by default', () => {
    log()
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('should stringify object messages', () => {
    log({ key: 'value' })
    expect(consoleSpy).toHaveBeenCalledTimes(1)
    const output = consoleSpy.mock.calls[0][0]
    expect(output).toContain('key')
  })

  it('should handle circular reference objects gracefully', () => {
    const obj: any = { a: 1 }
    obj.self = obj
    log(obj)
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('should apply inverseColor when option is set', () => {
    log('inverse test', { inverseColor: true })
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('should use specified type for console output', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    log('typed', { type: 'warn' })
    expect(warnSpy).toHaveBeenCalledTimes(1)
    warnSpy.mockRestore()
  })

  it('should call process.exit when ifExit is true', () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never)
    log('bye', { ifExit: true, exitCode: 0 })
    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })

  it('should use exitCode 0 by default', () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never)
    log('bye', { ifExit: true })
    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })
})

describe('info', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log to console.info', () => {
    info('test message')
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('should stringify object messages', () => {
    info({ foo: 'bar' })
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })
})

describe('warn', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log to console.warn', () => {
    warn('warning')
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('should stringify object messages', () => {
    warn({ level: 'warning' })
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })
})

describe('error', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log to console.error', () => {
    error('error message')
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('should stringify object messages', () => {
    error({ code: 500 })
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })
})

describe('success', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log to console.log', () => {
    success('done')
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('should stringify object messages', () => {
    success({ status: 'ok' })
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })
})

describe('colorize', () => {
  it('should return a string', () => {
    const result = colorize('red', 'test')
    expect(typeof result).toBe('string')
  })

  it('should handle object messages', () => {
    const result = colorize('blue', { key: 'value' })
    expect(typeof result).toBe('string')
    expect(result).toContain('key')
  })
})

describe('colorfulLog', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log with a specified color', () => {
    colorfulLog('red', 'colored message')
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('should default to empty message', () => {
    colorfulLog('blue')
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })
})

describe('fatal', () => {
  it('should call error and process.exit', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never)
    fatal('critical error')
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
    errorSpy.mockRestore()
    exitSpy.mockRestore()
  })

  it('should use custom exit code', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never)
    fatal('critical', 2)
    expect(exitSpy).toHaveBeenCalledWith(2)
    errorSpy.mockRestore()
    exitSpy.mockRestore()
  })
})

describe('jsonLog', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log string messages directly', async () => {
    await jsonLog('hello')
    expect(consoleSpy).toHaveBeenCalledWith('hello')
  })

  it('should colorize and stringify objects', async () => {
    await jsonLog({ key: 'value' })
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('should colorize and stringify arrays', async () => {
    await jsonLog([1, 2, 3])
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })
})

describe('logJson alias', () => {
  it('should be the same function as jsonLog', () => {
    expect(logJson).toBe(jsonLog)
  })
})
