# Plugin Development

## Quick Start

A `Semo` plugin is a standard `Node` module, but it needs to conform to certain directory and file structure conventions. Since these conventions are often hard to remember, we provide various auxiliary tools for plugin developers or tool users, such as code auto-generation. This describes the recommended plugin development process, but after becoming familiar with it, you can also manually build a plugin starting from an empty directory.

### First Step: Create plugin directory based on template

```
semo create semo-plugin-xyz --template=plugin
```

This uses the built-in plugin template. As mentioned in the configuration management section, we can completely override the `repo` and `branch` options, or override the `--template` option to avoid passing default parameters every time.

### Second Step: Enter the plugin directory, execute the default command, prove everything is normal

```
cd semo-plugin-xyz
semo hi
```

This is a command built into the plugin template. After initialization is complete, enter the directory to execute it, completing your first interaction with the plugin command. If you see it answer you `Hey you!`, it means it's ready, and you can start writing scripts that truly change the world.

## Adding Commands

Note that this plugin template is based on `Typescript`, so you need some `Typescript` foundation. During development, it's recommended to keep the `pnpm watch` command window open for real-time compilation, allowing development and testing simultaneously.

```
semo generate command xyz
```

Generally, the plugin name and the commands encapsulated by the plugin have some association. Here we add an `xyz` command, but you can also modify the previous `hi` command. Once you truly master plugin development, the default `hi` command should be deleted.

## Implementing Hooks

Implementing hooks is another purpose of developing plugins. Hooks are often defined by other plugins or business projects. By implementing hooks, you can influence and change the behavior of other plugins.

Query which hooks are supported in the current environment with this command:

```
semo hook list
```

### Example 1: Implement `hook_create_project_template`

```js
// src/hooks/index.ts
export const semo__hook_create_project_template = {
  demo_repo: {
    repo: 'demo_repo.git',
    branch: 'master',
    alias: ['demo'],
  },
}
```

Through this hook, when the `semo create [PROJECT] --template` command is executed, we can select custom project templates. We only need to remember the alias, not the address. Another benefit is that we don't need to care how each engineer has set the global `--repo` option on their personal computer. As long as the specified plugin is installed, everyone can initialize projects using the same project alias.

### Example 2: Implement `hook_repl`

