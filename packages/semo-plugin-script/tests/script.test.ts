import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockArgv } from '../../core/tests/helpers/mock-argv.js'
import {
  createTempDir,
  removeTempDir,
  writeFile,
} from '../../core/tests/helpers/test-utils.js'
import { mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'

vi.mock('@semo/core', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@semo/core')>()
  return {
    ...orig,
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  }
})

// ---- script handler ----
describe('script handler', () => {
  let handler: typeof import('../src/commands/script.js').handler
  let tmpDir: string

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../src/commands/script.js')
    handler = mod.handler
    tmpDir = createTempDir('script')
  })

  afterEach(() => {
    removeTempDir(tmpDir)
  })

  it('executes script file with handler export', async () => {
    const scriptPath = writeFile(
      tmpDir,
      'test-script.mjs',
      'export const handler = async (argv) => { argv.$testResult = "ok" }'
    )
    const argv = createMockArgv({ file: scriptPath })
    await handler(argv)
    expect(argv.$testResult).toBe('ok')
  })

  it('reports error when script has no handler', async () => {
    const { error } = await import('@semo/core')
    const scriptPath = writeFile(
      tmpDir,
      'no-handler.mjs',
      'export const foo = 1'
    )
    const argv = createMockArgv({ file: scriptPath })
    await handler(argv)
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('handler not exist')
    )
  })

  it('reports error for non-existent script file', async () => {
    const { error } = await import('@semo/core')
    const argv = createMockArgv({
      file: path.resolve(tmpDir, 'nonexistent.mjs'),
    })
    await handler(argv)
    expect(error).toHaveBeenCalled()
  })

  it('exports correct metadata', async () => {
    const mod = await import('../src/commands/script.js')
    expect(mod.command).toBe('script [file]')
    expect(mod.aliases).toBe('scr')
  })
})

// ---- generate/script handler ----
describe('generate/script handler', () => {
  let handler: typeof import('../src/extends/semo/src/commands/generate/script.js').handler
  let tmpDir: string

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import(
      '../src/extends/semo/src/commands/generate/script.js'
    )
    handler = mod.handler
    tmpDir = createTempDir('gen-script')
  })

  afterEach(() => {
    removeTempDir(tmpDir)
  })

  it('reports error when scriptDir is missing', async () => {
    const { error } = await import('@semo/core')
    const argv = createMockArgv({
      name: 'test',
      scriptDir: undefined,
      scriptMakeDir: undefined,
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('scriptDir'))
  })

  it('reports error when scriptDir does not exist', async () => {
    const { error } = await import('@semo/core')
    const argv = createMockArgv({
      name: 'test',
      scriptDir: path.resolve(tmpDir, 'nonexistent'),
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('scriptDir'))
  })

  it('creates script file with timestamp prefix', async () => {
    const { success } = await import('@semo/core')
    const scriptDir = path.resolve(tmpDir, 'scripts')
    mkdirSync(scriptDir, { recursive: true })

    const argv = createMockArgv({
      name: 'MyScript',
      scriptDir,
      format: 'esm',
    })
    await handler(argv)
    expect(success).toHaveBeenCalled()
    const files = readdirSync(scriptDir)
    expect(files.length).toBe(1)
    // Filename should have timestamp prefix and kebab-case name
    expect(files[0]).toMatch(/^\d+_my-script\.js$/)
  })

  it('creates typescript script file', async () => {
    const { success } = await import('@semo/core')
    const scriptDir = path.resolve(tmpDir, 'scripts')
    mkdirSync(scriptDir, { recursive: true })

    const argv = createMockArgv({
      name: 'tsScript',
      scriptDir,
      format: 'typescript',
      typescript: true,
    })
    await handler(argv)
    expect(success).toHaveBeenCalled()
    const files = readdirSync(scriptDir)
    expect(files[0]).toMatch(/\.ts$/)
  })

  it('exports correct metadata', async () => {
    const mod = await import(
      '../src/extends/semo/src/commands/generate/script.js'
    )
    expect(mod.command).toBe('script <name>')
    expect(mod.aliases).toContain('scr')
  })
})
