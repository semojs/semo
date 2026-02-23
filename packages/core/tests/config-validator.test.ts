import { describe, it, expect } from 'vitest'
import {
  validateConfig,
  formatValidationResult,
  type ConfigSchema,
} from '../src/common/config-validator.js'

describe('validateConfig', () => {
  describe('type validation', () => {
    it('should pass when types match', () => {
      const schema: ConfigSchema = {
        name: { type: 'string' },
        port: { type: 'number' },
        debug: { type: 'boolean' },
        tags: { type: 'array' },
        options: { type: 'object' },
      }
      const config = {
        name: 'app',
        port: 3000,
        debug: true,
        tags: ['a', 'b'],
        options: { key: 'value' },
      }
      const result = validateConfig(config, schema)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should report error for wrong string type', () => {
      const result = validateConfig({ name: 123 }, { name: { type: 'string' } })
      expect(result.valid).toBe(false)
      expect(result.errors[0].key).toBe('name')
      expect(result.errors[0].message).toContain('string')
    })

    it('should report error for wrong number type', () => {
      const result = validateConfig(
        { port: 'abc' },
        { port: { type: 'number' } }
      )
      expect(result.valid).toBe(false)
      expect(result.errors[0].key).toBe('port')
      expect(result.errors[0].message).toContain('number')
    })

    it('should report error for wrong boolean type', () => {
      const result = validateConfig(
        { debug: 1 },
        { debug: { type: 'boolean' } }
      )
      expect(result.valid).toBe(false)
      expect(result.errors[0].key).toBe('debug')
    })

    it('should report error when array expected but got object', () => {
      const result = validateConfig({ tags: {} }, { tags: { type: 'array' } })
      expect(result.valid).toBe(false)
      expect(result.errors[0].key).toBe('tags')
      expect(result.errors[0].message).toContain('array')
    })

    it('should report error when object expected but got array', () => {
      const result = validateConfig(
        { opts: [1, 2] },
        { opts: { type: 'object' } }
      )
      expect(result.valid).toBe(false)
      expect(result.errors[0].key).toBe('opts')
      expect(result.errors[0].message).toContain('object')
    })

    it('should report error when object expected but got null', () => {
      const result = validateConfig(
        { opts: null },
        { opts: { type: 'object' } }
      )
      expect(result.valid).toBe(false)
      expect(result.errors[0].key).toBe('opts')
    })
  })

  describe('required fields', () => {
    it('should report error when required field is missing', () => {
      const schema: ConfigSchema = {
        host: { type: 'string', required: true },
      }
      const result = validateConfig({}, schema)
      expect(result.valid).toBe(false)
      expect(result.errors[0].key).toBe('host')
      expect(result.errors[0].message).toContain('Required')
    })

    it('should report error when required field is undefined', () => {
      const result = validateConfig(
        { host: undefined },
        { host: { type: 'string', required: true } }
      )
      expect(result.valid).toBe(false)
      expect(result.errors[0].key).toBe('host')
    })

    it('should not report error when optional field is missing', () => {
      const schema: ConfigSchema = {
        host: { type: 'string' },
      }
      const result = validateConfig({}, schema)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('enum validation', () => {
    it('should pass when value is in enum', () => {
      const schema: ConfigSchema = {
        env: { type: 'string', enum: ['dev', 'staging', 'prod'] },
      }
      const result = validateConfig({ env: 'dev' }, schema)
      expect(result.valid).toBe(true)
    })

    it('should report error when value is not in enum', () => {
      const schema: ConfigSchema = {
        env: { type: 'string', enum: ['dev', 'staging', 'prod'] },
      }
      const result = validateConfig({ env: 'test' }, schema)
      expect(result.valid).toBe(false)
      expect(result.errors[0].key).toBe('env')
      expect(result.errors[0].message).toContain('not in allowed values')
    })
  })

  describe('undeclared keys', () => {
    it('should not report errors for keys not in schema', () => {
      const schema: ConfigSchema = {
        name: { type: 'string' },
      }
      const config = { name: 'app', extra: 42, another: true }
      const result = validateConfig(config, schema)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('empty schema', () => {
    it('should return valid for any config when schema is empty', () => {
      const result = validateConfig({ anything: 'goes', num: 42 }, {})
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('multiple errors', () => {
    it('should collect all errors', () => {
      const schema: ConfigSchema = {
        host: { type: 'string', required: true },
        port: { type: 'number' },
      }
      const result = validateConfig({ port: 'abc' }, schema)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors.map((e) => e.key)).toContain('host')
      expect(result.errors.map((e) => e.key)).toContain('port')
    })
  })
})

describe('formatValidationResult', () => {
  it('should return empty string when valid', () => {
    const result = formatValidationResult({ valid: true, errors: [] })
    expect(result).toBe('')
  })

  it('should format errors as key: message lines', () => {
    const result = formatValidationResult({
      valid: false,
      errors: [
        { key: 'host', message: 'Required field is missing.' },
        { key: 'port', message: 'Expected type "number" but got "string".' },
      ],
    })
    expect(result).toBe(
      'host: Required field is missing.\nport: Expected type "number" but got "string".'
    )
  })
})
