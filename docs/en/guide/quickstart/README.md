# Get started

## Global Installation

`Semo` is also a developer tool to help development, devops and debug. So you can install it globally.

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

We can see that there are many internal commands, these commands have special usage, Semo provides rules not specific functions, so mostly you need to install plugins.


## Project integration

`Semo` 's main usage is interated with an existed project to provide CLI machanism. You can implement your own CLI implementation, but different projects have different ways to add CLI, This difference brings about an increase in maintenance costs. For enterprise-level development, reducing costs means increasing profits

```
cd YOUR_PROJECT
semo init
```

If you just use basic Semo rules, you do not need `@semo/core`, if you want to use methods of `@semo/core`, then you need add `@semo/core` as dependency. There are several usage modes:

- If you use `@semo/core` in business logic, you need add `@semo/core` to `package.json`'s `dependencies`.
- If you do not use `@semo/core` in business logic, and only use Semo in commands and scripts and these need to use online, then you also need to add `@semo/core` to `package.json`'s `dependencies`.
- If you do not use `@semo/core` in business logic, only use REPL in development stage, then you can add `@semo/core` to `package.json`'s `devDependencies`.
- If Semo CLI not included in docker container, you can add `@semo/cli`, then use `npx semo` to trigger commands.

### Add a project command

You need to plan you project commands levels, it's best not add all command in first level.

**Define a first level command**

```
semo generate command test
semo test
```

**Define a second level command**

```
npm install semo-plugin-application
semo generate command application/test --extend=application
semo application test
```

For seperating project commands, plugin commands and core commands, here we suggest use the second way to add project commands, and if the project is complicated, the project commands can be hierachical. The problem is the more hierachical commands, the more difficult to memorize, so you can add some bash alias to shorten input.


**Suppose the production is deployed in Docker**

```
// Dockerfile
RUN echo 'alias semo="npx semo"' >> /home/node/.bashrc
RUN echo 'alias app="npx semo app"' >> /home/node/.bashrc
```

The above code shows how to shorten commands length, if you have many deep commands, you can define more here.

## Plugin development

If you just want to implement some features not integrating with project, you can juse `Semo` plugin support.

```
cd ~/.semo/node_modules # This directory hold global Semo plugins.
semo create semo-plugin-xxx --template=plugin # Choose template repo.
cd semo-plugin-xxx
semo hi # There is a default commands in the template repo.
code . # Develop using vscode.
yarn watch # Based on `Typescript`, watch files change.
```


```
git remove add origin GIT_REPO_URL
git add .
git commit -m 'init'
npm login
npm version patch && npm publish
```

:::warning
`Semo` does not guarantee the isolation of plugin commands. If you install many plugins, you may meet commands conflicts. But it's just rare case. For simplicity `Semo` does not design absolute command isolation.
:::

## Install third plugins

```
npm i -g @semo/cli semo-plugin-xxx
```

If the plugins commands only useful to yourself, you can install it globally, if the plugin commands needed in business project, you need to install plugins in `dependencies`.

```
cd YOUR_PROJECT
npm install semo-plugin-xxx
yarn add semo-plugin-xxx // 或
```

Semo plugins are also normal `Node` module, so we can also export lib functions, imported by other projects.

```js
import lib from 'semo-plugin-xxx'
```

Use `Semo` hooks, we can use another style to use plugin features.

```js
import { Utils } from '@semo/core'

const { xxx } = await Utils.invokeHook('semo:component')
```

In this way, we do not need to import packages explicitly. This way use directory scan, so performance is an issue and no IDE support, but in command scenario, this style is OK to use. 


