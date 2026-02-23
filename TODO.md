# Semo v2 TODO

## Task 1: ARCHITECTURE.md 修复 [P0] ✅

- [x] 删除 Monorepo 结构图中的 `semo-plugin-application`
- [x] 删除包依赖关系图中的 `semo-plugin-application`
- [x] 删除 `semo-plugin-application` 小节，在 `@semo/cli` 小节补充 `application` 命令说明
- [x] 删除外部依赖表中的 `lodash`、`shelljs`、`fs-extra`
- [x] 更新 yargs 版本描述
- [x] 补充 Core 类拆分说明（config-manager / plugin-loader / package-manager / command-loader）

## Task 2: launch() 拆分 + SDK init() [P0] ✅

- [x] 新增 `_initialized` 私有属性
- [x] 提取 `setupEnvironment()` 方法（dotenv + stdin）
- [x] 提取 `loadConfiguration()` 方法（argv 解析 + appConfig + plugin 发现 + combinedConfig）
- [x] 提取 `createYargsInstance()` 方法
- [x] 提取 `setupMiddleware()` 方法
- [x] 提取 `configureYargsOptions()` 方法
- [x] 提取 `loadCommands()` 方法
- [x] 提取 `execute()` 方法
- [x] 实现公开 `init()` 方法（幂等）
- [x] 改写 `launch()` 调用新方法链
- [x] 确保现有 `core-launch.test.ts` 全部通过
- [x] 新建 `core-init.test.ts` 测试 init() 行为
- [x] 验证 `tsx examples/sdk-init.ts` 可正常执行

## Task 3: 错误处理统一 + SemoError [P2] ✅

- [x] 替换 launch parseAsync catch 中的 `console.error(e)` → `error(e)`
- [x] 替换 invokeHook 单个插件失败的 `console.error(e)` → `warn(e)`
- [x] 替换 invokeHook 外层 catch 的 `console.error(msg)` → `error(msg)`
- [x] 新建 `packages/core/src/common/errors.ts`
- [x] 实现 `SemoError` 基类（含 code 属性）
- [x] 实现 `PluginError`（含 pluginName）
- [x] 实现 `ConfigError`
- [x] 实现 `HookError`（含 hookName + pluginName）
- [x] 在 `packages/core/src/index.ts` 导出 errors 模块
- [x] 更新受影响的测试（spy 目标从 console.error 调整）
- [x] 新建 `packages/core/tests/errors.test.ts`

## Task 4: Config Schema 验证框架 [P1] ✅

- [x] 新建 `packages/core/src/common/config-validator.ts`
- [x] 定义 `ConfigSchemaField` / `ConfigSchema` / `ValidationResult` 类型
- [x] 实现 `validateConfig()` 函数
- [x] 实现 `formatValidationResult()` 函数
- [x] 在 `packages/cli/src/hooks/index.ts` 的 `hook_hook` 中声明 `config_schema` hook
- [x] 在 `packages/cli/src/hooks/index.ts` 实现 `hook_config_schema` 声明内置配置 schema
- [x] 在 `packages/core/src/index.ts` 导出 config-validator 模块
- [x] 新建 `packages/core/tests/config-validator.test.ts`
  - [x] 类型校验（string/number/boolean/array/object）
  - [x] required 字段缺失检测
  - [x] enum 值校验
  - [x] 未声明 key 不报错（向后兼容）
  - [x] 空 schema 时全部通过

## Task 5: `semo doctor` 命令 [P1] ✅

- [x] 新建 `packages/cli/src/commands/doctor.ts`
- [x] 实现 Node.js 版本检查（>= 20.19.0）
- [x] 实现 Core 版本显示
- [x] 实现 Script name 显示
- [x] 实现插件健康检查（路径存在性 + package.json 有效性）
- [x] 实现配置文件检查（.semorc.yml 存在性和可解析性）
- [x] 实现 Config Schema 校验（调用 config_schema hook + validateConfig）
- [x] 使用 outputTable + colorize 格式化输出
- [x] 新建 `packages/cli/tests/commands/doctor.test.ts`

## Task 6: 类型安全改进 [P3] ✅

- [x] 在 `types.ts` 新增 `SemoConfig` 接口
- [x] 收紧 `core.ts` 中 `combinedConfig` 类型（→ `CombinedConfig`）
- [x] 收紧 `core.ts` 中 `appConfig` 类型（→ `ApplicationConfig`）
- [x] 收紧 `core.ts` 中 `$config` 类型（→ `Record<string, unknown>`）
- [x] 收紧 `command-loader.ts` 中 `CommandLoaderContext` 类型
- [x] 收紧 `config-manager.ts` 函数签名
- [x] 收紧 `package-manager.ts` 函数签名（`importPackage` → `Promise<unknown>`）
- [x] `[key: string]: any` → `[key: string]: unknown`（HookReturn, PluginConfig, SemoCommand 等）
- [x] 为必须保留 `any` 的地方加注释说明（ArgvOptions, EventEmitter, Yargs, 动态 import）
- [x] 编译通过 + 全量测试通过

## Task 7: 启动性能优化 [P2] ✅ (暂缓)

- [x] Profile 当前启动时间
  - Import core: ~55ms, Init: ~23ms, Total init: ~80ms
  - 完整 launch --help: ~145ms
  - status 命令: ~460ms（envinfo 外部开销）
- [x] 评估是否需要优化（< 200ms 可暂缓）→ **当前 < 150ms，暂缓**
- [ ] 如需优化，实现配置快照方案（序列化 allPlugins/combinedConfig/appConfig）
- [ ] 设计快照失效策略（文件 hash / 版本号 / mtime）
- [x] 评估命令按需 import 方案的可行性 → 见下方分析
- [x] 评估条件加载方案的可行性 → 见下方分析

### 命令按需 import 评估

**现状**：yargs `commandDir()` 内部通过 `require-directory` 同步加载目录下所有命令文件。每个命令文件在启动时都会被 import，即使用户只执行其中一个命令。

**可行性**：**技术上可行，但收益有限且改动大。**

- 方案：替换 `commandDir()` 为手动注册命令元数据（command/desc/aliases），handler 使用 `() => import('./real-handler.js')` 延迟加载。
- 收益估算：当前内置 ~10 个命令文件，每个文件很小（几 KB），Node.js ESM import 有模块缓存。实测 loadCommands 在 init ~23ms 中只占一小部分。即使全部延迟也只能省 5-10ms。
- 代价：(1) 需要重写 loadCommands，放弃 yargs `commandDir` 的自动发现机制；(2) 需要维护一份命令注册表；(3) 插件的命令也需要适配，破坏插件约定的兼容性。
- **结论：不推荐。收益不足以抵消破坏性。**

### 条件加载评估

**现状**：`@semo/core` 已大量使用 lazy loading（`@inquirer/prompts`、`table`、`dotenv`、`json-colorizer` 都是动态 import 按需加载）。插件发现也有 manifest 缓存机制。

**可行性评估**：

- `glob` 包（用于插件扫描）：在有 manifest 缓存时会跳过，已经是条件加载。
- `yaml` 包（用于解析 .semorc.yml）：启动时必须加载，无法延迟。
- `yargs`：框架核心，必须立即加载。
- `find-up`：用于定位配置文件，启动时必须使用。
- `envinfo`（status 命令）：已在命令 handler 内加载，不影响启动。
- **结论：核心依赖已无法再延迟加载，非核心依赖已做了 lazy loading。进一步优化空间极小。**
