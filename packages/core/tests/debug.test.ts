import { describe, it, expect } from 'vitest'
import {
  debugCore,
  debugCoreChannel,
  debugChannel,
} from '../src/common/debug.js'

describe('debugCore', () => {
  it('should return a function', () => {
    const fn = debugCore('test')
    expect(typeof fn).toBe('function')
  })

  it('should not throw when called', () => {
    const fn = debugCore('test')
    expect(() => fn('hello')).not.toThrow()
    expect(() => fn('msg', { extra: 1 })).not.toThrow()
  })
})

describe('debugCoreChannel', () => {
  it('should return a function', () => {
    const fn = debugCoreChannel('test')
    expect(typeof fn).toBe('function')
  })

  it('should accept channel and messages', () => {
    const fn = debugCoreChannel('test')
    expect(() => fn('mychannel', 'hello')).not.toThrow()
    expect(() => fn('mychannel', 'msg', { extra: 1 })).not.toThrow()
  })
})

describe('debugChannel', () => {
  it('should return a function', () => {
    const fn = debugChannel('test')
    expect(typeof fn).toBe('function')
  })

  it('should accept channel and messages', () => {
    const fn = debugChannel('test')
    expect(() => fn('mychannel', 'hello')).not.toThrow()
    expect(() => fn('mychannel', 'msg', { extra: 1 })).not.toThrow()
  })
})
