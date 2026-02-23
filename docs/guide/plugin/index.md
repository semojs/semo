# Plugin Development

## Quick Start

A `Semo` plugin is a standard `Node` module that follows certain directory and file structure conventions. To simplify the process, we provide tools like code auto-generation. Below is the recommended plugin development flow, but once familiar, you can also build a plugin from an empty directory.

### Step 1: Create plugin directory from template

```
semo create semo-plugin-xyz --template=plugin
```

This uses the built-in plugin template. As mentioned in configuration management, you can override the `repo`, `branch`, or `--template` options.

### Step 2: Enter the plugin directory and verify

```
cd semo-plugin-xyz
semo hi
```

This is a built-in template command. If you see `Hey you!`, everything is ready.

## Zero-Config Convention

Since `v2.0`, plugins work **without** a `.semorc.yml` file. Semo automatically detects:

- `lib/commands` (or `src/commands` when using a TS runner like `tsx`)
- `lib/hooks`
- `lib/extends`

You only need `.semorc.yml` if you want to use non-standard directory paths or add plugin-specific configuration.

## Adding Commands

The plugin template is Typescript-based. During development, keep `pnpm watch` running for real-time compilation.

```
semo generate command xyz
```

### Command Type Interface

Semo provides a `SemoCommand` type for type-safe command files:

```typescript
import type { SemoCommand, ArgvExtraOptions } from '@semo/core'

export default {
  command: 'xyz',
  desc: 'My command description',
  plugin: 'xyz',
  builder: (yargs) => {
    return yargs.option('name', { type: 'string', describe: 'Your name' })
  },
  handler: async (argv: ArgvExtraOptions) => {
    console.log(`Hello ${argv.name}`)
  },
} satisfies SemoCommand
```

You can also use the traditional named exports style:

```typescript
export const command = 'xyz'
export const desc = 'My command description'
export const plugin = 'xyz'
export const builder = (yargs) => { ... }
export const handler = async (argv) => { ... }
```

Available `SemoCommand` fields:

| Field               | Type                 | Description                                    |
| ------------------- | -------------------- | ---------------------------------------------- |
| `command`           | `string \| string[]` | Command name and positional args (required)    |
| `desc` / `describe` | `string`             | Command description                            |
| `aliases`           | `string \| string[]` | Command aliases                                |
| `plugin`            | `string`             | Plugin name (enables `argv.$config` injection) |
| `disabled`          | `boolean`            | Set `true` to disable the command              |
| `noblank`           | `boolean`            | Skip blank line before handler                 |
| `builder`           | `function \| object` | Yargs builder for options                      |
| `handler`           | `function`           | Command handler (receives `argv`)              |
| `middlewares`       | `function[]`         | Yargs middlewares                              |

### Handler argv injections

The `handler` function receives `argv` augmented with these helpers:

- `argv.$core` — Core singleton instance
- `argv.$config` — Plugin config from `.semorc.yml` (when `plugin` is set)
- `argv.$input` — Piped stdin content
- `argv.$prompt` — Interactive prompts (`select`, `input`, `confirm`, etc.)
- `argv.$log`, `argv.$info`, `argv.$warn`, `argv.$error`, `argv.$success` — Colored log functions
- `argv.$fatal` — Log error and exit (equivalent to `error()` + `process.exit(1)`)

### Error Handling

Use `fatal()` when you need to log an error and stop execution:

```typescript
import { fatal } from '@semo/core'

export const handler = async (argv) => {
  if (!argv.name) {
    fatal('Name is required.') // prints error and exits
  }
  // This line won't execute if name is missing
}
```

`error()` only prints but does NOT stop execution — always add `return` after it, or use `fatal()` instead.

## Implementing Hooks

See the [Hook Mechanism](../hook/) documentation for details.

Query available hooks in the current environment:

```
semo hook list
```

### Example: Implement `hook_repl`

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

Then use in the REPL:

```
semo repl
>>> await Semo.hooks.application.add(1, 2)
3
```

### Example: Implement `hook_create_project_template`

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

## Exposing Methods

Plugins can also act as standard modules:

:::warning
Semo plugins must declare an entry point in `package.json` for the `run` command to work.
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

## Publishing Plugins

### 1. Upload code to a git repository

Open source: `Github`. Internal: your company's `Github` private repo or `Gitlab`.

### 2. Modify `package.json`

Set package name, version, license, repository URL, and homepage.

### 3. Obtain an npm account and log in

```
npm login --registry=[YOUR_REGISTRY]
```

### 4. Test the plugin package

```
npm pack --dry-run
```

### 5. Publish

```
npm version [patch|minor|major]
npm publish
```

## Plugin Levels

Semo scans multiple locations for plugins:

- **Global**: `npm install -g semo-plugin-xxx` — available everywhere
- **Home cache**: `semo plugin install semo-plugin-xxx` — installed to `~/.semo/home-plugin-cache`, globally available
- **Project-local**: `npm install semo-plugin-xxx` — only available in the current project

## Running Remote Plugins

```
semo run semo-plugin-serve
```

Downloaded on first run, cached for reuse. Use `--force` to force update.

## Special Home Directory Plugin

> Introduced in `v0.8.0`

Adding a `.semorc.yml` in `~/.semo` makes the `.semo` directory a global plugin. You can define personal commands, extend other plugin commands, and implement hooks — all globally available without publishing to npm.

## Recognizing Plugins in Arbitrary Directories

```
semo help --plugin-dir=dir1 --plugin-dir=dir2
```

Or via environment variable:

```
SEMO_PLUGIN_DIR=dir3 semo help
```

## Plugin Active Registration

> Introduced in `v1.3.0`

Add plugin entries under `$plugins.register` in `.semorc.yml`. When active registration is used, automatic scanning is disabled.

```yml
$plugins:
  register:
    plugin-a: /absolute/path
    plugin-b: ./relative/path
    plugin-c: ~relative/path/from/home
    plugin-d: true # Use Node.js module resolution
```

The `semo-plugin-` prefix can be omitted in plugin key names.
