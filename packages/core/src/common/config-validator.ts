export type ConfigFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'

export interface ConfigSchemaField {
  type: ConfigFieldType
  required?: boolean
  enum?: unknown[]
  description?: string
}

export interface ConfigSchema {
  [key: string]: ConfigSchemaField
}

export interface ValidationError {
  key: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Validate a config object against a schema.
 * Only keys declared in the schema are validated; undeclared keys are ignored.
 * An empty schema always returns valid.
 */
export function validateConfig(
  config: Record<string, unknown>,
  schema: ConfigSchema
): ValidationResult {
  const errors: ValidationError[] = []

  for (const [key, field] of Object.entries(schema)) {
    const value = config[key]

    // required check
    if (field.required && (!(key in config) || value === undefined)) {
      errors.push({ key, message: `Required field is missing.` })
      continue
    }

    // skip further checks if value is not present
    if (!(key in config) || value === undefined) {
      continue
    }

    // type check
    if (field.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push({
          key,
          message: `Expected type "array" but got "${typeof value}".`,
        })
        continue
      }
    } else if (field.type === 'object') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors.push({
          key,
          message: `Expected type "object" but got "${Array.isArray(value) ? 'array' : typeof value}".`,
        })
        continue
      }
    } else {
      if (typeof value !== field.type) {
        errors.push({
          key,
          message: `Expected type "${field.type}" but got "${typeof value}".`,
        })
        continue
      }
    }

    // enum check
    if (field.enum && !field.enum.includes(value)) {
      errors.push({
        key,
        message: `Value "${String(value)}" is not in allowed values: ${field.enum.map(String).join(', ')}.`,
      })
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Format a ValidationResult into a human-readable string.
 * Returns empty string when valid.
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.valid) {
    return ''
  }
  return result.errors.map((e) => `${e.key}: ${e.message}`).join('\n')
}
