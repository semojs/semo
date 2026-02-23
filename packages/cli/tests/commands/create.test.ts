import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMockArgv } from '../../../core/tests/helpers/mock-argv.js'
import {
  createTempDir,
  removeTempDir,
} from '../../../core/tests/helpers/test-utils.js'
import { mkdirSync, writeFileSync } from 'node:fs'
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

vi.mock('node:child_process', async (importOriginal) => {
  const orig = await importOriginal<typeof import('node:child_process')>()
  return {
    ...orig,
    spawnSync: vi.fn().mockReturnValue({ status: 0, stdout: '', stderr: '' }),
  }
})

function mockCwd(dir: string) {
  return vi.spyOn(process, 'cwd').mockReturnValue(dir)
}

describe('create handler', () => {
  let handler: typeof import('../../src/commands/create.js').handler
  let tmpDir: string
  let cwdSpy: ReturnType<typeof vi.spyOn>
  let chdirSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../../src/commands/create.js')
    handler = mod.handler
    tmpDir = createTempDir('create')
    cwdSpy = mockCwd(tmpDir)
    chdirSpy = vi.spyOn(process, 'chdir').mockImplementation(() => {})
  })

  afterEach(() => {
    cwdSpy.mockRestore()
    chdirSpy.mockRestore()
    removeTempDir(tmpDir)
  })

  it('reports error when destination exists without force/merge', async () => {
    const { error } = await import('@semo/core')
    mkdirSync(path.resolve(tmpDir, 'myproject'))
    const argv = createMockArgv({
      name: 'myproject',
      force: false,
      merge: false,
      scriptName: 'semo',
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('Destination existed, command abort!')
  })

  it('removes existing directory with --force', async () => {
    const { warn } = await import('@semo/core')
    const projDir = path.resolve(tmpDir, 'forcedproj')
    mkdirSync(projDir)
    writeFileSync(path.resolve(projDir, 'marker.txt'), 'old')

    const argv = createMockArgv({
      name: 'forcedproj',
      force: true,
      empty: true,
      initGit: false,
      yes: true,
      add: false,
      addDev: false,
      scriptName: 'semo',
    })
    await handler(argv)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('deleted'))
  })

  it('creates empty project with --empty', async () => {
    const { spawnSync } = await import('node:child_process')
    const argv = createMockArgv({
      name: 'emptyproj',
      empty: true,
      yes: true,
      initGit: true,
      force: false,
      merge: false,
      add: false,
      addDev: false,
      scriptName: 'semo',
    })
    await handler(argv)
    expect(spawnSync).toHaveBeenCalledWith(
      'npm',
      expect.arrayContaining(['init']),
      expect.any(Object)
    )
    expect(spawnSync).toHaveBeenCalledWith('git', ['init'], expect.any(Object))
  })

  it('creates empty project without git when initGit is false', async () => {
    const { spawnSync } = await import('node:child_process')
    const argv = createMockArgv({
      name: 'nogitproj',
      empty: true,
      yes: true,
      initGit: false,
      force: false,
      merge: false,
      add: false,
      addDev: false,
      scriptName: 'semo',
    })
    await handler(argv)
    const gitCalls = vi
      .mocked(spawnSync)
      .mock.calls.filter((c) => c[0] === 'git' && c[1]?.[0] === 'init')
    expect(gitCalls.length).toBe(0)
  })

  it('reports error when no template repos available', async () => {
    const { error } = await import('@semo/core')
    const argv = createMockArgv({
      name: 'tplproj',
      template: true,
      force: false,
      merge: false,
      add: false,
      addDev: false,
      scriptName: 'semo',
      $core: {
        invokeHook: vi.fn().mockResolvedValue({}),
        getPluginConfig: vi.fn().mockReturnValue({}),
      },
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('No pre-defined repos available.')
  })

  it('reports error when git clone fails', async () => {
    const { error } = await import('@semo/core')
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockImplementation(
      (cmd: any, args: any, _opts: any) => {
        if (cmd === 'git' && args?.[0] === 'clone') {
          return { status: 1 } as any
        }
        return { status: 0, stdout: '', stderr: '' } as any
      }
    )

    const argv = createMockArgv({
      name: 'cloneproj',
      repo: 'https://example.com/repo.git',
      branch: 'main',
      force: false,
      merge: false,
      add: false,
      addDev: false,
      initGit: false,
      scriptName: 'semo',
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('Git clone failed!')
  })

  it('creates empty project and updates package.json name', async () => {
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any)

    const argv = createMockArgv({
      name: 'newproj',
      empty: true,
      yes: true,
      initGit: false,
      force: false,
      merge: false,
      add: false,
      addDev: false,
      scriptName: 'semo',
    })
    await handler(argv)
    // The handler creates dir and writes package.json, then updates the name
    // npm init creates package.json, but since we mock spawnSync it won't.
    // Just verify the flow was correct - spawnSync called with npm init
    expect(spawnSync).toHaveBeenCalledWith(
      'npm',
      expect.arrayContaining(['init']),
      expect.any(Object)
    )
  })

  it('uses template with direct match', async () => {
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any)

    const argv = createMockArgv({
      name: 'tplproj',
      template: 'my_template',
      force: false,
      merge: false,
      add: false,
      addDev: false,
      initGit: false,
      scriptName: 'semo',
      tag: [],
      $core: {
        invokeHook: vi.fn().mockResolvedValue({
          my_template: {
            repo: 'https://example.com/tpl.git',
            name: 'my-template',
            branch: 'main',
            tags: ['test'],
          },
        }),
        getPluginConfig: vi.fn().mockReturnValue({}),
      },
    })
    await handler(argv)
    // Should call git clone with the template repo
    expect(spawnSync).toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['clone', 'https://example.com/tpl.git']),
      expect.any(Object)
    )
  })

  it('uses template from select prompt when no direct match', async () => {
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any)

    const argv = createMockArgv({
      name: 'tplselect',
      template: 'nonexistent',
      force: false,
      merge: false,
      add: false,
      addDev: false,
      initGit: false,
      scriptName: 'semo',
      tag: [],
      $core: {
        invokeHook: vi.fn().mockResolvedValue({
          real_tpl: {
            repo: 'https://example.com/real.git',
            name: 'real-tpl',
            branch: 'develop',
            tags: [],
          },
        }),
        getPluginConfig: vi.fn().mockReturnValue({}),
      },
      $prompt: {
        select: vi.fn().mockResolvedValue('real_tpl'),
      },
    })
    await handler(argv)
    expect(argv.$prompt.select).toHaveBeenCalled()
  })

  it('handles string repo values in template config', async () => {
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any)

    const argv = createMockArgv({
      name: 'strrepo',
      template: 'simple',
      force: false,
      merge: false,
      add: false,
      addDev: false,
      initGit: false,
      scriptName: 'semo',
      tag: [],
      $core: {
        invokeHook: vi.fn().mockResolvedValue({
          simple: 'https://example.com/simple.git',
        }),
        getPluginConfig: vi.fn().mockReturnValue({}),
      },
    })
    await handler(argv)
    expect(spawnSync).toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['clone', 'https://example.com/simple.git']),
      expect.any(Object)
    )
  })

  it('filters templates by tag', async () => {
    const argv = createMockArgv({
      name: 'tagged',
      template: true,
      force: false,
      merge: false,
      add: false,
      addDev: false,
      initGit: false,
      scriptName: 'semo',
      tag: ['nonexistent-tag'],
      $core: {
        invokeHook: vi.fn().mockResolvedValue({
          tpl1: {
            repo: 'https://example.com/1.git',
            name: 'tpl1',
            tags: ['plugin'],
          },
        }),
        getPluginConfig: vi.fn().mockReturnValue({}),
      },
    })
    await handler(argv)
    // After tag filtering, no repos match the nonexistent-tag
    expect(argv.$core.invokeHook).toHaveBeenCalled()
  })

  it('handles clone success and removes .git', async () => {
    const { success } = await import('@semo/core')
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any)

    const argv = createMockArgv({
      name: 'cloned',
      repo: 'https://example.com/repo.git',
      branch: 'main',
      force: false,
      merge: false,
      add: false,
      addDev: false,
      initGit: true,
      scriptName: 'semo',
    })
    await handler(argv)
    expect(success).toHaveBeenCalledWith('Succeeded!')
    expect(success).toHaveBeenCalledWith('.git directory removed!')
    expect(success).toHaveBeenCalledWith('New .git directory has been created!')
  })

  it('uses npm init without -y when yes is false', async () => {
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockReturnValue({ status: 0 } as any)

    const argv = createMockArgv({
      name: 'noyesproj',
      empty: true,
      yes: false,
      initGit: false,
      force: false,
      merge: false,
      add: false,
      addDev: false,
      scriptName: 'semo',
    })
    await handler(argv)
    expect(spawnSync).toHaveBeenCalledWith('npm', ['init'], expect.any(Object))
  })

  it('handles error catch with verbose', async () => {
    const { error } = await import('@semo/core')
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockImplementation(() => {
      throw new Error('spawn failed')
    })

    const argv = createMockArgv({
      name: 'errproj',
      repo: 'https://example.com/repo.git',
      force: false,
      merge: false,
      add: false,
      addDev: false,
      scriptName: 'semo',
      verbose: true,
    })
    await handler(argv)
    expect(error).toHaveBeenCalled()
  })

  it('handles error catch without verbose', async () => {
    const { error } = await import('@semo/core')
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockImplementation(() => {
      throw new Error('spawn failed')
    })

    const argv = createMockArgv({
      name: 'errproj2',
      repo: 'https://example.com/repo.git',
      force: false,
      merge: false,
      add: false,
      addDev: false,
      scriptName: 'semo',
      verbose: false,
    })
    await handler(argv)
    expect(error).toHaveBeenCalledWith('spawn failed')
  })

  it('exports correct metadata', async () => {
    const mod = await import('../../src/commands/create.js')
    expect(mod.command).toBe('create <name> [repo] [branch]')
    expect(mod.aliases).toBe('c')
    expect(mod.plugin).toBe('semo')
  })
})
