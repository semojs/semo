# Plugin Development

## Quick Start

A `Semo` plugin is essentially a standard `Node` module, albeit with some conventions regarding directory and file structure. These conventions can be challenging to remember, so we provide various auxiliary tools for plugin developers or tool users, such as code generation. Here, we describe the recommended plugin development process. However, once you're familiar with the development process, you can also manually build a plugin from an empty directory.

### Step 1: Create Plugin Directory Based on Template

```bash
semo create semo-plugin-xyz --template=plugin
```

Here, we use the built-in plugin template. As mentioned earlier in configuration management, you can override the `repo` and `branch` options or the `--template` option to avoid passing default parameters each time.

### Step 2: Enter Plugin Directory and Execute Default Command to Confirm Everything is Fine

```bash
cd semo-plugin-xyz
semo hi
```

This is a command built into the plugin template. After initialization, you can execute it by entering the directory, confirming the initial interaction with the plugin command. If you see it respond with `Hey you!`, everything is ready, and you can proceed to write scripts that will truly change the world.

## Adding Commands

It's worth noting that this plugin template is based on `Typescript`, so you need some `Typescript` basics. We recommend keeping the `yarn watch` command running during development to compile in real-time while developing and testing simultaneously.

```bash
semo generate command xyz
```

Typically, there's a correlation between the plugin name and the commands it encapsulates. Here, we add an `xyz` command, but you can also modify the existing `hi` command. Once you've mastered plugin development, it's advisable to remove the default `hi` command.

## Implementing Hooks

Implementing hooks is another purpose of plugin development. Hooks are often defined by other plugins or business projects, and implementing hooks can influence and change the behavior of other plugins.

Use the following command to query which hooks are supported in the current environment:

```bash
semo hook list
```

### Example 1: Implementing `hook_create_project_template`

```typescript
// src/hooks/index.ts
export const semo__hook_create_project_template = {
  demo_repo: {
    repo: 'demo_repo.git',
    branch: 'master',
    alias: ['demo']
  },
}
```

With this hook, we can select a custom project template when executing the `semo create [PROJECT] --template` command, just by remembering the alias, without needing to remember the address. Another advantage is that you don't need to manage how each engineer sets the global `--repo` option on their personal computer. As long as the specified plugin is installed, everyone can initialize projects with the same project alias.

### Example 2: Implementing `hook_repl`

```typescript
// src/hooks/index.ts
export const semo__hook_repl = () => {
  return {
    add: async (a, b) => {
      return a + b
    },
    multiple: async (a, b) => {
      return a * b
    }
  }
}
```

Then, in the REPL environment, you can use these:

:::tip
Information returned by `hook_repl` is injected into the Semo object in the REPL.
:::

```bash
semo repl
>>> add
[Function: add]
>>> await Semo.add(1, 2)
3
>>> multiple
[Function: multiple]
>>> await Semo.multiple(3, 4)
12
```

The motivations behind implementing this hook differ between plugins and business projects. Business projects generally inject specific business logic, while plugins typically inject common methods with some degree of reusability, such as injecting instance methods of underlying services, commonly used libraries, etc. For example, the `Utils` core injection contains the `lodash` library.

## Exposing Methods

Another primary purpose of implementing plugins is to expose instances, methods, or libraries externally. In this case, we can define modules in a standard way, for example:

:::warning
Since `Semo` later introduced the `run` command, which depends on the entry file for locating, it requires plugins of `Semo` to declare an entry, regardless of whether this entry exposes methods.
:::

```json
// package.json
{
  "main": "lib/index.js"
}
```

```typescript
// index.js
export const func = () => {}
```

This approach is fine, but typically, modules defined in this way don't need to adhere to `Semo`'s conventions. As long as they comply with `node` and `npm` standards, they are acceptable. Here, `Semo` defines another way to expose methods based on the hook mechanism.

```typescript
// src/hooks/index.ts
export const semo__hook_component = async () {
  return {
    a: 'b'
  }
}
```

Usage:

```typescript
import { Utils } from '@semo/core'
const { a } = await Utils.invokeHook('semo:component')
console.log(a)
// -> 'b'
```

With this approach, we can encapsulate some common methods of business projects for cross-project use. These common methods typically lean towards the lower level, such as various middlewares or underlying services.

## Publishing Plugins

After using commands, hooks, or

 library extensions, we've developed a `Semo` plugin. If you want to share your plugin with others, you need to do some preparation work.

### 1. Upload Code to a Git Repository

If it's open-source, you can choose `Github`. If it's an internal plugin, upload it to an internal repository, which could be a private `Github` repository or a company `Gitlab` repository.

### 2. Modify `package.json`

Mainly modify the package name, version, license, repository address, homepage address, etc.

If it's an internal plugin, you can modify the `registry` address in the `.npmrc` file.

### 3. Obtain an Account for the npm Registry and Log In

