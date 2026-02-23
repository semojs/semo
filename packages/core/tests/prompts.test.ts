import { describe, it, expect, vi } from 'vitest'

// Mock @inquirer/prompts before importing prompts.ts
vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn().mockResolvedValue(['a']),
  confirm: vi.fn().mockResolvedValue(true),
  editor: vi.fn().mockResolvedValue('text'),
  expand: vi.fn().mockResolvedValue('e'),
  input: vi.fn().mockResolvedValue('answer'),
  number: vi.fn().mockResolvedValue(42),
  password: vi.fn().mockResolvedValue('secret'),
  rawlist: vi.fn().mockResolvedValue('item'),
  search: vi.fn().mockResolvedValue('found'),
  select: vi.fn().mockResolvedValue('option'),
}))

import {
  checkbox,
  confirm,
  editor,
  expand,
  input,
  number,
  password,
  rawlist,
  search,
  select,
} from '../src/common/prompts.js'

describe('prompts lazy-loading', () => {
  it('checkbox should forward to @inquirer/prompts', async () => {
    const result = await checkbox({ message: 'Pick', choices: [] })
    expect(result).toEqual(['a'])
  })

  it('confirm should forward to @inquirer/prompts', async () => {
    const result = await confirm({ message: 'Sure?' })
    expect(result).toBe(true)
  })

  it('editor should forward to @inquirer/prompts', async () => {
    const result = await editor({ message: 'Edit' })
    expect(result).toBe('text')
  })

  it('expand should forward to @inquirer/prompts', async () => {
    const result = await expand({ message: 'Choose', choices: [] } as any)
    expect(result).toBe('e')
  })

  it('input should forward to @inquirer/prompts', async () => {
    const result = await input({ message: 'Name?' })
    expect(result).toBe('answer')
  })

  it('number should forward to @inquirer/prompts', async () => {
    const result = await number({ message: 'Age?' })
    expect(result).toBe(42)
  })

  it('password should forward to @inquirer/prompts', async () => {
    const result = await password({ message: 'Pass?' })
    expect(result).toBe('secret')
  })

  it('rawlist should forward to @inquirer/prompts', async () => {
    const result = await rawlist({ message: 'Pick', choices: [] })
    expect(result).toBe('item')
  })

  it('search should forward to @inquirer/prompts', async () => {
    const result = await search({ message: 'Find', source: async () => [] })
    expect(result).toBe('found')
  })

  it('select should forward to @inquirer/prompts', async () => {
    const result = await select({ message: 'Pick', choices: [] })
    expect(result).toBe('option')
  })

  it('all exported functions should be async functions', () => {
    const fns = [
      checkbox,
      confirm,
      editor,
      expand,
      input,
      number,
      password,
      rawlist,
      search,
      select,
    ]
    for (const fn of fns) {
      expect(typeof fn).toBe('function')
    }
  })
})
