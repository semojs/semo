import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hook } from '@semo/core'

vi.mock('envinfo', () => ({
  default: {
    run: vi.fn().mockResolvedValue(
      JSON.stringify({
        System: { OS: 'macOS 14.0', Shell: { path: '/bin/zsh' } },
        Binaries: {
          Node: { version: '20.0.0' },
          npm: { version: '10.0.0' },
          Yarn: null,
          pnpm: { version: '8.0.0' },
        },
      })
    ),
  },
}))

describe('hooks/index', () => {
  let hookModule: typeof import('../../src/hooks/index.js')

  beforeEach(async () => {
    vi.clearAllMocks()
    hookModule = await import('../../src/hooks/index.js')
  })

  it('exports hook_hook as a Hook instance with known hooks', () => {
    expect(hookModule.hook_hook).toBeInstanceOf(Hook)
    const hookDefs = hookModule.hook_hook.getHook('semo')
    expect(hookDefs).toHaveProperty('status')
    expect(hookDefs).toHaveProperty('repl')
    expect(hookDefs).toHaveProperty('create_project_template')
  })

  it('hook_repl returns version from core package info', () => {
    const core = {
      loadCorePackageInfo: vi.fn().mockReturnValue({ version: '3.0.0' }),
    }
    const hookFn = hookModule.hook_repl.getHook('semo')
    const result = hookFn(core)
    expect(result).toEqual({ VERSION: '3.0.0' })
  })

  it('hook_create_project_template returns template repos', () => {
    const hookFn = hookModule.hook_create_project_template.getHook('semo')
    const result = hookFn()
    expect(result).toHaveProperty('semo_starter_plugin_typescript')
    expect(result.semo_starter_plugin_typescript.repo).toContain('github.com')
    expect(result.semo_starter_plugin_typescript.tags).toContain('plugin')
  })

  it('hook_status returns environment info', async () => {
    const core = {
      getApplicationConfig: vi.fn().mockReturnValue({ version: '1.0.0' }),
      version: '2.0.0',
      initOptions: { scriptName: 'semo' },
    }
    const hookFn = hookModule.hook_status.getHook('semo')
    const result = await hookFn(core)
    expect(result).toHaveProperty('os')
    expect(result).toHaveProperty('node')
    expect(result).toHaveProperty('hostname')
    expect(result).toHaveProperty('home')
  })

  it('hook_status handles missing binaries gracefully', async () => {
    const envinfo = await import('envinfo')
    vi.mocked(envinfo.default.run).mockResolvedValue(
      JSON.stringify({
        System: { OS: 'Linux', Shell: { path: '/bin/bash' } },
        Binaries: {
          Node: { version: '20.0.0' },
          npm: null,
          Yarn: null,
          pnpm: null,
        },
      })
    )

    const core = {
      getApplicationConfig: vi.fn().mockReturnValue({}),
      version: '2.0.0',
      initOptions: { scriptName: 'semo' },
    }
    const hookFn = hookModule.hook_status.getHook('semo')
    const result = await hookFn(core)
    expect(result).toHaveProperty('node')
    // npm/yarn/pnpm should be filtered out when null
    expect(result.npm).toBeUndefined()
  })
})
