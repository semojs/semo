# 钩子机制

钩子机制是 Semo 插件系统的重要组成部分，能够实现跨插件通信和扩展。钩子让插件可以在定义好的执行节点上相互影响行为。

## 钩子的定义（调用钩子）

在你的插件/命令中定义并调用一个钩子：

```typescript
const hookData = await argv.$core.invokeHook('semo:repl', { mode: 'assign' })
```

或使用独立函数：

```typescript
import { invokeHook } from '@semo/core'

const hookData = await invokeHook('semo:repl', { mode: 'assign' })
```

格式为 `<插件名>:<钩子名>`。如果没有 `hook_` 前缀，会自动添加。

:::info
从 `v1.0.0` 开始，钩子调用需要指明前缀（即谁创建了这个钩子）。实现方也需要指明是哪个插件定义的钩子，否则无法识别。
:::

## 钩子的实现

钩子在插件的 `hooks/index.ts` 文件中实现。通过零配置约定，Semo 会自动检测 `lib/hooks/index.js`（TS 运行时模式下为 `src/hooks/index.ts`）。

实现钩子有三种方式，各有优势。

### 方式一：普通对象（零依赖）

无需任何 import — 适合应用级钩子，或者不想把 `@semo/core` 加入依赖的场景。

```typescript
// src/hooks/index.ts
export const hook_repl = {
  semo: (core, argv, options) => {
    return { myUtil: () => 'hello' }
  },
}
```

对象的 key 是定义该钩子的插件名。核心钩子用 `semo`，插件钩子用完整名如 `semo-plugin-foo`。

### 方式二：Hook 类（类型安全，多插件）

从 `@semo/core` 导入 `Hook` 类，获得自动插件名规范化和类型提示。特别适合同时实现多个插件的钩子。

```typescript
import { Hook } from '@semo/core'

export const hook_repl = new Hook('semo', (core, argv, options) => {
  return { myUtil: () => 'hello' }
})
```

`Hook` 类会自动规范化插件名 — 传 `'foo'` 等同于 `'semo-plugin-foo'`。

同时实现多个插件定义的钩子：

```typescript
import { Hook } from '@semo/core'

export const hook_bar = new Hook({
  'semo-plugin-foo': (core, argv, options) => { ... },
  'semo-plugin-baz': (core, argv, options) => { ... },
})
```

### 方式三：下划线前缀（内联命名空间）

用 `__` 作为分隔符将插件名编码到导出名中。无需 import。

```typescript
// 'semo' 插件的 hook_create_project_template
export const semo__hook_create_project_template = {
  demo_repo: {
    repo: 'demo_repo.git',
    branch: 'master',
    alias: ['demo'],
  },
}
```

适合返回值是静态数据（非函数）的钩子。

### 如何选择？

| 方式       | 需要 `@semo/core`？ | 适用场景                         |
| ---------- | ------------------- | -------------------------------- |
| 普通对象   | 否                  | 简单钩子、应用级代码             |
| Hook 类    | 是                  | 类型安全、多插件钩子、名称规范化 |
| 下划线前缀 | 否                  | 静态数据、单插件钩子             |

## 钩子的返回值

钩子可以返回对象、函数或 Promise。如果返回函数，会使用函数的执行结果。

### 合并模式

当钩子从多个插件收集数据时，合并模式决定如何组合结果：

| 模式             | 说明                                          |
| ---------------- | --------------------------------------------- |
| `assign`（默认） | `Object.assign()` — 后面的值按 key 覆盖前面的 |
| `merge`          | 深度合并所有结果                              |
| `group`          | 按插件名分组                                  |
| `push`           | 所有返回值放入数组                            |
| `replace`        | 只保留最后一个插件的返回值                    |

```typescript
// group 模式返回 { pluginA: {...}, pluginB: {...} }
const grouped = await invokeHook('semo:hook', { mode: 'group' })

// push 模式返回 [result1, result2, ...]
const all = await invokeHook('semo:status', { mode: 'push' })
```

## 核心内置钩子说明

| 钩子                      | 说明                                     |
| ------------------------- | ---------------------------------------- |
| `before_command`          | 命令执行前触发（默认禁用）               |
| `hook`                    | 声明可用钩子及其用途                     |
| `repl`                    | 向 REPL 环境注入上下文                   |
| `repl_command`            | 定义自定义 REPL 点命令                   |
| `status`                  | 向 `semo status` 输出注入信息            |
| `create_project_template` | 为 `semo create --template` 注册项目模板 |

:::tip
从 `v1.15.1` 起，`before_command` 默认不执行。通过 `--enable-core-hook=before_command` 启用。
:::

## 使用示例

### `hook_repl` — 注入 REPL 工具

```typescript
// 方式一：普通对象
export const hook_repl = {
  semo: () => ({
    add: async (a, b) => a + b,
    multiply: async (a, b) => a * b,
  }),
}

// 方式二：Hook 类
import { Hook } from '@semo/core'

export const hook_repl = new Hook('semo', () => ({
  add: async (a, b) => a + b,
  multiply: async (a, b) => a * b,
}))
```

在 REPL 中使用：

```
semo repl
>>> await Semo.hooks.application.add(1, 2)
3
```

### `hook_create_project_template` — 注册项目模板

```typescript
// 方式三：下划线前缀（静态数据，无需 import）
export const semo__hook_create_project_template = {
  my_template: {
    repo: 'https://github.com/user/template.git',
    branch: 'main',
    alias: ['mt'],
  },
}
```

### `hook_repl_command` — 自定义 REPL 命令

```typescript
export const hook_repl_command = {
  semo: () => ({
    hello: {
      help: '打招呼',
      action(name) {
        this.clearBufferedCommand()
        console.log('hello', name || 'world')
        this.displayPrompt()
      },
    },
  }),
}
```

注意：`action` 必须使用普通函数（非箭头函数）以保证 `this` 指向正确。
