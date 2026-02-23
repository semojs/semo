import { describe, it, expect } from 'vitest'
import {
  SemoError,
  PluginError,
  ConfigError,
  HookError,
} from '../src/common/errors.js'

describe('SemoError', () => {
  it('should set name, code, and message', () => {
    const err = new SemoError('something went wrong')
    expect(err.name).toBe('SemoError')
    expect(err.code).toBe('SEMO_ERROR')
    expect(err.message).toBe('something went wrong')
    expect(err).toBeInstanceOf(Error)
  })

  it('should accept custom code', () => {
    const err = new SemoError('msg', 'CUSTOM_CODE')
    expect(err.code).toBe('CUSTOM_CODE')
  })

  it('should support cause via ErrorOptions', () => {
    const cause = new Error('root cause')
    const err = new SemoError('wrapper', 'SEMO_ERROR', { cause })
    expect(err.cause).toBe(cause)
  })
})

describe('PluginError', () => {
  it('should set pluginName and code', () => {
    const err = new PluginError('semo-plugin-test', 'plugin failed')
    expect(err.name).toBe('PluginError')
    expect(err.code).toBe('PLUGIN_ERROR')
    expect(err.pluginName).toBe('semo-plugin-test')
    expect(err.message).toBe('plugin failed')
  })

  it('should be instanceof SemoError', () => {
    const err = new PluginError('test', 'msg')
    expect(err).toBeInstanceOf(SemoError)
    expect(err).toBeInstanceOf(Error)
  })

  it('should support cause', () => {
    const cause = new Error('original')
    const err = new PluginError('test', 'msg', { cause })
    expect(err.cause).toBe(cause)
  })
})

describe('ConfigError', () => {
  it('should set code to CONFIG_ERROR', () => {
    const err = new ConfigError('bad config')
    expect(err.name).toBe('ConfigError')
    expect(err.code).toBe('CONFIG_ERROR')
    expect(err.message).toBe('bad config')
  })

  it('should be instanceof SemoError', () => {
    const err = new ConfigError('msg')
    expect(err).toBeInstanceOf(SemoError)
    expect(err).toBeInstanceOf(Error)
  })

  it('should support cause', () => {
    const cause = new Error('parse error')
    const err = new ConfigError('msg', { cause })
    expect(err.cause).toBe(cause)
  })
})

describe('HookError', () => {
  it('should set hookName, pluginName, and code', () => {
    const err = new HookError('hook_test', 'semo-plugin-demo', 'hook failed')
    expect(err.name).toBe('HookError')
    expect(err.code).toBe('HOOK_ERROR')
    expect(err.hookName).toBe('hook_test')
    expect(err.pluginName).toBe('semo-plugin-demo')
    expect(err.message).toBe('hook failed')
  })

  it('should be instanceof SemoError', () => {
    const err = new HookError('hook_test', 'plugin', 'msg')
    expect(err).toBeInstanceOf(SemoError)
    expect(err).toBeInstanceOf(Error)
  })

  it('should support cause', () => {
    const cause = new Error('timeout')
    const err = new HookError('hook_test', 'plugin', 'msg', { cause })
    expect(err.cause).toBe(cause)
  })
})
