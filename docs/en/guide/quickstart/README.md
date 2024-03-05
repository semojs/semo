# Quick Start

## Global Installation

`Semo` command-line tool is also a tool for engineers' daily development, operation, and debugging. It is recommended to install it globally in the local environment. For specific usage instructions, you can refer to [here](https://semo.js.org).

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

You can see that there are many built-in commands inside. However, it is important to note that these commands are scenario-specific. Without any plugins or specific business projects, they may not be very helpful. In the development process, the core of `Semo` mainly focuses on defining extension specifications, and specific business logic needs to be implemented by developers. The true value and functionality of `Semo` can only be realized when integrated with specific business logic.

## Project Integration

The main use case of `Semo` is to add a command-line mechanism to an existing business project. Without `Semo`, individual business projects can certainly develop their own command lines. However, this usually leads to redundant efforts, and the solutions implemented by different teams are bound to differ. This difference increases maintenance costs, and in enterprise-level development, reducing costs leads to increased profits.

```
cd YOUR_PROJECT
semo init
```

If only the plugin dispatching method of Semo is used, it is not necessary to install `@semo/core`. If you want to use the methods in `@semo/core`, the business project needs to add `@semo/core` as a project dependency. Whether it should be added to `devDependencies` or `dependencies` depends on the actual situation. There are several usage patterns for business projects using `@semo/core`:

- The core logic of the business project relies on `@semo/core`, which is invasive and must be added to `dependencies`.
- The core logic of the business project does not rely on `@semo/core`, but `@semo/core` is used to define command lines or scripts, and the scripts need to be executed online: this is non-invasive, but since it needs to be executed online, it also needs to be added to `dependencies`.
- The core logic of the business project does not rely on `@semo/core`, nor is `@semo/core` used to define command lines or scripts. It only uses the REPL extension mechanism to put common classes and functions of the project into the `REPL` environment to assist in development and debugging. This is also non-invasive and does not need to be executed online, so it can be added to `devDependencies`.
- If `Semo` is not installed in the container environment itself, `@semo/cli` can also be added to the project dependencies, and then scheduled through `npx semo`.

### Adding a Project Command

When defining project commands, it's important to consider the future planning of project command-line tools. If there are many commands, it's best to divide them into hierarchies. Additionally, the first layer of sub-commands should be core commands. If all commands are placed in the first layer, it may be easy to confuse and misuse them.

**Defining a First-level Sub-command**

```bash
semo generate command test
semo test # Execute the newly added command
```

**Defining a Second-level Sub-command**

```bash
npm install semo-plugin-application
semo generate command application/test --extend=application
semo application test
```

To isolate project commands from those defined by core and plugins, it is recommended to add project commands using the second method above. Furthermore, for complex projects, it is recommended to further divide them into hierarchies. However, this approach increases the burden of memorization for command hierarchy and requires entering many preceding commands to find the command to execute. Therefore, it is generally necessary to add several `alias` to the `bashrc` of the runtime environment:

**Assuming the production environment is deployed using Docker containers**

```bash
// Dockerfile
RUN echo 'alias semo="npx semo"' >> /home/node/.bashrc
RUN echo 'alias app="npx semo app"' >> /home/node/.bashrc
```

This command demonstrates a method to shorten the length of commands. In actual use, if the command hierarchy is particularly deep, more `alias` can be defined here.

## Developing Plugins

If you're not using `Semo` in a project but just want to quickly implement some script commands to improve your work efficiency, you can start quickly with `Semo`.

```bash
cd ~/.semo/node_modules # Plugins defined under this directory will be globally loaded
semo create semo-plugin-xxx --template=plugin # Choose the plugin template
cd semo-plugin-xxx
semo hi # There is a sample command by default
code . # Start development with Vscode
yarn watch # Develop based on `Typescript` and require real-time compilation
```

If you are satisfied with your plugin and want to share it with others, you can directly publish your code to `npm`.

```bash
git remote add origin GIT_REPO_URL
git add .
git commit -m 'init'
npm login
npm version patch && npm publish
```

:::warning
Note that `Semo` does not guarantee the isolation of commands defined by each plugin. Therefore, if too many plugins are installed, there may be some command conflicts due to name duplication. However, this situation rarely occurs in daily use, and for simplicity, no special design has been made here.
:::

## Installing Plugins Developed by Others

```bash
npm i -g @semo/cli semo-plugin-xxx
```

If someone else's plugin only defines some commands you need, you can install the commands globally. If someone else's plugin needs to be used in a business project, it needs to be placed in the project dependencies.

```bash
cd YOUR_PROJECT
npm install semo-plugin-xxx
yarn add semo-plugin-xxx // Or
```

Since `Semo`'s plugins are also `Node` modules, we can also define some library functions in plugins and import them into projects by others.

```javascript
import lib from 'semo-plugin-xxx'
```

By using the hook mechanism provided by `Semo`, another style of using business logic support provided by plugins can be achieved.

```javascript
import { Utils } from '@semo/core'

const { xxx } = await Utils.invokeHook('semo:component')
```

As seen in the latter approach, there is no need to explicitly import packages. This method uses directory scanning, which has poor performance and lacks support for IDE auto-completion. However, for the command line scenario, having a simple and unified code style is also good.