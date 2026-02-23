# 插件开发

## 快速开始

`Semo` 插件就是一个标准的 `Node` 模块，只不过要符合一些目录和文件结构的约定。为了简化流程，我们提供了各种辅助工具，例如代码自动生成。以下是推荐的插件开发流程，但在熟悉开发流程之后，也完全可以从一个空目录开始手动构建一个插件。

### 第一步：根据模板创建插件目录

```
semo create semo-plugin-xyz --template=plugin
```

这里使用了内置的插件模板。按照之前配置管理说的，我们完全可以覆盖 `repo`、`branch` 或 `--template` 选项。

### 第二步：进入插件目录，验证一切正常

```
cd semo-plugin-xyz
semo hi
```

这是插件模板内置的一个命令。如果你看到 `Hey you!` 就证明已经准备好了。

## 零配置约定

从 `v2.0` 起，插件**无需** `.semorc.yml` 文件即可工作。Semo 会自动检测以下目录：

- `lib/commands`（使用 TS 运行时如 `tsx` 时为 `src/commands`）
- `lib/hooks`
- `lib/extends`

仅当需要使用非标准目录路径或添加插件特定配置时，才需要 `.semorc.yml`。

## 添加命令

插件模板是基于 `Typescript` 的。开发时建议开着 `pnpm watch` 命令窗口来实时编译。

```
semo generate command xyz
```

### 命令类型接口

Semo 提供了 `SemoCommand` 类型来为命令文件提供类型安全：

```typescript
import type { SemoCommand, ArgvExtraOptions } from '@semo/core'

export default {
  command: 'xyz',
  desc: '我的命令描述',
  plugin: 'xyz',
  builder: (yargs) => {
    return yargs.option('name', { type: 'string', describe: '你的名字' })
  },
  handler: async (argv: ArgvExtraOptions) => {
    console.log(`Hello ${argv.name}`)
  },
} satisfies SemoCommand
```

也可以使用传统的命名导出方式：

```typescript
export const command = 'xyz'
export const desc = '我的命令描述'
export const plugin = 'xyz'
export const builder = (yargs) => { ... }
export const handler = async (argv) => { ... }
```

`SemoCommand` 可用字段：

| 字段                | 类型                 | 说明                               |
| ------------------- | -------------------- | ---------------------------------- |
| `command`           | `string \| string[]` | 命令名和位置参数（必填）           |
| `desc` / `describe` | `string`             | 命令描述                           |
| `aliases`           | `string \| string[]` | 命令别名                           |
| `plugin`            | `string`             | 插件名（启用 `argv.$config` 注入） |
| `disabled`          | `boolean`            | 设为 `true` 可禁用命令             |
| `noblank`           | `boolean`            | 跳过 handler 前的空行              |
| `builder`           | `function \| object` | Yargs 参数构建器                   |
| `handler`           | `function`           | 命令处理函数（接收 `argv`）        |
| `middlewares`       | `function[]`         | Yargs 中间件                       |

### Handler 中的 argv 注入

`handler` 函数接收的 `argv` 中注入了以下辅助工具：

- `argv.$core` — Core 单例实例
- `argv.$config` — 来自 `.semorc.yml` 的插件配置（需设置 `plugin` 字段）
- `argv.$input` — 管道输入的 stdin 内容
- `argv.$prompt` — 交互式提示（`select`, `input`, `confirm` 等）
- `argv.$log`, `argv.$info`, `argv.$warn`, `argv.$error`, `argv.$success` — 彩色日志函数
- `argv.$fatal` — 输出错误并退出（等价于 `error()` + `process.exit(1)`）

### 错误处理

使用 `fatal()` 在需要输出错误并终止执行时：

```typescript
import { fatal } from '@semo/core'

export const handler = async (argv) => {
  if (!argv.name) {
    fatal('Name is required.') // 输出错误并退出
  }
  // 如果 name 缺失，这行不会执行
}
```

`error()` 只打印但**不会**终止执行 — 调用后需要手动 `return`，或直接使用 `fatal()` 替代。

## 实现钩子

详见[钩子机制](../hook/)文档。

查询当前环境支持的钩子：

```
semo hook list
```

### 例子：实现 `hook_repl`

```typescript
// src/hooks/index.ts
import { Hook } from '@semo/core'

export const hook_repl = new Hook('semo', (core, argv) => {
  return {
    add: async (a, b) => a + b,
    multiply: async (a, b) => a * b,
  }
})
```

然后在 REPL 环境中使用：

```
semo repl
>>> await Semo.hooks.application.add(1, 2)
3
```

### 例子：实现 `hook_create_project_template`

```typescript
// src/hooks/index.ts
import { Hook } from '@semo/core'

export const hook_create_project_template = new Hook('semo', () => ({
  demo_repo: {
    repo: 'demo_repo.git',
    branch: 'master',
    alias: ['demo'],
  },
}))
```

## 暴露方法

插件也可以作为标准模块对外暴露方法：

:::warning
由于 `Semo` 的 `run` 命令依赖于入口文件进行定位，因此要求插件在 `package.json` 中声明入口。
:::

```json
// package.json
{
  "main": "lib/index.js"
}
```

```js
// index.js
export const func = () => {}
```

## 发布插件

### 1. 上传代码到 git 仓库

开源选 `Github`，内部插件上传到公司的 `Github` 私有仓库或 `Gitlab`。

### 2. 修改 `package.json`

主要是包名、版本、协议、仓库地址、首页地址等。

### 3. 获得 npm 仓库账号并登录

```
npm login --registry=[YOUR_REGISTRY]
```

### 4. 测试插件包

```
npm pack --dry-run
```

### 5. 发布

```
npm version [patch|minor|major]
npm publish
```

## 插件的层级

Semo 的插件系统会扫描多个位置以增加灵活性：

- **全局安装**：`npm install -g semo-plugin-xxx` — 全局可用
- **家目录缓存**：`semo plugin install semo-plugin-xxx` — 安装到 `~/.semo/home-plugin-cache`，全局可用
- **项目本地**：`npm install semo-plugin-xxx` — 仅在当前项目可用

## 直接运行远程插件

```
semo run semo-plugin-serve
```

首次运行时下载，后续复用缓存。使用 `--force` 强制更新。

## 特殊的家目录插件

> 此特性 `v0.8.0` 引入

在 `~/.semo` 目录添加 `.semorc.yml` 配置文件后，该目录自动识别为全局插件。你可以在其中定义命令、扩展其他插件的命令和钩子，全局可用且无需发布到 npm。

## 识别任意目录里的插件

```
semo help --plugin-dir=dir1 --plugin-dir=dir2
```

或通过环境变量：

```
SEMO_PLUGIN_DIR=dir3 semo help
```

## 插件的主动注册机制

> `v1.3.0` 引入

在 `.semorc.yml` 的 `$plugins.register` 下配置插件。一旦使用主动注册，自动扫描自动失效。

```yml
$plugins:
  register:
    plugin-a: /绝对路径
    plugin-b: ./相对路径
    plugin-c: ~从家目录的相对路径
    plugin-d: true # 使用 Node.js 模块解析
```

作为 key 的插件名可以省略 `semo-plugin-` 前缀。
