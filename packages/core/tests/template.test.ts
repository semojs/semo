import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { renderTemplate } from '../src/common/template.js'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

describe('renderTemplate', () => {
  const tmpDir = path.resolve(os.tmpdir(), 'semo-template-test')
  const templatePath = path.resolve(tmpDir, 'test.hbs')

  beforeAll(() => {
    mkdirSync(tmpDir, { recursive: true })
  })

  afterAll(() => {
    try {
      rmSync(tmpDir, { recursive: true })
    } catch {}
  })

  it('should render a simple template', async () => {
    writeFileSync(templatePath, 'Hello {{name}}!')
    const result = await renderTemplate(templatePath, { name: 'World' })
    expect(result).toBe('Hello World!')
  })

  it('should handle template with no variables', async () => {
    writeFileSync(templatePath, 'Static content')
    const result = await renderTemplate(templatePath, {})
    expect(result).toBe('Static content')
  })

  it('should render multiple variables', async () => {
    writeFileSync(
      templatePath,
      '{{greeting}}, {{name}}! You have {{count}} messages.'
    )
    const result = await renderTemplate(templatePath, {
      greeting: 'Hi',
      name: 'Alice',
      count: '3',
    })
    expect(result).toBe('Hi, Alice! You have 3 messages.')
  })

  it('should use handlebars lazy-loading (second call uses cache)', async () => {
    writeFileSync(templatePath, '{{value}}')
    const result1 = await renderTemplate(templatePath, { value: 'first' })
    const result2 = await renderTemplate(templatePath, { value: 'second' })
    expect(result1).toBe('first')
    expect(result2).toBe('second')
  })

  it('should throw for non-existent template file', async () => {
    await expect(
      renderTemplate('/tmp/nonexistent-semo-template.hbs', {})
    ).rejects.toThrow()
  })
})
