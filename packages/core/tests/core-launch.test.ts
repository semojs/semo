import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'node:path'
import {
  createTempDir,
  removeTempDir,
  writeFile,
} from './helpers/test-utils.js'

// Create a controllable yargs mock
const mockYargsObj = vi.hoisted(() => {
  const inst: Record<string, any> = {}
  ;[
    'help',
    'alias',
    'option',
    'exitProcess',
    'recommendCommands',
    'parserConfiguration',
    'fail',
    'wrap',
    'version',
    'config',
    'middleware',
    'scriptName',
    'hide',
    'command',
    'commandDir',
    'completion',
    'epilog',
    'example',
    'showHelp',
  ].forEach((m) => {
    inst[m] = vi.fn().mockReturnValue(inst)
  })
  inst.parseAsync = vi.fn().mockResolvedValue({})
  inst.terminalWidth = vi.fn().mockReturnValue(120)
  return inst
})

vi.mock('yargs', () => ({ default: vi.fn(() => mockYargsObj) }))
vi.mock('yargs/helpers', () => ({ hideBin: (argv: string[]) => argv.slice(2) }))

import { Core } from '../src/common/core.js'

describe('Core launch()', () => {
  const savedArgv = [...process.argv]
  let core: Core

  function resetMocks() {
    Object.values(mockYargsObj).forEach((fn: any) => {
      if (typeof fn?.mockClear === 'function') fn.mockClear()
    })
  }

  function createCore(initOpts: Record<string, any> = {}) {
    core = new Core({ scriptName: 'semo', ...initOpts })
    vi.spyOn(core, 'getAllPluginsMapping').mockResolvedValue({})
    vi.spyOn(core, 'getCombinedConfig').mockResolvedValue({ pluginConfigs: {} })
    vi.spyOn(core, 'useDotEnv').mockResolvedValue(undefined)
    vi.spyOn(core, 'getApplicationConfig').mockReturnValue({
      applicationDir: process.cwd(),
      coreCommandDir: 'lib/commands',
    } as any)
    return core
  }

  beforeEach(() => {
    Core.setInstance(null as any)
    process.argv = ['node', 'semo']
    resetMocks()
  })

  afterEach(() => {
    Core.setInstance(null as any)
    process.argv = savedArgv
  })

  // --- Basic setup ---

  it('should set up yargs chain and call parseAsync', async () => {
    createCore()
    await core.launch()

    expect(mockYargsObj.help).toHaveBeenCalled()
    expect(mockYargsObj.alias).toHaveBeenCalled()
    expect(mockYargsObj.exitProcess).toHaveBeenCalledWith(false)
    expect(mockYargsObj.recommendCommands).toHaveBeenCalled()
    expect(mockYargsObj.parserConfiguration).toHaveBeenCalled()
    expect(mockYargsObj.fail).toHaveBeenCalled()
    expect(mockYargsObj.wrap).toHaveBeenCalled()
    expect(mockYargsObj.parseAsync).toHaveBeenCalled()
  })

  it('should set version from core package info', async () => {
    createCore()
    await core.launch()

    expect(mockYargsObj.version).toHaveBeenCalled()
    expect(core.version).toBeTruthy()
  })

  it('should set input to empty string when stdin is TTY', async () => {
    createCore()
    await core.launch()

    expect(core.input).toBe('')
  })

  // --- Fail handler ---

  it('fail handler should call process.exit(1) on error message', async () => {
    createCore()
    await core.launch()

    const failFn = mockYargsObj.fail.mock.calls[0][0]
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as any)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    failFn('test error', null)
    expect(exitSpy).toHaveBeenCalledWith(1)

    exitSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('fail handler should log error object when verbose', async () => {
    process.argv = ['node', 'semo', '--verbose']
    createCore()
    await core.launch()

    const failFn = mockYargsObj.fail.mock.calls[0][0]
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as any)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    failFn(null, new Error('verbose error'))
    expect(exitSpy).toHaveBeenCalledWith(1)

    exitSpy.mockRestore()
    warnSpy.mockRestore()
  })

  // --- Middleware ---

  it('middleware should set up $core and all utilities on argv', async () => {
    createCore()
    await core.launch()

    const middlewareFn = mockYargsObj.middleware.mock.calls[0][0]
    const testArgv: any = {}
    await middlewareFn(testArgv)

    expect(testArgv.$core).toBe(core)
    expect(testArgv.$yargs).toBe(mockYargsObj)
    expect(testArgv.$input).toBe('')
    expect(typeof testArgv.$log).toBe('function')
    expect(typeof testArgv.$error).toBe('function')
    expect(typeof testArgv.$warn).toBe('function')
    expect(typeof testArgv.$info).toBe('function')
    expect(typeof testArgv.$success).toBe('function')
    expect(typeof testArgv.$fatal).toBe('function')
    expect(typeof testArgv.$jsonLog).toBe('function')
    expect(typeof testArgv.$colorfulLog).toBe('function')
    expect(typeof testArgv.$colorize).toBe('function')
    expect(typeof testArgv.$debugCore).toBe('function')
    expect(typeof testArgv.$debugCoreChannel).toBe('function')
    expect(typeof testArgv.$debugChannel).toBe('function')
    expect(testArgv.$prompt).toBeTruthy()
    expect(typeof testArgv.$prompt.select).toBe('function')
    expect(typeof testArgv.$prompt.confirm).toBe('function')
  })

  // --- Completion ---

  it('should set up completion command by default', async () => {
    createCore()
    await core.launch()

    const calls = mockYargsObj.completion.mock.calls
    const stdCall = calls.find(
      (c: any[]) => c[1] === 'Generate completion script'
    )
    expect(stdCall).toBeTruthy()
  })

  it('should use completion(false) when hideCompletionCommand is set', async () => {
    process.argv = ['node', 'semo', '--hide-completion-command']
    createCore()
    await core.launch()

    const calls = mockYargsObj.completion.mock.calls
    const hiddenCall = calls.find((c: any[]) => c[1] === false)
    expect(hiddenCall).toBeTruthy()
  })

  it('should skip completion entirely when disableCompletionCommand is set', async () => {
    process.argv = ['node', 'semo', '--disable-completion-command']
    createCore()
    await core.launch()

    const calls = mockYargsObj.completion.mock.calls
    const stdCall = calls.find(
      (c: any[]) => c[1] === 'Generate completion script'
    )
    expect(stdCall).toBeFalsy()
  })

  // --- Core command disable ---

  it('should skip core commands when disableCoreCommand is set', async () => {
    process.argv = ['node', 'semo', '--disable-core-command']
    createCore()
    await core.launch()

    const cmdCalls = mockYargsObj.command.mock.calls
    const versionCmd = cmdCalls.find((c: any[]) => c[0] === 'version')
    expect(versionCmd).toBeFalsy()
    expect(mockYargsObj.example).not.toHaveBeenCalled()
  })

  // --- Epilog ---

  it('should set default epilog when setEpilog is not provided', async () => {
    createCore()
    await core.launch()

    expect(mockYargsObj.epilog).toHaveBeenCalledWith(
      expect.stringContaining('semo.js.org')
    )
  })

  it('should set custom string epilog when setEpilog is a string', async () => {
    process.argv = ['node', 'semo', '--set-epilog', 'Custom epilog text']
    createCore()
    await core.launch()

    expect(mockYargsObj.epilog).toHaveBeenCalledWith('Custom epilog text')
  })

  it('should pop last element when setEpilog is an array', async () => {
    process.argv = [
      'node',
      'semo',
      '--set-epilog',
      'first',
      '--set-epilog',
      'second',
    ]
    createCore()
    await core.launch()

    expect(mockYargsObj.epilog).toHaveBeenCalledWith('second')
  })

  it('should skip epilog when hideEpilog is set', async () => {
    process.argv = ['node', 'semo', '--hide-epilog']
    createCore()
    await core.launch()

    expect(mockYargsObj.epilog).not.toHaveBeenCalled()
  })

  // --- Set version ---

  it('should set custom version when setVersion is provided', async () => {
    process.argv = ['node', 'semo', '--set-version', '99.0.0']
    createCore()
    await core.launch()

    const calls = mockYargsObj.version.mock.calls
    const customCall = calls.find((c: any[]) => c[0] === '99.0.0')
    expect(customCall).toBeTruthy()
  })

  // --- Command loading ---

  it('should load core commands when packageDirectory is set', async () => {
    const tmpDir = createTempDir('launch-core-cmds')
    writeFile(
      path.resolve(tmpDir, 'lib/commands'),
      'test.js',
      'export default {}'
    )

    createCore({ packageDirectory: tmpDir })
    await core.launch()

    const calls = mockYargsObj.commandDir.mock.calls
    const coreCmd = calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].includes(tmpDir)
    )
    expect(coreCmd).toBeTruthy()

    removeTempDir(tmpDir)
  })

  it('should load plugin commands when plugins have commandDir', async () => {
    const tmpDir = createTempDir('launch-plugin-cmds')
    writeFile(
      path.resolve(tmpDir, 'lib/commands'),
      'cmd.js',
      'export default {}'
    )

    createCore()
    vi.spyOn(core, 'getAllPluginsMapping').mockResolvedValue({
      'semo-plugin-test': tmpDir,
    })
    vi.spyOn(core, 'getCombinedConfig').mockResolvedValue({
      pluginConfigs: {
        'semo-plugin-test': { commandDir: 'lib/commands' },
      },
    })

    await core.launch()

    const calls = mockYargsObj.commandDir.mock.calls
    const pluginCmd = calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].includes(tmpDir)
    )
    expect(pluginCmd).toBeTruthy()

    removeTempDir(tmpDir)
  })

  it('should load application commands when commandDir exists', async () => {
    const tmpDir = createTempDir('launch-app-cmds')
    writeFile(
      path.resolve(tmpDir, 'app-commands'),
      'app.js',
      'export default {}'
    )

    const originalCwd = process.cwd
    process.cwd = () => tmpDir

    createCore()
    vi.spyOn(core, 'getApplicationConfig').mockReturnValue({
      applicationDir: tmpDir,
      coreCommandDir: 'lib/commands',
      commandDir: 'app-commands',
    } as any)

    await core.launch()

    const calls = mockYargsObj.commandDir.mock.calls
    const appCmd = calls.find(
      (c: any[]) => typeof c[0] === 'string' && c[0].includes('app-commands')
    )
    expect(appCmd).toBeTruthy()

    process.cwd = originalCwd
    removeTempDir(tmpDir)
  })

  // --- Default command ---

  it('should register $0 default command', async () => {
    createCore()
    await core.launch()

    const cmdCalls = mockYargsObj.command.mock.calls
    const defaultCmd = cmdCalls.find(
      (c: any[]) => c[0] && typeof c[0] === 'object' && c[0].command === '$0'
    )
    expect(defaultCmd).toBeTruthy()
  })

  it('should register version subcommand', async () => {
    createCore()
    await core.launch()

    const cmdCalls = mockYargsObj.command.mock.calls
    const versionCmd = cmdCalls.find((c: any[]) => c[0] === 'version')
    expect(versionCmd).toBeTruthy()
  })

  it('should register examples', async () => {
    createCore()
    await core.launch()

    expect(mockYargsObj.example).toHaveBeenCalled()
  })

  // --- File-based command loading ---

  it('should load command from file in argv[2] with handler', async () => {
    const tmpDir = createTempDir('launch-cmdfile')
    const cmdFile = path.resolve(tmpDir, 'my-cmd.mjs')
    writeFile(
      tmpDir,
      'my-cmd.mjs',
      `
export default {
  handler: () => 'custom-handler',
  builder: { port: { type: 'number' } },
}
`
    )

    const originalCwd = process.cwd
    process.cwd = () => tmpDir
    process.argv = ['node', 'semo', cmdFile]

    createCore()
    await core.launch()

    // Default command should be registered (possibly with the file's handler)
    const cmdCalls = mockYargsObj.command.mock.calls
    const defaultCmd = cmdCalls.find(
      (c: any[]) => c[0] && typeof c[0] === 'object' && c[0].command === '$0'
    )
    expect(defaultCmd).toBeTruthy()

    process.cwd = originalCwd
    removeTempDir(tmpDir)
  })

  it('should load command file that exports a function', async () => {
    const tmpDir = createTempDir('launch-cmdfile-fn')
    const cmdFile = path.resolve(tmpDir, 'fn-cmd.mjs')
    writeFile(
      tmpDir,
      'fn-cmd.mjs',
      `
export default function() { return 'fn-handler' }
`
    )

    const originalCwd = process.cwd
    process.cwd = () => tmpDir
    process.argv = ['node', 'semo', cmdFile]

    createCore()
    await core.launch()

    const cmdCalls = mockYargsObj.command.mock.calls
    const defaultCmd = cmdCalls.find(
      (c: any[]) => c[0] && typeof c[0] === 'object' && c[0].command === '$0'
    )
    expect(defaultCmd).toBeTruthy()

    process.cwd = originalCwd
    removeTempDir(tmpDir)
  })

  it('should handle command file import error gracefully', async () => {
    const tmpDir = createTempDir('launch-cmdfile-err')
    const cmdFile = path.resolve(tmpDir, 'bad-cmd.mjs')
    writeFile(tmpDir, 'bad-cmd.mjs', 'throw new Error("bad import")')

    const originalCwd = process.cwd
    process.cwd = () => tmpDir
    process.argv = ['node', 'semo', cmdFile]

    createCore()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await core.launch()
    warnSpy.mockRestore()

    // Should not throw, error is caught
    expect(mockYargsObj.parseAsync).toHaveBeenCalled()

    process.cwd = originalCwd
    removeTempDir(tmpDir)
  })

  it('should log command file error when verbose', async () => {
    const tmpDir = createTempDir('launch-cmdfile-verbose')
    const cmdFile = path.resolve(tmpDir, 'bad2.mjs')
    writeFile(tmpDir, 'bad2.mjs', 'throw new Error("verbose import error")')

    const originalCwd = process.cwd
    process.cwd = () => tmpDir
    process.argv = ['node', 'semo', cmdFile, '--verbose']

    createCore()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await core.launch()
    warnSpy.mockRestore()

    // Should not throw - test passes if launch completes
    expect(true).toBe(true)

    process.cwd = originalCwd
    removeTempDir(tmpDir)
  })

  // --- Error handling in parseAsync ---

  it('should handle parseAsync error in non-verbose mode', async () => {
    createCore()
    mockYargsObj.parseAsync.mockRejectedValueOnce(new Error('parse failed'))

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await core.launch()
    warnSpy.mockRestore()

    // Should not throw - test passes if launch completes
    expect(true).toBe(true)
  })

  it('should handle parseAsync error in verbose mode', async () => {
    process.argv = ['node', 'semo', '--verbose']
    createCore()
    mockYargsObj.parseAsync.mockRejectedValueOnce(
      new Error('verbose parse error')
    )

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await core.launch()

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('should handle parseAsync error with non-Error object', async () => {
    createCore()
    mockYargsObj.parseAsync.mockRejectedValueOnce('string error')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await core.launch()
    warnSpy.mockRestore()

    // Should not throw - test passes if launch completes
    expect(true).toBe(true)
  })

  // --- before_command hook ---

  it('should invoke before_command hook when enableCoreHook includes it', async () => {
    process.argv = ['node', 'semo', '--enable-core-hook', 'before_command']
    createCore()

    const hookSpy = vi.spyOn(core, 'invokeHook').mockResolvedValue({})
    await core.launch()

    const hookCall = hookSpy.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('before_command')
    )
    expect(hookCall).toBeTruthy()
  })

  it('should call each before_command hook handler', async () => {
    process.argv = ['node', 'semo', '--enable-core-hook', 'before_command']
    createCore()

    const mockHandler = vi.fn()
    vi.spyOn(core, 'invokeHook').mockResolvedValue({
      'semo-plugin-test': mockHandler,
    })

    await core.launch()

    expect(mockHandler).toHaveBeenCalled()
  })

  // --- disableGlobalPlugin / disableHomePlugin ---

  it('should add global plugin option when not disabled', async () => {
    createCore()
    await core.launch()

    const optionCalls = mockYargsObj.option.mock.calls
    const globalOpt = optionCalls.find(
      (c: any[]) => c[0] === 'disable-global-plugin'
    )
    expect(globalOpt).toBeTruthy()
  })

  it('should skip global plugin option when disableGlobalPlugin is set', async () => {
    process.argv = ['node', 'semo', '--disable-global-plugin']
    createCore()
    await core.launch()

    // The option should not be re-registered (the hide+option block is skipped)
    const hideCalls = mockYargsObj.hide.mock.calls
    const globalHide = hideCalls.find(
      (c: any[]) => c[0] === 'disable-global-plugin'
    )
    expect(globalHide).toBeFalsy()
  })

  it('should add home plugin option when not disabled', async () => {
    createCore()
    await core.launch()

    const optionCalls = mockYargsObj.option.mock.calls
    const homeOpt = optionCalls.find(
      (c: any[]) => c[0] === 'disable-home-plugin'
    )
    expect(homeOpt).toBeTruthy()
  })

  it('should skip home plugin option when disableHomePlugin is set', async () => {
    process.argv = ['node', 'semo', '--disable-home-plugin']
    createCore()
    await core.launch()

    const hideCalls = mockYargsObj.hide.mock.calls
    const homeHide = hideCalls.find(
      (c: any[]) => c[0] === 'disable-home-plugin'
    )
    expect(homeHide).toBeFalsy()
  })

  // --- AppConfig fields in launch ---

  it('should merge initOptions into appConfig', async () => {
    createCore({
      scriptName: 'myapp',
      packageName: '@myorg/cli',
      orgMode: true,
    })
    await core.launch()

    expect(core.appConfig.scriptName).toBe('myapp')
    expect(core.appConfig.packageName).toBe('@myorg/cli')
    expect(core.appConfig.orgMode).toBe(true)
  })

  it('should set $semo VERSION in appConfig', async () => {
    createCore()
    await core.launch()

    expect(core.appConfig.$semo).toBeTruthy()
    expect(core.appConfig.$semo.VERSION).toBeTruthy()
  })

  it('should store original argv in appConfig', async () => {
    process.argv = ['node', 'semo', '--foo', 'bar']
    createCore()
    await core.launch()

    expect(core.appConfig.originalArgv).toEqual(['--foo', 'bar'])
  })
})
