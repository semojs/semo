# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm install              # Install all dependencies (triggers prepare → build all packages)
pnpm build                # Build core first, then all packages in parallel
pnpm dev                  # Watch mode for all packages

pnpm test                 # Run all tests (vitest)
pnpm test -- packages/core/tests/utils.test.ts          # Run a single test file
pnpm test -- -t "test name pattern"                      # Run tests matching a name

pnpm lint                 # ESLint (v9 flat config)
pnpm lint:fix             # ESLint with auto-fix
pnpm format               # Prettier format all .ts/.js files

pnpm deploy               # Lerna version patch → triggers publish CI on tag push
```

Build a single package (useful during development):

```bash
pnpm --filter=@semo/core build
pnpm --filter=@semo/cli build
pnpm --filter=semo-plugin-hook build
```

## Architecture

Semo is a **plugin-based CLI framework** wrapping Yargs. The monorepo has 6 active packages:

- **@semo/core** — Singleton `Core` class, plugin discovery, config merging, hook system, command loading. All other packages depend on this.
- **@semo/cli** — The `semo` binary and built-in commands (init, create, repl, run, generate, config, status, cleanup, application).
- **semo-plugin-{hook,plugin,script,shell}** — Optional plugins providing additional commands.

### Core Class (Singleton)

`packages/core/src/common/core.ts` — The central orchestrator. Access via `Core.getInstance()`. Responsibilities:

- Config loading & merging (`.semorc.yml` from home → project → env-specific → CLI args)
- Plugin discovery (`getAllPluginsMapping()`) by naming convention `semo-plugin-*`
- Hook invocation (`invokeHook()`) with 5 merge modes: assign, merge, push, replace, group
- Command registration via Yargs `commandDir()`
- Runtime package management (`installPackage()` / `importPackage()`)

The Core class delegates to extracted modules: `config-manager.ts`, `plugin-loader.ts`, `package-manager.ts`, `command-loader.ts`.

### Plugin Convention

Plugins expose `lib/commands/`, `lib/hooks/`, `lib/extends/` directories. Discovery scans: core built-in → global npm → `~/.semo/node_modules/` → project `node_modules/` → `pluginDir` config → `SEMO_PLUGIN_DIR` env.

**Zero-config**: if no `.semorc.yml` exists, auto-detects `lib/commands`, `lib/hooks`, `lib/extends`.

### Command Pattern

Each command file exports: `command`, `desc`, `aliases?`, `builder`, `handler`, `plugin?`. The `builder` receives Yargs instance; `handler` receives `argv` augmented with `$core`, `$config`, `$input`, `$log`, `$prompt`, `$debug`.

### Hook Pattern

Hooks follow `hook_<name>` naming. Plugins implement hook functions in their `hooks/` directory. `Core.invokeHook('hookName', { opts })` calls all registered handlers.

### Subpath Exports

`@semo/core` provides: `./utils`, `./log`, `./hook`, `./prompts`, `./debug`, `./template`.

## Key Conventions

- **ESM-only** — All packages use `"type": "module"`, `NodeNext` module resolution.
- **Lazy loading** — Heavy dependencies (`@inquirer/prompts`, `table`, `dotenv`, `json-colorizer`) are loaded via dynamic `import()` on first use.
- **Build order** — Core must build first; root `build` script handles this automatically.
- **Plugin peer deps** — Plugins declare `@semo/core` in both `peerDependencies` (for publishing) and `devDependencies: workspace:^` (for development).
- **`error()` doesn't halt** — The `error()` function from `@semo/core/log` only prints; always `return` after calling it.
- **Plugin manifest cache** — Located at `~/.semo/cache/plugin-manifest.json`.

## Git & Release

- Git commits must be in **English only**, must NOT contain "claude" or "Co-Authored-By".
- Never use `git commit --amend`; always create new commits.
- Versioning via `lerna version patch/minor/major` → pushes git tag → GitHub Actions publishes to npm.
