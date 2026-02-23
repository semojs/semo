# Semo v2 Iteration Roadmap

Semo v2 经过大规模重构（移除 lodash/shelljs/fs-extra、Core 类拆分、零配置约定等），核心功能已稳定。本路线图规划后续迭代优化方向。

## Task 1: ARCHITECTURE.md 修复

**优先级**: P0
**主要文件**: `ARCHITECTURE.md`

ARCHITECTURE.md 存在多处过时信息需要修正：

1. Monorepo 结构图 — 删除已废弃的 `semo-plugin-application`
2. 包依赖关系图 — 同步删除 `semo-plugin-application`
3. 删除整个 `semo-plugin-application` 小节，在 `@semo/cli` 小节补充 `application` 命令说明
4. 外部依赖表 — 删除已移除的 `lodash`、`shelljs`、`fs-extra`，更新 yargs 版本描述
5. 补充说明 Core 类已拆分为 config-manager / plugin-loader / package-manager / command-loader

---

## Task 2: launch() 拆分 + SDK init()

**优先级**: P0
**主要文件**: `packages/core/src/common/core.ts`, `packages/core/tests/core-launch.test.ts`

### 目标

将 `launch()` 拆为 7 个阶段方法，暴露 `init()` 供程序化使用（SDK 模式）。

### 新增方法

```
public async init(): Promise<void>
  → setupEnvironment()  (dotenv + stdin)
  → loadConfiguration() (argv解析 + appConfig + plugin发现 + combinedConfig)

private async setupEnvironment(): Promise<void>
private async loadConfiguration(): Promise<void>
private createYargsInstance(): Argv
private setupMiddleware(yargs: Argv): void
private async configureYargsOptions(yargs: Argv): Promise<void>
private loadCommands(yargs: Argv): void
private async execute(yargs: Argv): Promise<void>
```

### launch() 改写

```typescript
async launch(): Promise<void> {
  await this.init()
  const yargsObj = this.createYargsInstance()
  this.setupMiddleware(yargsObj)
  await this.configureYargsOptions(yargsObj)
  this.loadCommands(yargsObj)
  await this.execute(yargsObj)
}
```

### init() 设计

```typescript
async init(): Promise<void> {
  if (this._initialized) return   // 幂等
  await this.setupEnvironment()
  await this.loadConfiguration()
  this._initialized = true
}
```

### 变量共享策略

- `parsedArgv` → `this.parsedArgv`（已有）
- `appConfig` → `this.appConfig`（已有）
- `allPlugins` → `this.allPlugins`（已有）
- `combinedConfig` → `this.combinedConfig`（已有）
- `pkg.version` → `this.version`（loadConfiguration 中设置）
- `yargsObj` → 作为参数在阶段 4-7 间传递

### 测试

- 现有 `core-launch.test.ts` 全部应通过（launch 行为不变）
- 新增 `core-init.test.ts`:
  - `init()` 设置 allPlugins/combinedConfig/appConfig
  - `init()` 不创建 yargs 实例
  - `init()` 后可调用 invokeHook()
  - 多次调用 init() 幂等

### SDK 使用示例

```typescript
import { Core } from '@semo/core'

const core = new Core({ scriptName: 'myapp' })
await core.init() // 轻量初始化，不启动 yargs
const result = await core.invokeHook('myapp:transform', { mode: 'push' })
```

---

## Task 3: 错误处理统一 + SemoError

**优先级**: P2
**主要文件**: `packages/core/src/common/core.ts`, 新建 `packages/core/src/common/errors.ts`

### 3a: 替换 console.error

| 位置                    | 当前                 | 改为         | 理由           |
| ----------------------- | -------------------- | ------------ | -------------- |
| launch parseAsync catch | `console.error(e)`   | `error(e)`   | 统一日志       |
| invokeHook 单个插件失败 | `console.error(e)`   | `warn(e)`    | 不阻塞其他插件 |
| invokeHook 外层 catch   | `console.error(msg)` | `error(msg)` | 统一日志       |

### 3b: SemoError 体系

新建 `packages/core/src/common/errors.ts`：

```typescript
export class SemoError extends Error {
  readonly code: string
  constructor(message: string, code = 'SEMO_ERROR', options?: ErrorOptions) {
    super(message, options)
    this.name = 'SemoError'
    this.code = code
  }
}

export class PluginError extends SemoError {
  readonly pluginName: string
  constructor(pluginName: string, message: string, options?: ErrorOptions) { ... }
}

export class ConfigError extends SemoError { ... }

export class HookError extends SemoError {
  readonly hookName: string
  readonly pluginName: string
  constructor(hookName: string, pluginName: string, message: string, options?: ErrorOptions) { ... }
}
```

使用原生 `ErrorOptions.cause`（Node 16.9+）替代自定义 cause 属性。

导出: `packages/core/src/index.ts` 添加 `export * from './common/errors.js'`

---

## Task 4: Config Schema 验证框架

**优先级**: P1
**主要文件**: 新建 `packages/core/src/common/config-validator.ts`

### 类型定义