```js
// src/hooks/index.ts
export const hook_repl = {
  semo: () => {
    // Note: Original code had `semo: () {` which is invalid JS/TS. Assuming it meant `semo: () => {` or `semo: function() {`
    return {
      add: async (a, b) => {
        return a + b
      },
      multiple: async (a, b) => {
        return a * b
      },
    }
  },
}
```

Then in the REPL environment, you can use it:

:::tip
Information returned by `hook_repl` is injected into the `Semo.hooks.application` object in the REPL.
:::

```
semo repl
>>> Semo.hooks.application.add
[Function: add]
>>> await Semo.hooks.application.add(1, 2)
3
>>> Semo.hooks.application.multiple
[Function: multiple]
>>> await Semo.hooks.application.multiple(3, 4)
12
```

Plugins and business projects have different starting points when implementing this hook. Business projects generally inject specific business logic, while plugins typically inject common methods with a certain degree of reusability, such as instance methods of underlying services, commonly used libraries, etc.

## Exposing Methods

Another fundamental purpose of implementing plugins is to act as a module, exposing instances, methods, or libraries externally. In this case, on one hand, we can define modules in a standard way, for example:

:::warning
Since `Semo` later introduced the `run` command, and this command relies on the entry file for location, `Semo` plugins are required to declare an entry point, regardless of whether this entry point exposes methods.
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

By extending through commands, hooks, or libraries, we have written a `Semo` plugin. If you want to share your plugin with others, some preparation is needed.

### 1. Upload code to a `git` repository

If it's open source, you can choose `Github`. If it's an internal plugin, upload it to the internal repository, which might be a `Github` private repository or the company's `Gitlab` repository.

### 2. Modify `package.json`

Mainly package name, version, license, repository URL, homepage address, etc.

If it's an internal plugin, you might modify the `registry` address in the `.npmrc` file.

### 3. Obtain an npm repository account and log in

If it's an open source plugin, you can register at `https://npmjs.org`. If it's a privately deployed `npm` repository, you can get an account from the operations team.

```
npm login --registry=[YOUR_REGISTRY]
```

### 4. Test the plugin package

```
npm pack --dry-run
```

Through package testing, check if the package contains unnecessary files and adjust the configuration of the `.npmignore` file.

### 5. Publish your plugin

```
npm version [patch|minor|major]
npm publish
```

### 6. Promote the plugin, share development experience

Even good wine needs promotion. Write good documentation and actively promote it to get others to use it and provide feedback.

### 7. Actively maintain

Any npm package can potentially become outdated or have security risks. We need to actively maintain it to ensure the plugin performs its intended function.

## Plugin Levels

Semo's plugin system scans multiple locations to increase flexibility, with each level corresponding to different purposes and limitations.

- Installed globally via `npm install -g semo-plugin-xxx`. The installed plugin commands are globally available. This is `npm`'s default way of installing global packages.
- Installed to the home directory's `.semo/home-plugin-cache` directory via `semo plugin install semo-plugin-xxx`. The installed plugin commands are also globally available. This method can be used in situations where the current user doesn't have permission to install globally using npm.
- Installed to the current project directory via `npm install semo-plugin-xxx`. Plugin commands installed this way only take effect within the current project.

Why would some plugins need to be installed globally? Because plugins can not only implement our project's business requirements but also our development toolchain, and even some non-business small functions. With imagination, any terminal function is possible. They can be entirely handwritten or encapsulate and integrate other excellent projects, which are not limited by language or language extension package repositories.

## Running Remote Plugins Directly

This is just an illusion; they still need to be downloaded locally, but the download directory is separate, so it won't interfere with your implementation. You can freely test any plugins you are interested in.

```
semo run semo-plugin-serve
```

This plugin's function is to provide a simple HTTP service. It will be downloaded on the first run, and subsequent runs will reuse the previously downloaded plugin. Use `--force` to force an update.

## Special Home Directory Plugin

> This feature introduced in `v0.8.0`

To add global configurations for `Semo`, we need to add a `.semorc.yml` configuration file in the `~/.semo` directory. Once this configuration file is established, the `.semo` directory is automatically recognized as a global plugin (other global plugins are in the `~/.semo/home-plugin-cache` directory). You can define some of your own commands, extend commands of other plugins, extend hooks of other plugins, etc., within this plugin. This special plugin is globally recognizable. Also, because it exists by default, if you have some logic that is commonly used locally and you don't want to publish it as an npm package, you can quickly start here. Of course, be aware that its globally available nature means errors can also affect the local global environment.

We haven't preset the implementation method for this special plugin, meaning you can write it in `js` or `typescript`. You can use the `semo init` command to initialize the basic directory structure, or use `semo create .semo --template=plugin` to regenerate a `.semo` directory using a template (you need to back up the `.semo` directory beforehand and then merge the contents back).

## Recognizing Plugins in Arbitrary Directories

We can see `pluginDir` in the configuration file. If this parameter is manually specified during command execution, it can achieve the purpose of arbitrary specification, and it also supports multiple directories:

```
semo help --plugin-dir=dir1 --plugin-dir=dir2
```

Additionally, it supports specification via constants:

```
SEMO_PLUGIN_DIR=dir3 semo help
```

## Plugin Active Registration Mechanism

> Introduced in `v1.3.0`

Early `Semo` only supported the automatic registration mechanism for plugins. For flexibility, it could traverse multiple locations, incurring some IO performance loss. Therefore, the active registration mechanism was added. Once the active registration mechanism is used, the automatic registration mechanism is automatically disabled.

### How to Enable

Write key-value pairs for plugins under the `$plugins.register` section in `.semorc.yml`.

```yml
$plugins:
  register:
    plugin-a: /absolute/path
    plugin-b: ./relative/path
    plugin-c: ~relative/path/from/home # Or interpreted as module path
    plugin-d: true # Use Node.js module resolution
```

Four styles are supported: absolute paths and relative paths (starting with `./`) are easy to understand. The third (`~`) typically refers to the home directory but might also be interpreted as part of a module path depending on implementation. The fourth (`true`) uses Node.js's module loading mechanism to declare. For the plugin name used as the key, the `semo-plugin-` prefix can be omitted here.
