import { vi } from 'vitest'

/**
 * Creates a mock argv object that simulates the enhanced argv
 * passed to command handlers in Semo.
 */
export function createMockArgv(overrides: Record<string, any> = {}) {
  const argv: any = {
    _: [],
    '--': [],
    scriptName: 'semo',
    $input: '',

    // Core instance mock
    $core: {
      invokeHook: vi.fn().mockResolvedValue({}),
      getAllPluginsMapping: vi.fn().mockResolvedValue({}),
      installPackage: vi.fn(),
      uninstallPackage: vi.fn(),
      importPackage: vi.fn(),
      extendSubCommand: vi.fn(),
      getPluginConfig: vi.fn().mockReturnValue(undefined),
      appConfig: {},
      allPlugins: {},
      combinedConfig: { pluginConfigs: {} },
      config: {},
      setConfig: vi.fn(),
      saveConfig: vi.fn(),
      getConfigs: vi.fn().mockReturnValue({}),
      loadCorePackageInfo: vi.fn().mockReturnValue({ version: '2.0.0' }),
      version: '2.0.0',
      initOptions: { scriptName: 'semo' },
      getApplicationConfig: vi.fn().mockReturnValue({}),
    },

    // Prompt mock
    $prompt: {
      select: vi.fn().mockResolvedValue(''),
      input: vi.fn().mockResolvedValue(''),
      confirm: vi.fn().mockResolvedValue(true),
      checkbox: vi.fn().mockResolvedValue([]),
      password: vi.fn().mockResolvedValue(''),
      editor: vi.fn().mockResolvedValue(''),
      search: vi.fn().mockResolvedValue(''),
      expand: vi.fn().mockResolvedValue(''),
      rawlist: vi.fn().mockResolvedValue(''),
    },

    // Log methods on argv (argv.$info, argv.$error, etc.)
    $log: vi.fn(),
    $error: vi.fn(),
    $warn: vi.fn(),
    $info: vi.fn(),
    $success: vi.fn(),
    $fatal: vi.fn(),
    $colorize: vi.fn((_c: string, msg: string) => msg),
    $jsonLog: vi.fn(),
    $debugCoreChannel: vi.fn(),

    ...overrides,
  }

  // Allow overriding nested $core properties
  if (overrides.$core) {
    argv.$core = { ...argv.$core, ...overrides.$core }
  }
  if (overrides.$prompt) {
    argv.$prompt = { ...argv.$prompt, ...overrides.$prompt }
  }

  return argv
}
