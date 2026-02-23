# Hook Mechanism

The hook mechanism is a key part of Semo's plugin system, enabling cross-plugin communication and extensibility. Hooks allow plugins to influence each other's behavior at defined execution points.

## Hook Definition (Calling a Hook)

To define and invoke a hook in your plugin/command:

```typescript
const hookData = await argv.$core.invokeHook('semo:repl', { mode: 'assign' })
```

Or using the standalone function:

```typescript
import { invokeHook } from '@semo/core'

const hookData = await invokeHook('semo:repl', { mode: 'assign' })
```

The format is `<plugin>:<hook_name>`. The `hook_` prefix is automatically added if not present.

:::info
Since `v1.0.0`, hook invocation requires specifying the plugin prefix (who created the hook). Implementers must also specify which plugin's hook they're implementing, otherwise the hook won't be recognized.
:::

## Hook Implementation

Hooks are implemented in the `hooks/index.ts` file of your plugin. With zero-config convention, Semo automatically detects `lib/hooks/index.js` (or `src/hooks/index.ts` in TS runner mode).

There are three ways to implement hooks, each with its own advantages.

### Style 1: Plain object (zero-dependency)

No import needed — ideal for application-level hooks or when you don't want to add `@semo/core` as a dependency.

```typescript
// src/hooks/index.ts
export const hook_repl = {
  semo: (core, argv, options) => {
    return { myUtil: () => 'hello' }
  },
}
```

The object keys are plugin names that defined the hook. Use full names like `semo-plugin-foo` or the short name `semo` for core hooks.

### Style 2: Hook class (type-safe, multi-plugin)

Import the `Hook` class from `@semo/core` for automatic plugin name normalization and type hints. Especially useful when implementing hooks from multiple plugins.

```typescript
import { Hook } from '@semo/core'

export const hook_repl = new Hook('semo', (core, argv, options) => {
  return { myUtil: () => 'hello' }
})
```

The `Hook` class normalizes plugin names automatically — passing `'foo'` is equivalent to `'semo-plugin-foo'`.

For implementing hooks defined by multiple plugins at once:

```typescript
import { Hook } from '@semo/core'

export const hook_bar = new Hook({
  'semo-plugin-foo': (core, argv, options) => { ... },
  'semo-plugin-baz': (core, argv, options) => { ... },
})
```

### Style 3: Underscore prefix (inline namespace)

Encode the plugin name into the export name using `__` as separator. No import needed.

```typescript
// 'semo' plugin's hook_create_project_template
export const semo__hook_create_project_template = {
  demo_repo: {
    repo: 'demo_repo.git',
    branch: 'master',
    alias: ['demo'],
  },
}
```

This is convenient for static data hooks where the return value is not a function.

### Which style to choose?

| Style             | Needs `@semo/core`? | Best for                                            |
| ----------------- | ------------------- | --------------------------------------------------- |
| Plain object      | No                  | Simple hooks, application-level code                |
| Hook class        | Yes                 | Type safety, multi-plugin hooks, name normalization |
| Underscore prefix | No                  | Static data, single-plugin hooks                    |

## Hook Return Values

Hooks can return objects, functions, or Promises. If a function is returned, its execution result will be used.

### Merge Modes

When a hook collects data from multiple plugins, the merge mode determines how results are combined:

| Mode               | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `assign` (default) | `Object.assign()` — later values override earlier ones by key |
| `merge`            | Deep merge of all results                                     |
| `group`            | Group results by plugin name                                  |
| `push`             | Collect all values into an array                              |
| `replace`          | Only keep the last plugin's return value                      |

```typescript
// Example: group mode returns { pluginA: {...}, pluginB: {...} }
const grouped = await invokeHook('semo:hook', { mode: 'group' })

// Example: push mode returns [result1, result2, ...]
const all = await invokeHook('semo:status', { mode: 'push' })
```

## Core Built-in Hooks

| Hook                      | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| `before_command`          | Fires before command execution (disabled by default)    |
| `hook`                    | Declare available hooks and their descriptions          |
| `repl`                    | Inject context into the REPL environment                |
| `repl_command`            | Define custom REPL dot-commands                         |
| `status`                  | Inject info into `semo status` output                   |
| `create_project_template` | Register project templates for `semo create --template` |

:::tip
Since `v1.15.1`, `before_command` is disabled by default. Enable with `--enable-core-hook=before_command`.
:::

## Examples

### `hook_repl` — Inject REPL utilities

```typescript
// Style 1: Plain object
export const hook_repl = {
  semo: () => ({
    add: async (a, b) => a + b,
    multiply: async (a, b) => a * b,
  }),
}

// Style 2: Hook class
import { Hook } from '@semo/core'

export const hook_repl = new Hook('semo', () => ({
  add: async (a, b) => a + b,
  multiply: async (a, b) => a * b,
}))
```

Use in REPL:

```
semo repl
>>> await Semo.hooks.application.add(1, 2)
3
```

### `hook_create_project_template` — Register templates

```typescript
// Style 3: Underscore prefix (static data, no import needed)
export const semo__hook_create_project_template = {
  my_template: {
    repo: 'https://github.com/user/template.git',
    branch: 'main',
    alias: ['mt'],
  },
}
```

### `hook_repl_command` — Custom REPL commands

```typescript
export const hook_repl_command = {
  semo: () => ({
    hello: {
      help: 'Say hello',
      action(name) {
        this.clearBufferedCommand()
        console.log('hello', name || 'world')
        this.displayPrompt()
      },
    },
  }),
}
```

Note: Use a regular function (not arrow function) for `action` to preserve `this` context.
