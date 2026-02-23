import { describe, it, expect, vi } from 'vitest'
import {
  createVisitor,
  extendSubCommand,
} from '../src/common/command-loader.js'
import { createCommandLoaderContext } from './helpers/test-utils.js'
import {
  createTempDir,
  removeTempDir,
  writeFile,
} from './helpers/test-utils.js'
import path from 'node:path'

describe('createVisitor', () => {
  it('should return a function', () => {
    const ctx = createCommandLoaderContext()
    const visitor = createVisitor(ctx)
    expect(typeof visitor).toBe('function')
  })

  it('should return true for enabled commands', () => {
    const ctx = createCommandLoaderContext()
    const visitor = createVisitor(ctx)
    const command = { handler: () => {} }
    expect(visitor(command, '/path', 'file.js')).toBe(true)
  })

  it('should return false for disabled commands', () => {
    const ctx = createCommandLoaderContext()
    const visitor = createVisitor(ctx)
    const command = { disabled: true, handler: () => {} }
    expect(visitor(command, '/path', 'file.js')).toBe(false)
  })

  it('should inject middleware when command has middlewares array', () => {
    const ctx = createCommandLoaderContext()
    const visitor = createVisitor(ctx)
    const existingMiddleware = vi.fn()
    const command = { middlewares: [existingMiddleware], handler: () => {} }

    visitor(command, '/path', 'file.js')

    expect(command.middlewares.length).toBe(2)
    // Our middleware is unshifted (inserted at beginning)
    expect(command.middlewares[0]).not.toBe(existingMiddleware)
    expect(command.middlewares[1]).toBe(existingMiddleware)
  })

  it('should not add middleware when command has no middlewares', () => {
    const ctx = createCommandLoaderContext()
    const visitor = createVisitor(ctx)
    const command = { handler: () => {} }
    visitor(command, '/path', 'file.js')
    expect((command as any).middlewares).toBeUndefined()
  })

  it('middleware should set $config from plugin config', async () => {
    const mockConfig = { key: 'value' }
    const setParsedArgvFn = vi.fn()
    const ctx = createCommandLoaderContext({
      parsePluginConfig: () => mockConfig,
      setParsedArgv: setParsedArgvFn,
    })
    const visitor = createVisitor(ctx)
    const command = { plugin: 'semo-plugin-test', middlewares: [] as any[] }
    visitor(command, '/path', 'file.js')

    const argv: any = { scriptName: 'semo' }
    await command.middlewares[0](argv)

    expect(argv.$config).toEqual(mockConfig)
    expect(argv.$command).toBe(command)
    expect(setParsedArgvFn).toHaveBeenCalledWith(argv)
  })

  it('middleware should set empty $config when no plugin', async () => {
    const ctx = createCommandLoaderContext()
    const visitor = createVisitor(ctx)
    const command = { middlewares: [] as any[] }
    visitor(command, '/path', 'file.js')

    const argv: any = {}
    await command.middlewares[0](argv)
    expect(argv.$config).toEqual({})
  })

  it('middleware should call console.log when noblank is falsy', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ctx = createCommandLoaderContext()
    const visitor = createVisitor(ctx)
    const command = { middlewares: [] as any[] }
    visitor(command, '/path', 'file.js')

    await command.middlewares[0]({})
    expect(logSpy).toHaveBeenCalled()
    logSpy.mockRestore()
  })

  it('middleware should skip console.log when noblank is true', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const ctx = createCommandLoaderContext()
    const visitor = createVisitor(ctx)
    const command = { noblank: true, middlewares: [] as any[] }
    visitor(command, '/path', 'file.js')

    await command.middlewares[0]({})
    expect(logSpy).not.toHaveBeenCalled()
    logSpy.mockRestore()
  })
})

describe('extendSubCommand', () => {
  let tmpDir: string

  it('should load commands from basePath subdir if it exists', () => {
    tmpDir = createTempDir('cmd-loader')
    const subDir = path.resolve(tmpDir, 'config')
    writeFile(subDir, 'get.js', 'export default {}')

    const commandDirCalls: string[] = []
    const mockYargs = {
      commandDir: (dir: string, _opts: any) => {
        commandDirCalls.push(dir)
      },
    }
    const ctx = createCommandLoaderContext()

    extendSubCommand(ctx, 'config', 'semo', mockYargs, tmpDir)

    expect(commandDirCalls.some((d) => d.includes('config'))).toBe(true)
    removeTempDir(tmpDir)
  })

  it('should load plugin extend commands when extendDir is configured', () => {
    tmpDir = createTempDir('cmd-extend')
    const extendPath = path.resolve(tmpDir, 'extends/semo/src/commands/config')
    writeFile(extendPath, 'list.js', 'export default {}')

    const commandDirCalls: string[] = []
    const mockYargs = {
      commandDir: (dir: string, _opts: any) => {
        commandDirCalls.push(dir)
      },
    }
    const ctx = createCommandLoaderContext({
      allPlugins: { 'semo-plugin-test': tmpDir },
      combinedConfig: {
        pluginConfigs: {
          'semo-plugin-test': { extendDir: 'extends' },
        },
      },
    })

    extendSubCommand(ctx, 'config', 'semo', mockYargs, '/nonexistent')

    expect(commandDirCalls.some((d) => d.includes('extends'))).toBe(true)
    removeTempDir(tmpDir)
  })

  it('should load app extend commands when extendDir is in config', () => {
    tmpDir = createTempDir('cmd-app-extend')
    const extendPath = path.resolve(
      tmpDir,
      'app-extends/semo/src/commands/config'
    )
    writeFile(extendPath, 'custom.js', 'export default {}')

    const commandDirCalls: string[] = []
    const mockYargs = {
      commandDir: (dir: string, _opts: any) => {
        commandDirCalls.push(dir)
      },
    }

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    const ctx = createCommandLoaderContext({
      combinedConfig: {
        extendDir: 'app-extends',
        pluginConfigs: {},
      },
    })

    extendSubCommand(ctx, 'config', 'semo', mockYargs, '/nonexistent')

    expect(commandDirCalls.some((d) => d.includes('app-extends'))).toBe(true)
    process.cwd = originalCwd
    removeTempDir(tmpDir)
  })

  it('should not call commandDir when directories do not exist', () => {
    const commandDirCalls: string[] = []
    const mockYargs = {
      commandDir: (dir: string, _opts: any) => {
        commandDirCalls.push(dir)
      },
    }
    const ctx = createCommandLoaderContext()

    extendSubCommand(
      ctx,
      'nonexistent/deep',
      'semo',
      mockYargs,
      '/nonexistent-base'
    )

    expect(commandDirCalls.length).toBe(0)
  })

  it('should handle empty plugins gracefully', () => {
    const mockYargs = { commandDir: vi.fn() }
    const ctx = createCommandLoaderContext({ allPlugins: {} })

    expect(() => {
      extendSubCommand(ctx, 'test', 'semo', mockYargs, '/nonexistent')
    }).not.toThrow()
  })
})
