# Quick Start

## Global Installation

The `Semo` command-line tool is also a utility that assists engineers with daily development, operations, and debugging. Global installation in your local environment is recommended. For detailed usage instructions, please refer to [here](https://semo.js.org).

```
$ npm i -g @semo/cli
$ semo help
semo

Execute a Semo style command file

Commands:
  semo                                Execute a Semo style command file                                        [default]
  semo cleanup [type]                 Cleanup internal caches.                                          [aliases: clean]
  semo completion                     Generate completion script
  semo config <op>                    Manage rc config                                                    [aliases: cfg]
  semo create <name> [repo] [branch]  Create a new project from specific repo                               [aliases: c]
  semo generate <component>           Generate component sample code                                        [aliases: g]
  semo init                           Init basic config file and directories                                [aliases: i]
  semo repl                           Play with REPL                                                        [aliases: r]
  semo run [plugin]                   Run any plugin command directly
  semo status                         Show environment status info                                         [aliases: st]
  semo version                        Show version number

Options:
  -h, --help     Show help                                                                                     [boolean]
  -v, --version  Show version number                                                                           [boolean]

Examples:
  semo run hello-world                                        Run a remote plugin command.
  semo run --with project-templates — create PROJECT_NAME -T  Clone project template as a starter.
  semo repl --require lodash:_                                Start Semo repl and inject lodash object to _.
  semo generate command test                                  Generate command template.
  semo clean all                                              Clean all cache files and installed npm packages.

Find more information at https://semo.js.org
```

As you can see, there are many built-in commands. However, it's important to note that these commands are intended for specific use cases. They won't be very helpful without being combined with plugins or specific business projects. This is because the Semo core development primarily focuses on defining extension specifications. The actual business logic needs to be implemented by you. The role and value of Semo become more apparent only when integrated with specific business logic.

## Project Integration

Semo's primary use case is adding a command-line mechanism to an existing business project. Without Semo, individual business projects can certainly develop their own command-line tools, but this often involves duplicated effort. Furthermore, solutions implemented by different teams will inevitably vary, leading to increased maintenance costs. In enterprise development, reducing costs directly improves profits.

```
cd YOUR_PROJECT
semo init
```

If you only use Semo's plugin dispatch mechanism, installing `@semo/core` is not necessary. If you want to use methods from `@semo/core`, the business project must add `@semo/core` as a project dependency. Whether to place it in `devDependencies` or `dependencies` depends on the actual situation. There are several usage patterns when using `@semo/core` in a business project:

- The core logic of the business project service depends on `@semo/core`. This is invasive and must be added to `dependencies`.
- The core logic of the business project service does not depend on `@semo/core`, but `@semo/core` is used to define command lines or scripts, and these scripts need to run in production: This is non-invasive, but since it needs to run in production, it also needs to be added to `dependencies`.
- The core logic of the business project service does not depend on `@semo/core`, nor is `@semo/core` used to define command lines or scripts. It only uses the REPL extension mechanism to place the project's common classes and functions into the `REPL` environment to assist development and debugging. This is also non-invasive and does not need to run in production, so it can be placed in `devDependencies`.
- If the container environment itself does not have `Semo` installed, you can also add `@semo/cli` to the project dependencies and then use `npx semo` to dispatch commands.

### Adding a Project Command

Here, consider the future planning of the project's command-line tools. If there will be many, it's best to establish a hierarchy. Also, the first-level subcommands include core commands. Placing all our commands at the first level can easily lead to confusion and misuse.

**Define a first-level subcommand**

```
semo generate command test
semo test # Execute the command just added
```

**Define a second-level subcommand**

```
npm install semo-plugin-application
semo generate command application/test --extend=application
semo application test
```

To isolate project commands from those defined by the core and plugins, it is recommended to add project commands using the second method above. For complex projects, further hierarchy can be applied. Of course, this creates a problem: the increased memory burden due to the deeper command hierarchy, and having to type many preceding commands to find the one to execute. Therefore, generally, we also need to add a few `alias` entries to the runtime environment's `bashrc` in the project:

**Assuming the production environment is deployed using Docker containers**

```
// Dockerfile
RUN echo 'alias semo="npx semo"' >> /home/node/.bashrc
RUN echo 'alias app="npx semo app"' >> /home/node/.bashrc
```

The commands above demonstrate how to shorten command length. In actual use, if the command hierarchy is particularly deep, you can define more `alias` here.

## Developing Plugins

If you are not using `Semo` within a project, but simply want to quickly implement some script commands to help improve your work efficiency, you can use `Semo` to get started quickly.

```
cd ~/.semo/node_modules # Plugins defined in this directory will be loaded globally
semo create semo-plugin-xxx --template=plugin # Choose the plugin template
cd semo-plugin-xxx
semo hi # # There is a default example command inside
code . # Start developing with Vscode
pnpm watch # Based on `Typescript` development, requires real-time compilation
```

If you are satisfied with your plugin and want to share it with others, you can directly publish your code to `npm`.

```
git remote add origin GIT_REPO_URL
git add .
git commit -m 'init'
npm login
npm version patch && npm publish
```

:::warning
Note: `Semo` does not guarantee isolation between command definitions from different plugins. Therefore, if many plugins are installed, some commands might overwrite others due to naming conflicts. However, this rarely happens in everyday use. For simplicity, no special design has been implemented to prevent this.
:::

## Installing Plugins Developed by Others

```
npm i -g @semo/cli semo-plugin-xxx
```

If someone else's plugin only defines commands you need, you can install the commands globally. If someone else's plugin is needed in your business project, it should be placed in the project dependencies.

```
cd YOUR_PROJECT
npm install semo-plugin-xxx
pnpm add semo-plugin-xxx // or
```

Since a `Semo` plugin is also an `NPM` module, we can also define library functions within the plugin to be imported by others in their projects:

```js
import lib from 'semo-plugin-xxx'
```

Using the hook mechanism provided by `Semo`, you can also use another style to leverage the business logic support provided by plugins.

```js
const { xxx } = await argv.$core.invokeHook('app:component')
```

As you can see, in the latter method, there's no need to explicitly import the package; simply installing it is enough. This method uses directory scanning, which has relatively poor performance and lacks IDE autocompletion support. However, for the command-line scenario, the simple and unified code style can also be beneficial.

This method is only supported in scenarios where `argv` is accessible.
