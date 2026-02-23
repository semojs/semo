import { describe, it, expect } from 'vitest'
import { Hook, setHookScriptName } from '../src/common/hook.js'

describe('Hook', () => {
  it('should create a Hook from a string description map', () => {
    const hook = new Hook('semo', {
      before_command: 'Runs before command',
      after_command: 'Runs after command',
    })

    const result = hook.getHook('semo')
    expect(result).toEqual({
      before_command: 'Runs before command',
      after_command: 'Runs after command',
    })
  })

  it('should create a Hook from a function', () => {
    const fn = () => ({ key: 'value' })
    const hook = new Hook('semo', fn)

    const result = hook.getHook('semo')
    expect(typeof result).toBe('function')
    expect((result as () => unknown)()).toEqual({ key: 'value' })
  })

  it('should return empty object for unmatched module name', () => {
    const hook = new Hook('semo', {
      status: 'Hook for status',
    })

    // 'otherModule' gets converted to 'semo-plugin-otherModule' which doesn't match 'semo'
    const result = hook.getHook('otherModule')
    expect(result).toEqual({})
  })

  it('should match plugin-prefixed names', () => {
    const hook = new Hook('semo-plugin-test', {
      status: 'Hook for status',
    })

    const result = hook.getHook('test')
    expect(result).toEqual({ status: 'Hook for status' })
  })

  it('should handle function hook returning the function', () => {
    const fn = (_core: any, _argv: any) => ({ received: true })
    const hook = new Hook('semo', fn)

    const result = hook.getHook('semo')
    expect(typeof result).toBe('function')
  })

  it('should create Hook with no handler (early return)', () => {
    const hook = new Hook('semo')
    const result = hook.getHook('semo')
    expect(result).toEqual({})
  })

  it('should create Hook from object-style mapping', () => {
    const hook = new Hook({
      'semo-plugin-foo': { status: 'foo status' },
      'semo-plugin-bar': () => ({ key: 'bar' }),
    })
    expect(hook.getHook('foo')).toEqual({ status: 'foo status' })
    expect(typeof hook.getHook('bar')).toBe('function')
  })

  it('should convert short names in object mapping', () => {
    const hook = new Hook({
      myPlugin: { test: 'value' },
    })
    const result = hook.getHook('myPlugin')
    expect(result).toEqual({ test: 'value' })
  })

  it('should throw for invalid name argument', () => {
    expect(() => new Hook(123 as any)).toThrow('Invalid hook')
    expect(() => new Hook(null as any)).toThrow('Invalid hook')
  })
})

describe('setHookScriptName', () => {
  it('should change the global script name used for conversion', () => {
    setHookScriptName('myapp')
    const hook = new Hook('myapp', { status: 'custom status' })
    expect(hook.getHook('myapp')).toEqual({ status: 'custom status' })

    // Plugin-prefixed with new script name
    const hook2 = new Hook('myapp-plugin-test', { foo: 'bar' })
    expect(hook2.getHook('test')).toEqual({ foo: 'bar' })

    // Restore default
    setHookScriptName('semo')
  })
})