For open-source plugins, you can register at `https://npmjs.org`. For privately deployed npm repositories, you can get an account from your operations team.

```bash
npm login --registry=[YOUR_REGISTRY]
```

### 4. Test the Plugin Package

```bash
npm pack --dry-run
```

Through packaging testing, check whether the package contains any unnecessary files, and adjust the configuration of the `.npmignore` file accordingly.

### 5. Publish Your Plugin

```bash
npm version [patch|minor|major]
npm publish
```

### 6. Promote Your Plugin and Share Development Insights

Good documentation is crucial, as well as actively promoting and encouraging others to use and provide feedback on your plugin.

### 7. Actively Maintain

Any npm package can gradually become outdated or have security risks, so it's essential to actively maintain your plugin to ensure it functions as intended.

## Plugin Hierarchy

The `Semo` plugin system scans multiple locations to increase flexibility, with each level serving different purposes and restrictions.

* Installed globally via `npm install -g semo-plugin-xxx`, so commands from installed plugins are globally available. This is the default global installation method for npm packages.
* Installed in the home directory's `.semo/home-plugin-cache` directory via `semo plugin install semo-plugin-xxx`, and the plugin commands are also globally available. In certain cases where the current user lacks permission to install globally via npm, this method can be used.
* Installed in the current project directory via `npm install semo-plugin-xxx`. Plugin commands installed this way are only effective within the current project.

Why would some plugins need to be installed globally? Because plugins can not only fulfill our project's business requirements but also serve as part of our development toolchain or even implement some non-business functionalities. With some imagination, any terminal functionality can be implemented, either completely handwritten or encapsulated and integrated with other excellent projects. Here, excellent projects are not limited to specific languages or language extension package repositories.

## Running Remote Plugins Directly

This is just an illusion; it still needs to be downloaded locally, but the download directory is different, avoiding interference with your implementation. You can freely test plugins you're interested in.

```bash
semo run semo-plugin-serve
```

This plugin provides a simple HTTP service. The first time you run it, it will download, and subsequently, it will reuse the previously downloaded plugin. Use `--force` to force an update.

:::tip
Subsequent development will include a feature to clean plugin caches.
:::

## Special Home Directory Plugins

> This feature was introduced in `v0.8.0`

To add global configurations to `Semo`, you need to add a `.semorc.yml` configuration file in the `~/.semo` directory. Once this configuration file is established, the `.semo` directory is automatically recognized as a global plugin (other global plugins are in the `.semo/home-plugin-cache` directory). Here, you can define your own commands, extend other plugins' commands, or extend other plugins' hooks, etc. This special plugin is globally recognizable. Also, because it's present by default, if you have some locally common logic and don't want to publish it as an npm package, you can quickly start here. However, be aware of its global availability, as errors here can affect the local global state.

We don't prescribe a specific implementation approach for this special plugin. You can use `js` or `typescript` to write it. You can initialize the basic directory structure using `semo init`, or regenerate a `.semo` directory with the template using `semo create .semo --template=pluging` (backup the `.semo` directory in advance, then merge the contents back).

## Recognizing Plugins in Any Directory

We can see the `pluginDir` configuration in the configuration file. If you manually specify this parameter on the command line, you can achieve any specific directory purpose, and it also supports multiple directories:

```bash
semo help --plugin-dir=dir1 --plugin-dir=dir2
```

Additionally, it supports specifying via constants:

```bash
SEMO_PLUGIN_DIR=dir3 semo help
```

## Issue with Internal Plugins Defined in Applications in Typescript Mode

This is because `tsc` can only recognize `ts` and `js` related files during compilation and cannot recognize our `yml` format. Moreover, the official doesn't intend to support copying files other than `ts`. As `ts` is not a complete build tool, we need to manually copy the required files. This can be achieved using `cpy-cli` or `copyfiles`. Taking `copyfiles` as an example:

```json
// package.json
{
  "scripts": {
    "copyfiles": "copyfiles -u 1 -a src/**/*.yml dist -E"
  }
}
```

## Plugin's Active Registration Mechanism

> Introduced in `v1.3.0`

In the early days, `Semo` only supported the automatic registration mechanism for plugins. To increase flexibility, it could traverse multiple locations, albeit with some IO performance loss. Therefore, the active registration mechanism was introduced. Once the active registration mechanism is used, the automatic registration mechanism becomes ineffective.

### Activation Method

Write plugin key-value pairs in the `$plugins` section of `.semorc.yml`

```yml
$plugins:
  register:
    plugin-a: /absolute/path
    plugin-b: ./relative/path
    plugin-c: true
```

Three styles are supported: absolute paths, relative paths, and using Node.js module loading mechanisms for declaration. Here, the `semo-plugin-` prefix can be omitted for plugin names used as keys. Additionally, the shorthand `~` for the home directory is supported.