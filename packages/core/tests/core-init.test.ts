import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Core } from '../src/common/core.js'

describe('Core init()', () => {
  const savedArgv = [...process.argv]
  let core: Core

  function createCore(initOpts: Record<string, any> = {}) {
    core = new Core({ scriptName: 'semo', ...initOpts })
    vi.spyOn(core, 'getAllPluginsMapping').mockResolvedValue({
      'semo-plugin-test': '/tmp/test-plugin',
    })
    vi.spyOn(core, 'getCombinedConfig').mockResolvedValue({
      pluginConfigs: { 'semo-plugin-test': { commandDir: 'lib/commands' } },
    })
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
  })

  afterEach(() => {
    Core.setInstance(null as any)
    process.argv = savedArgv
  })

  it('should set allPlugins after init', async () => {
    createCore()
    await core.init()

    expect(core.allPlugins).toEqual({
      'semo-plugin-test': '/tmp/test-plugin',
    })
  })

  it('should set combinedConfig after init', async () => {
    createCore()
    await core.init()

    expect(core.combinedConfig).toEqual({
      pluginConfigs: { 'semo-plugin-test': { commandDir: 'lib/commands' } },
    })
  })

  it('should set appConfig after init', async () => {
    createCore()
    await core.init()

    expect(core.appConfig).toBeTruthy()
    expect(core.appConfig.scriptName).toBe('semo')
  })

  it('should set version after init', async () => {
    createCore()
    await core.init()

    expect(core.version).toBeTruthy()
  })

  it('should be idempotent - multiple calls do not re-run', async () => {
    createCore()
    await core.init()

    const getAllPluginsSpy = core.getAllPluginsMapping as ReturnType<
      typeof vi.fn
    >
    const callCount = getAllPluginsSpy.mock.calls.length

    await core.init()
    await core.init()

    expect(getAllPluginsSpy.mock.calls.length).toBe(callCount)
  })

  it('should not create yargs instance', async () => {
    createCore()
    await core.init()

    // After init(), parsedArgv should not contain $yargs
    expect(core.parsedArgv.$yargs).toBeUndefined()
  })

  it('should allow invokeHook after init', async () => {
    createCore()
    await core.init()

    core.combinedConfig = { pluginConfigs: {} }
    core.appConfig = {}
    const result = await core.invokeHook('test', { mode: 'assign' })
    expect(result).toEqual({})
  })

  it('should set input to empty string when stdin is TTY', async () => {
    createCore()
    await core.init()

    expect(core.input).toBe('')
  })

  it('should call useDotEnv during init', async () => {
    createCore()
    await core.init()

    expect(core.useDotEnv).toHaveBeenCalled()
  })

  it('should merge initOptions into parsedArgv', async () => {
    createCore({ scriptName: 'myapp', packageName: '@myorg/cli' })
    await core.init()

    expect(core.parsedArgv.scriptName).toBe('myapp')
  })

  it('skipStdin should skip stdin reading', async () => {
    createCore({ skipStdin: true })
    await core.init()

    expect(core.input).toBe('')
  })

  it('skipDotEnv should skip dotenv loading', async () => {
    createCore({ skipDotEnv: true })
    await core.init()

    expect(core.useDotEnv).not.toHaveBeenCalled()
  })

  it('custom argv should override process.argv', async () => {
    createCore({ argv: ['--foo', 'bar'] })
    await core.init()

    expect(core.parsedArgv.foo).toBe('bar')
  })

  it('should emit lifecycle events during init', async () => {
    createCore()
    const events: string[] = []
    core.on('init:start', () => events.push('init:start'))
    core.on('init:env', () => events.push('init:env'))
    core.on('init:config', () => events.push('init:config'))
    core.on('init:done', () => events.push('init:done'))

    await core.init()

    expect(events).toEqual([
      'init:start',
      'init:env',
      'init:config',
      'init:done',
    ])
  })

  it('initialized getter should reflect init state', async () => {
    createCore()
    expect(core.initialized).toBe(false)

    await core.init()
    expect(core.initialized).toBe(true)
  })

  it('launch should call init internally', async () => {
    // Use a mock for yargs to prevent actual CLI startup
    const mockYargsObj: Record<string, any> = {}
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
      mockYargsObj[m] = vi.fn().mockReturnValue(mockYargsObj)
    })
    mockYargsObj.parseAsync = vi.fn().mockResolvedValue({})
    mockYargsObj.terminalWidth = vi.fn().mockReturnValue(120)

    createCore()
    const initSpy = vi.spyOn(core, 'init')

    // Mock createYargsInstance to return our mock
    vi.spyOn(core as any, 'createYargsInstance').mockReturnValue(mockYargsObj)

    await core.launch()
    expect(initSpy).toHaveBeenCalled()
  })
})
