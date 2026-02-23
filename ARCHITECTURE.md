# Semo 架构文档

## 项目概述

Semo 是一个基于 [Yargs](https://yargs.js.org/) 封装的 **插件化 CLI 框架**。它的核心理念是：不构建单体 CLI 工具，而是通过插件组合的方式拼装 CLI，每个插件可以独立开发、贡献命令、钩子和扩展。框架负责插件发现、配置分层、钩子调用和命令注册，开发者只需专注编写具体的命令处理逻辑。

- 官网：http://semo.js.org
- 仓库：https://github.com/semojs/semo

---

## Monorepo 结构

项目采用 **pnpm workspace + Lerna** 管理，所有包位于 `packages/` 目录下：

```
semo/
├── packages/
│   ├── core/                    # @semo/core - 核心库
│   ├── cli/                     # @semo/cli - CLI 入口及内置命令
│   ├── semo-plugin-hook/        # 钩子管理插件
│   ├── semo-plugin-plugin/      # 插件管理插件
│   ├── semo-plugin-script/      # 脚本执行插件
│   └── semo-plugin-shell/       # 交互式 Shell 插件
├── package.json                 # Monorepo 根配置
├── pnpm-workspace.yaml          # pnpm 工作区定义
├── lerna.json                   # Lerna 版本发布配置
├── tsconfig.json                # 共享 TypeScript 配置
├── vitest.config.ts             # 测试配置
└── .semorc.yml                  # 开发用 Semo 配置
```

---

## 包依赖关系

所有插件包和 CLI 包均依赖 `@semo/core`，`core` 是唯一无内部依赖的基础包：

```
@semo/core（基础层，无内部依赖）
  ├── @semo/cli
  ├── semo-plugin-hook
  ├── semo-plugin-plugin
  ├── semo-plugin-script
  └── semo-plugin-shell
```

构建顺序要求：**core 必须最先构建**，根目录 build 脚本已保证此顺序。

---

## 各包职责

### @semo/core（核心库）

整个框架的基石，提供以下核心能力：

| 文件                            | 职责                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `src/common/core.ts`            | **Core 类（单例）** — 启动入口，委托各模块完成具体工作                                |
| `src/common/config-manager.ts`  | 配置加载与合并（home → project → env-specific → CLI args）                            |
| `src/common/plugin-loader.ts`   | 插件发现与加载（`getAllPluginsMapping()`）                                            |
| `src/common/command-loader.ts`  | 命令注册（通过 Yargs `commandDir()`）                                                 |
| `src/common/package-manager.ts` | 运行时包管理（`installPackage()` / `importPackage()`）                                |
| `src/common/hook.ts`            | Hook 类 — 钩子定义与名称标准化                                                        |
| `src/common/types.ts`           | TypeScript 类型定义：`InitOptions`、`PluginConfig`、`CombinedConfig`、`HookOption` 等 |
| `src/common/utils.ts`           | 工具函数：`formatRcOptions`、`outputTable`、`exec`/`execSync`/`execPromise`、`md5` 等 |
| `src/common/log.ts`             | 彩色日志输出：`log`、`info`、`warn`、`error`、`success`                               |
| `src/common/debug.ts`           | 基于 `debug` 包的调试日志，支持频道                                                   |
| `src/common/prompts.ts`         | 交互式提示，re-export `@inquirer/prompts`                                             |

### @semo/cli（CLI 入口）

提供 `semo` 命令行可执行文件和全部内置命令：

| 命令                 | 说明                                                             |
| -------------------- | ---------------------------------------------------------------- |
| `semo init`          | 初始化项目，生成 `.semorc.yml` 和目录结构                        |
| `semo create <name>` | 从 Git 仓库或模板创建项目脚手架                                  |
| `semo repl`          | 启动交互式 REPL，支持钩子注入上下文                              |
| `semo run`           | 自动安装并运行插件命令                                           |
| `semo generate`      | 代码生成（可扩展），内置 `generate command` 和 `generate plugin` |
| `semo config`        | 管理 rc 配置文件（get/set/delete/list）                          |
| `semo status`        | 通过钩子收集并显示环境信息                                       |
| `semo cleanup`       | 清理缓存                                                         |
| `semo application`   | 应用级命令命名空间，作为项目级命令的扩展入口                     |

### semo-plugin-hook

提供钩子管理命令：`semo hook list`（列出所有已注册钩子）、`semo hook info`。

### semo-plugin-plugin

提供插件管理命令：`semo plugin list`、`semo plugin install`、`semo plugin uninstall`。

### semo-plugin-script

提供 `semo script <file>` 命令，可执行遵循 builder/handler 模式的脚本文件。同时扩展 `generate` 命令，提供 `semo generate script`。

### semo-plugin-shell

提供 `semo shell` 交互式 Shell，支持命令前缀。

---

## 核心概念

### 1. Core 类（单例）

`Core` 是整个框架的心脏，位于 `packages/core/src/common/core.ts`，在进程中仅存在一个实例（通过 `Core.getInstance()` / `Core.setInstance()` 管理）。

**核心职责：**

- **配置加载与合并** — 从多个来源按优先级合并配置
- **插件发现** — `getAllPluginsMapping()` 按命名约定扫描插件
- **命令加载** — `launch()` 通过 Yargs `commandDir()` 注册命令
- **钩子调用** — `invokeHook()` 调用所有插件的钩子函数
- **包管理** — `installPackage()` / `importPackage()` 运行时动态安装和导入 npm 包

### 2. 插件系统

插件遵循命名约定：`semo-plugin-<name>` 或 `@scope/semo-plugin-<name>`。

**插件目录结构**（由各插件 `.semorc.yml` 声明）：

```
semo-plugin-xxx/
├── src/
│   ├── commands/       # 命令源码（commandMakeDir）
│   ├── extends/        # 扩展命令源码（extendMakeDir）
│   └── hooks/          # 钩子源码（hookMakeDir）
├── lib/
│   ├── commands/       # 编译后的命令（commandDir）
│   ├── extends/        # 编译后的扩展（extendDir）
│   └── hooks/          # 编译后的钩子（hookDir）
└── .semorc.yml
```

**插件发现顺序**（`getAllPluginsMapping()`）：

1. Core 内置 `plugins/` 目录
2. 全局 npm 中 `@semo/cli` 的 peer 目录
3. 用户目录 `~/.semo/node_modules/` 及 `~/.semo/home-plugin-cache/node_modules/`
4. 当前项目 `node_modules/`
5. `.semorc.yml` 中 `pluginDir` 配置的本地目录
6. 当前项目自身（若名称符合插件模式）
7. `SEMO_PLUGIN_DIR` 环境变量

插件可通过配置进行过滤：`$plugins.include`、`$plugins.exclude`、`$plugins.register`。

### 3. 钩子系统

钩子位于 `packages/core/src/common/hook.ts`，遵循 `hook_<name>` 命名模式，按插件命名空间组织（如 `semo:repl`、`semo:status`）。

**`Core.invokeHook()` 支持 5 种合并模式：**

| 模式             | 说明                               |
| ---------------- | ---------------------------------- |
| `assign`（默认） | `Object.assign()` 合并所有插件结果 |
| `merge`          | `_.merge()` 深度合并               |
| `push`           | 收集到数组中                       |
| `replace`        | 最后一个值覆盖                     |
| `group`          | 按插件名分组                       |

**内置钩子**（定义在 `packages/cli/src/hooks/index.ts`）：

- `hook_hook` — 声明可用钩子名称和描述
- `hook_repl` — 向 REPL 上下文注入 VERSION
- `hook_create_project_template` — 注册项目模板
- `hook_status` — 报告系统/环境信息

### 4. 命令系统

命令遵循 Yargs `commandDir()` 约定，每个命令文件导出：

```typescript
export const command = 'init' // 命令字符串
export const desc = 'Initialize ...' // 描述
export const aliases = ['i'] // 别名（可选）
export const builder = (yargs) => {} // 配置参数
export const handler = async (argv) => {} // 处理函数
export const plugin = 'semo' // 所属插件（可选）
```

`Core.visit()` 方法作为命令文件的访问器，注入中间件向命令提供插件配置（`$config`）。

### 5. 子命令扩展机制

`generate`、`config`、`hook`、`plugin`、`application` 等命令通过 `Core.extendSubCommand()` 从三个来源加载子命令：

1. 命令自身目录（如 `commands/generate/`）
2. 插件扩展目录（如 `extends/semo/src/commands/generate/`）
3. 应用扩展目录

这使得插件可以扩展其他插件的命令。例如 `semo-plugin-script` 通过 `extends/semo/src/commands/generate/script.ts` 扩展了 `generate` 命令。

---

## 配置系统

配置从多个来源加载，按优先级递增合并：

```
1. 全局配置      ~/.semo/.semorc.yml
2. 插件配置      各插件自身的 .semorc.yml
3. 项目配置      项目级 .semorc.yml（通过 find-up 查找）
4. package.json  项目 package.json 中的 "semo" 字段
5. 环境配置      .semorc.production.yml / .semorc.development.yml 等
6. CLI 参数      命令行参数覆盖一切
```

**关键配置项：**

| 配置项                                  | 说明                |
| --------------------------------------- | ------------------- |
| `commandDir`                            | 命令文件目录        |
| `pluginDir`                             | 本地插件目录        |
| `extendDir`                             | 扩展命令目录        |
| `scriptDir`                             | 脚本目录            |
| `hookDir`                               | 钩子目录            |
| `typescript`                            | 是否使用 TypeScript |
| `$plugin.<name>.*`                      | 插件特定配置        |
| `$plugins.register`                     | 手动注册插件及路径  |
| `$plugins.include` / `$plugins.exclude` | 插件过滤            |

---

## CLI 启动流程

入口：`packages/cli/src/bin.ts`

```
1. 创建 Core 单例实例
2. 调用 launch() 启动
   ├── 加载 .env 环境变量（dotenv）
   ├── 读取 stdin（支持管道输入）
   ├── 解析 process.argv（yargs-parser）
   ├── 读取 core package.json 获取版本信息
   ├── 加载并合并应用配置（home → project → env-specific）
   ├── 发现所有插件（getAllPluginsMapping）
   ├── 合并所有插件 rc 配置
   ├── 初始化 Yargs 实例，注册全局选项
   │   （--verbose, --plugin-prefix, --disable-core-command 等）
   ├── 注册全局中间件
   │   （注入 $core, $yargs, $input, $log, $prompt, $debug 到 argv）
   ├── 触发 before_command 钩子（可选）
   ├── 加载命令：core 命令 → 插件命令 → 应用命令
   ├── 注册默认 $0 命令
   └── yargs.parseAsync() 解析并执行
```

---

## 构建与工具链

| 工具       | 版本/说明                                              |
| ---------- | ------------------------------------------------------ |
| 包管理器   | pnpm v10.10.0                                          |
| TypeScript | v5.8.3，ES2022 target，NodeNext modules                |
| 构建       | `tsc --build`（无 bundler），src/ → lib/               |
| 模块系统   | ESM（`"type": "module"`）                              |
| 测试       | Vitest v3.1.2，V8 覆盖率                               |
| Lint       | ESLint v9 + TypeScript 插件                            |
| 格式化     | Prettier v3.5.3                                        |
| Git Hooks  | Husky v9 + lint-staged                                 |
| 版本发布   | Lerna v8（`lerna version` + `lerna publish from-git`） |

---

## 关键外部依赖

| 依赖                                       | 用途                       |
| ------------------------------------------ | -------------------------- |
| `yargs` (18.0.0) + `yargs-parser` (22.0.0) | CLI 参数解析               |
| `dotenv` / `dotenv-expand`                 | 环境变量加载（懒加载）     |
| `find-up`                                  | 向上查找配置文件           |
| `glob`                                     | 文件模式匹配（插件发现）   |
| `yaml`                                     | YAML 解析（`.semorc.yml`） |
| `@inquirer/prompts`                        | 交互式提示                 |
| `picocolors` / `colorize-template`         | 终端着色                   |
| `debug`                                    | 调试日志                   |
| `table`                                    | 终端表格格式化             |