```typescript
export interface ConfigSchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required?: boolean
  description?: string
  default?: unknown
  enum?: unknown[]
}

export type ConfigSchema = Record<string, ConfigSchemaField>

export interface ValidationResult {
  valid: boolean
  errors: Array<{ plugin: string; key: string; message: string }>
  warnings: Array<{ plugin: string; key: string; message: string }>
}
```

### 核心函数

- `validateConfig(config, schema, pluginName)` — 校验配置对象是否符合 schema
- `formatValidationResult(result)` — 格式化为可读输出

### Hook 声明

在 `packages/cli/src/hooks/index.ts` 的 `hook_hook` 中添加:
`config_schema: 'Hook triggered to collect plugin config schemas.'`

导出: `packages/core/src/index.ts` 添加 `export * from './common/config-validator.js'`

---

## Task 5: `semo doctor` 命令

**优先级**: P1
**主要文件**: 新建 `packages/cli/src/commands/doctor.ts`

### 检查项

1. **Node.js 版本** — 检查是否 >= 20.19.0（engines 字段要求）
2. **Core 版本** — 显示 `argv.$core.version`
3. **Script name** — 显示 `argv.scriptName`
4. **插件健康** — 遍历 `argv.$core.allPlugins`，检查路径存在性和 package.json 有效性
5. **配置文件** — 检查 .semorc.yml 是否存在和可解析
6. **Config Schema 校验** — 通过 `invokeHook('config_schema', { mode: 'group' })` 收集 schema，调用 `validateConfig()` 校验

### 输出格式

```
$ semo doctor
  ✓  Node.js              v22.12.0
  ✓  Core version          2.0.21
  ✓  Script name           semo
  ✓  Plugins               5 loaded
  !  Config                 unknown key "pluginDIr" (did you mean "pluginDir"?)
```

使用 `outputTable()` 输出，status 列用 picocolors 着色。

---

## Task 6: 类型安全改进

**优先级**: P3
**主要文件**: `packages/core/src/common/types.ts`, `core.ts`, `command-loader.ts`

### SemoConfig 接口

```typescript
export interface SemoConfig {
  scriptName?: string
  commandDir?: string
  pluginDir?: string | string[]
  extendDir?: string
  scriptDir?: string
  hookDir?: string
  typescript?: boolean
  $plugin?: Record<string, Record<string, unknown>>
  $plugins?: {
    include?: string[]
    exclude?: string[]
    register?: Record<string, string | boolean>
  }
  [key: string]: unknown // 允许扩展，但用 unknown 不用 any
}
```

### 收紧清单

| 文件               | 位置                          | 变更                                              |
| ------------------ | ----------------------------- | ------------------------------------------------- |
| core.ts            | `combinedConfig` 属性         | `Record<string, any>` → `CombinedConfig`          |
| core.ts            | `appConfig` 属性              | `Record<string, any>` → `ApplicationConfig`       |
| core.ts            | `$config?` (ArgvExtraOptions) | `Record<string, any>` → `Record<string, unknown>` |
| command-loader.ts  | `CommandLoaderContext`        | 收紧 parsedArgv/combinedConfig 类型               |
| config-manager.ts  | 函数签名                      | `Record<string, any>` → `ArgvOptions`             |
| package-manager.ts | 函数签名                      | `Record<string, any>` → `ArgvOptions`             |

### 策略

- `[key: string]: any` 统一改为 `[key: string]: unknown`
- 需要 `any` 的地方（如 yargs API 交互）保留但加注释说明原因
- 编译通过后运行全量测试验证无回归

---

## Task 7: 启动性能优化

**优先级**: P2
**主要文件**: `packages/core/src/common/command-loader.ts`, `core.ts`

### 评估优先

先 profile 当前启动时间，确认瓶颈。如果 < 200ms 可以暂缓。

### 可选优化点

1. **命令按需 import** — 修改 `loadCommands()` 阶段，扫描命令目录文件名但延迟 import handler

   - 限制：ESM 无法不执行就提取 export，仍需 import 获取 command/desc
   - 真正收益：避免命令文件内的顶层 side-effect 和依赖链加载
   - 作为可选配置 `lazyCommandLoading: true`

2. **配置快照** — 首次 init 后序列化 `{ allPlugins, combinedConfig, appConfig }` 到单文件，后续直接读取

   - 类似 plugin-cache 但更全面
   - 需要失效策略（文件 hash / 版本号 / mtime）

3. **条件加载** — 当用户输入了具体命令（如 `semo status`），只加载该命令所在插件的 commands

### 实施建议

此任务风险最高，建议：

- 先用 `--prof` 或 `console.time` 度量当前启动耗时
- 如果确认有性能问题，从配置快照（方案 2）开始，风险最低

---

## 验证方案

每个 Task 完成后执行：

```bash
pnpm build                  # 编译通过
pnpm test                   # 全量测试通过
pnpm semo status            # CLI 功能验证
pnpm semo --help            # 帮助输出正常
```

Task 2 额外验证：`tsx examples/sdk-init.ts`
Task 5 额外验证：`pnpm semo doctor`
