# Core Commands

## `semo`

Please note that `Semo` provides a default mechanism to run any file that conforms to the `Semo` command line file syntax.

```
semo command.js
```

Typically, the commands we define don't include file extensions like `.js`, so the file is executed directly as a command. If you need to execute a `.ts` command file style, you'll need the `ts` environment, please refer to the FAQ section.

The significance of this mechanism is that you can use `Semo` to define and execute script files, which blurs the distinction between commands and scripts. They are interchangeable. Scripts come first, and if you find them frequently used, give them a good name and then encapsulate them into a plugin. In the early days, there was also a `semo-plugin-script` plugin that aimed to do this. Now with this default mechanism, support for script files can be built into `Semo`. However, the `semo-plugin-script` plugin still has a script template code generator feature, which the `Semo` core does not intend to provide. Because this is more inclined to be understood as a simplified way to develop command-line tools quickly.

## `semo application`

> alias: `app`

:::tip
This command has been moved to the `semo-plugin-application` plugin.
:::

By default, this command has no functionality. Its purpose is to establish a convention with business projects, suggesting that commands added to the business project should be written as subcommands of this command. The reason why a business project can add subcommands to this command is that it utilizes the command extension mechanism of `Semo`.

```bash
npm install semo-plugin-application
semo generate command application/test --extend=application
```

This way, you can add a test command to the project, and this command needs to be called using `semo application test`.

By running `semo application help`, you can see all top-level subcommands defined by the current business project. Since it's difficult to remember all commands and parameters, especially when a project implements many commands and has multiple levels, the help command is something we often need to execute.

## `semo cleanup`

> alias: clean

This command is used to clean up some files generated internally by Semo, including the history of the repl command, shell command history, temporarily downloaded packages in repl, temporarily downloaded packages in the run command, and the global plugin directory.

Currently, only limited extensions are provided, allowing only the application directory to define cleanup directories. Support for plugins to add cleanup directories is not provided, mainly for security reasons.

## `semo config`

We can use this core built-in command to view and modify configuration files, operate on the configuration files of the current project, or operate on the global configuration file.

```
semo config <op>

Manage rc config

命令：
  semo config delete <configKey>                                Delete configs by key                     [aliases: del]
  semo config get <configKey>                                   Get configs by key
  semo config list                                              List configs                   [默认值] [aliases: ls, l]
  semo config set <configKey> <configValue> [configComment]     Set config by key
  [configType]

Options:
  --global, -g  For reading/writing configs from/to global yml rc file, default is false
  --watch       Watch config change, maybe only work on Mac
```

Note that the `<configKey>` here is in the format of `a.b.c`, representing multi-level configuration. In addition, it supports adding comments to the configuration set at the last level.

## `semo hook`

:::tip
This command has been moved to the `semo-plugin-hook` plugin.
:::

The output of this command displays all available hooks in the current environment. All logic implementing these hooks can be executed. In the output, you can see the name, description, and module declaration of the hooks:

```
Hook                         :  Package :  Description
  hook_beforeCommand           :  semo    :  Hook triggered before command execution.
  hook_afterCommand            :  semo    :  Hook triggered after command execution.
  hook_component               :  semo    :  Hook triggered when needing to fetch component
  hook_hook                    :  semo    :  Hook triggered in hook command.
  hook_repl                    :  semo    :  Hook triggered in repl command.
  hook_status                  :  semo    :  Hook triggered in status command.
  hook_create_project_template :  semo    :  Hook triggered in create command.
```

Here you can see that there is a special hook called `hook_hook`. Implementing this hook allows you to declare hooks, and any plugin can declare its own hooks for other commands to call, thereby affecting its own behavior. Generally, business projects do not need to declare their own hooks, unless the business project deeply uses this mechanism to constitute its own business plugin system.

It is also important to note that even if not declared, hooks can still be used as long as they are implemented. Declaring hooks here is just for transparency. Details on how to declare and implement hooks will be explained in the hooks-related section.

::: warning
In the future, it may be possible to change the logic so that hooks that are not declared cannot be used.
:::

## `semo init`

> alias: `i`

This command is used for initialization and can implement two scenarios: initialization of a business project or initialization of a plugin. The difference between these two scenarios lies in the directory structure.

In a business project, we default to placing the directory structure of `Semo` in the `bin` directory:

```
├── .semorc.yml
├── bin
│   └── semo
│       ├── commands
│       ├── extends
│       ├── hooks
│       ├── plugins
│       └── scripts
└── package.json

```

In a plugin project, we put all the code in the `src` directory:

```
├── .semorc.yml
├── src
│    ├── commands
│    ├── extends
│    ├── hooks
└── package.json
```

The existence of this command is only to save a few seconds for engineers. In other words, if you don't use this command, manually creating these directories and files is also OK.

:::tip
The structure and usage of `.semorc.yml` will be explained in the configuration management section.
:::

In addition, if we really want to create a plugin, it is too slow to do it through initialization. Here, it is recommended to use the plugin project template. The specific command is as follows:

```
semo create semo-plugin-xxx --template=plugin
```

Clearly, other project templates can also be used here. Regarding the `create` command, see below for an introduction to the `create` command.

## `semo create <name> [repo] [branch]`

> alias: `n`

This command, unlike `generate` and `init`, is used to initialize a new project directory. This project can be a business project or a plugin. This command has many parameters and some conventions:

```
$ semo create help

semo create <name> [repo] [branch]

Create a create project from specific repo

Options:
  --version      Show version number                                                                           [boolean]
  --yarn         use yarn command                                                                        [default: false]
  --yes, -y      run npm/yarn init with --yes                                                             [default: true]
  --force, -F    force download, existed folder will be deleted!
  --merge, -M    merge config with exist project folder!
  --empty, -E    force empty project, ignore repo
  --template, -T   select from default repos
  --add, -A      add npm package to package.json dependencies                                            [default: false]
  --add-dev, -D  add npm package to package.json devDependencies                                         [default: false]
  --init-semo, -i     init new project
  -h, --help     Show help                                                                                     [boolean]
```

Single explanations have been provided above, below we'll explain with specific usage scenarios.

### Initialize from Any Repository

```
semo create PROJECT_NAME PROJECT_REPO_URL master -f
```

Here we can see that with the create command, we can download code from any git repository address, and any code repository can be our project template. Where `master` is the branch name, which defaults to `master` so it can be omitted, `-f` means if the directory already exists, it will first delete the original one and then recreate it.

In addition to downloading the code, the create command also removes the original `.git` directory and reinitializes an empty `.git` directory, then automatically downloads all project dependencies.

### Creating an Empty Project, Not Based on Any Project Template

```bash
semo create PROJECT_NAME -yfie
```

Here we can see a feature of `yargs`, where short parameters can be chained together. Here, it's equivalent to `-y -f -i -e`, which means `-y` automatically answers `yes` when creating the `package.json`, `-f` forces the deletion of an existing directory, `-i` automatically executes `semo init` to initialize the project directory, and `-e` indicates that it's an empty project declaration, not based on any code repository or built-in template.

The directory structure of the project is as follows:

```
├── .semorc.yml
├── bin
│   └── semo
│       ├── commands
│       ├── extends
│       ├── hooks
│       ├── plugins
│       └── scripts
└── package.json
```

### Creating a `Semo` Plugin Directory

If not based on a plugin template, we can manually create a basic plugin structure:

```bash
semo create semo-plugin-[PLUGIN_NAME] -yfie
```

Similar to the previous command, except for the project name. Here, there's a naming convention for the project name. If the project name starts with `semo-plugin-`, it's considered as initializing a `Semo` plugin, and `semo init --plugin` will be executed during initialization.

The directory structure of the project is as follows:

```
├── .semorc.yml
├── package.json
└── src
    ├── commands
    ├── extends
    └── hooks
```

### Creating a Project Based on Built-in Templates

If we create a project using the following command:

```bash
semo create PROJECT_NAME --template
```

We'll see the following output:

```
? Please choose a pre-defined repo to continue: (Use arrow keys)
❯ semo_plugin_starter [semo-plugin-starter, plugin]
❯ ...
```

Here, we can choose from available built-in templates, eliminating the need to manually input repository addresses. Currently, there's only one plugin template by default, but additional templates can be injected using the `hook_create_project_template`:

Example hook implementation for injecting templates:

```js
export const hook_create_project_template = {
  demo_repo: {
    repo: 'demo_repo.git',
    branch: 'master',
    alias: ['demo']
  },
}
```

If we already know which template and identifier to use during initialization, we can specify it directly:

```bash
semo create PROJECT_NAME --template=demo
semo create PROJECT_NAME --template=demo_repo
```

### Tip
When creating a business project or a plugin, it's not recommended to start from an empty project because many engineering and technology selection issues need to be considered. It's recommended to summarize commonly used scaffolding projects within the company and then initialize them using a unified method. For example, after initializing the built-in plugin template, you can directly write logic and then upload the code to `Github` and execute `npm version patch && npm publish` to publish it to the npm repository. Instructions on how to develop a plugin and publish it to the `npm` repository will be provided separately. Additionally, note that the scaffolding project here can be implemented in any language.

The remaining options are also straightforward. `--yarn` declares the use of `yarn` to initialize and install dependencies, `--add` and `--add-dev` are used to specify new dependencies during initialization. `--merge` means not to delete the original project, but to enter the project directory and then apply `--init`, `--add`, `--add-dev`.

## `semo generate <component>`

> alias: `generate`, `g`

This command is used for generating component code. Here, the term "component" refers to abstracted and categorized development targets. For example, the `Semo` core defines three concepts: plugins, commands, and scripts. Therefore, there are corresponding code generation subcommands for these three concepts. Similarly, `Semo` plugins or integrated projects can create their own abstract concepts and provide corresponding code generators. For instance, backend business projects may have concepts like routes, controllers, models, database migration files, unit tests, etc. These concepts may not be universal across projects but maintaining consistent style within a project is recommended. Generating boilerplate code automatically helps maintain consistency.

```bash
$ semo generate help

semo generate <component>

Generate component sample code

Commands:
  semo generate command <name> [description]    Generate a command template
  semo generate plugin <name>                   Generate a plugin structure
  semo generate script <name>                   Generate a script file

Options:
  --version   Show version number               [boolean]
  -h, --help  Show help                         [boolean]
```

### Extending the `generate` Command to Add Subcommands

Similar to extending the `application` command:

```bash
semo generate command generate/test --extend=semo
```

The implementation details of these code generation commands are not constrained here because firstly, the built-in template string mechanism in ES6 can solve most problems. Secondly, `Semo` also incorporates `lodash`, and its `_.template` method is quite flexible. Finally, once the template code is assembled, it can be placed wherever desired.

Since this part is based on `Semo`, related configurations are suggested to be placed in the `.semorc.yml` file. For example, the default configuration generated by `create` command includes:

```yml
commandDir: src/commands
extendDir: src/extends
hookDir: src/hooks
```

As seen, the `create` command generates default configurations by merely specifying some directories for code auto-generation. It also provides a consistent style for defining other directories if maintaining configuration consistency is desired.

## `semo plugin`

> alias: p

:::tip
This command has been moved to the `semo-plugin-plugin` plugin.
:::

This command is used for managing globally installed plugins in the home directory or for optimizing the execution efficiency of the current project's `semo`.

```bash
$ semo plugin help
semo plugin

Plugin management tool

Commands:
  semo p install <plugin>    Install plugin         [aliases: i]
  semo p list                List all plugins       [aliases: l, ls]
  semo p uninstall <plugin>  Uninstall plugin       [aliases: un]
```

## `semo repl [replFile]`

> alias: `r`

REPL (read-eval-print-loop): an interactive evaluator, a tool available in most modern programming languages. It allows writing simple code snippets for quick understanding and learning of language features. When REPL is combined with frameworks or business projects, it can have greater utility.

### Some Extensions to the `REPL`

When developing Semo and this scaffolding, Node's REPL didn't support `await`. Here, it's simulated to enable triggering execution of promises or generator methods from the project. With this capability, combined with injecting some business logic into `REPL`, we gain an additional execution mode beyond controllers, scripts, and unit tests, and it's interactive.

### Injecting New Objects into `REPL`

Here, the internal `hook_repl` hook needs to be implemented, and configured in the business project's hook directory: `hookDir`. The following code is for reference only:

```js
// src/hooks/index.ts
export const hook_repl = () => {
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

Then, in the REPL environment, it can be used:

:::tip
The information returned by `hook_repl` is injected into the `Semo` object in the REPL.
:::

```
>>> add
[Function: add]
>>> await Semo.add(1, 2)
3
>>> multiple
[Function: multiple]
>>> await Semo.multiple(3, 4)
12
```

In actual business projects, common methods, utility functions, etc., from the project are injected, which is helpful for development and later troubleshooting. By default, `Semo` injects its own `Utils` utility object, containing some custom utility functions of `Semo`, as well as exposing dependencies imported by `Semo`, such as `lodash`.

:::tip
In practical applications, we inject various company infrastructure such as databases, caches, OSS, Consul, ElasticSearch, etc., into the REPL, write them as plugins, and make it easier for us to directly access the infrastructure.
:::

### Reloading Hook Files

`.reload` or `Semo.reload()` can re-execute the `hook_repl` hook and inject the latest results into Semo. This is useful when we want to call the latest hook results without exiting the REPL environment. It only guarantees the reloading and execution of hook files themselves. If `require` is used inside the hooks, it will still be cached, which users need to handle themselves, such as attempting to delete `require.cache` before each `require`.

### Temporarily Trying npm Packages

In the REPL, support is provided to temporarily download and debug packages using `Semo.import`, without these downloaded debugging packages entering the current project's `node_modules` directory. (There's also an equivalent method: `Semo.require`)

```
>>> let _ = Semo.import('lodash')
>>> _.VERSION
```

#### Using Internal Commands

> Added in v1.5.14
`.require` and `.import` are equivalent and can be used to quickly import some commonly used packages for debugging. For example:

```
>>> .import lodash:_ dayjs:day
```

The part after the colon is the alias, meaning how the imported module will be stored as a variable.

### Releasing Object Properties to the REPL Environment

```
>>> Semo.extract(Semo)
```

The potential risk of this operation is that it may overwrite built-in objects in the REPL environment. However, the purpose of this API is to release specific objects, such as releasing all table models from an ORM.

This operation also supports configuration. For example, to inject the `Utils` from the Semo object, it can be configured in the configuration file:

```
$plugin:
  semo:
    extract: Semo
```

This method injects all properties under Semo. If only `Utils` needs to be injected, it can be configured as follows:

```
$plugin:
  semo:
    extract:
      Semo: [Utils]
```

### Introduction to the Semo Object

Initially, it was intended that the core and plugins could be freely injected into the REPL environment. However, due to concerns about control, it was decided that both the core and plugins can only be injected into the `Semo` object. Below is a brief overview of the structure of the Semo object:

- `Semo.hooks`: To isolate information injected by various plugins, all injected information from plugins is stored here, ensuring that plugins do not interfere with each other.
- `Semo.argv`: Represents the `yargs` argv parameters entered into the command. Sometimes useful for checking if configuration merging is effective or for experimenting with yargs parameter parsing.
- `Semo.repl`: The current object instance of the REPL environment.
- `Semo.Utils`: Core utility package, containing several custom functions and exposing some commonly used third-party packages such as `lodash`, `chalk`, etc.
- `Semo.reload`: Re-executes the `hook_repl` hook with the latest hook files.
- `Semo.import`: Used for temporary experiments with npm packages. Can be cleaned up using `semo cleanup`.
- `Semo.extract`: Releases key-value pairs of internal objects into the current scope, serving as a compensation for injecting all hooks into the `Semo` object.

### Methods Automatically Injected into the Global Scope

If you find that the default object hierarchy is too deep, you can inject it into the global scope of REPL by configuration or parameters. The method is `--extract`.

```
semo repl --extract Semo.hooks
```

Configuration method: Modify `.semorc.yml`

```
$plugin:
  semo:
    extract: Semo.hooks
```

or

```
CommandDefault:
  repl:
    extract: Semo.hooks
```

### Support for Executing a REPL File

The purpose is also to execute logic and inject some results into the REPL. The file is also a Node module and needs to adhere to a specified format.

```js
exports.handler = async (argv, context) => {}

// Or

module.exports = async (argv, context) => {}
```

It's worth noting that only through `context` can injections be made into the REPL. If your code is not within a function, it can still be executed, but it cannot access the content injected into `context` by previous logic, nor can it obtain the `argv` object. Additionally, it must be injected into the REPL through the `global` object.

What is the purpose of this mechanism? The main purpose is to simplify debugging during development. Some debugging tasks in the REPL may involve many preconditions. Typing them line by line in the REPL can be cumbersome. This approach allows us to solidify debugging logic.

Another aspect is the `semo repl --require` mechanism. If set globally, it may be too fixed and not suitable for many cases. Setting via command line requires inputting every time, which is inconvenient. By executing scripts, we can flexibly organize logic, inject commonly used utility libraries, and even make settings before injection, partially replacing the previous `--require` mechanism and hook mechanism.

## `semo run <PLUGIN> [COMMAND]`

This command functions similarly to `yarn create`, allowing for the direct execution of commands from remote plugin packages.

For example:

```
semo run semo-plugin-serve serve
```

Here, the `semo-plugin-serve` plugin is invoked to create a simple HTTP server. However, to simplify this command, we can omit certain parts.

```
semo run serve
```

This is much cleaner. The reason we can omit the `semo-plugin-` prefix is because this command only supports Semo series plugins, not all npm packages. Therefore, it can be internally appended. Additionally, the `serve` command is removed because the plugin follows a convention where it exposes a `handler` method that handles the execution of commands. If a plugin contains multiple commands, only the most commonly used ones are exposed using this mechanism, while others should be explicitly passed as arguments. Furthermore, it's essential to note that some commands require arguments, which should all be transformed into options.

Previously, for a command like:

```
semo serve [publicDir]
```

When dispatched using the `run` command, note that command arguments within plugin commands need to be placed after `--`.

```
semo run serve -- --public-dir=.
```

If your npm Semo plugin package is scoped, you need to specify the scope when using `run`.

```
semo run xxx --SCOPE yyy
```

Plugins run by the `run` command are cached locally, but not in the global plugin directory `.semo/node_modules`. Instead, they are cached in the `.semo/run_plugin_cache/node_modules` directory. By default, if the cache exists, the plugin will use it. To update, the `--upgrade` parameter is used.

```
semo run serve --UPGRADE|--UP
```

Some plugins may depend on others. In such cases, dependencies need to be manually specified to ensure they are downloaded together. Why not rely on npm's dependency mechanism? Consider the following example:

:::tip
This feature was introduced in v0.8.2.
:::

```
semo run read READ_URL --format=editor --DEP=read-extend-format-editor
```

The `editor` plugin depends on `read` during development. However, at runtime, the parameter specified for `read` is implemented by the `editor` plugin. Therefore, manual dependency specification is required.

You may have noticed that all parameters and options of this command are in uppercase. This is to reduce conflicts with other plugins. It's best to agree that all plugin parameters and options use lowercase.

## `semo script [file]`

> alias: `scr`

:::tip
This command has been moved to the `semo-plugin-script` plugin.
:::

Often, we need to run scripts outside of project services, such as for data migration, exporting data, batch data modification, or executing business logic like sending emails, SMS, or notifications. When faced with such requirements, we need to write scripts, but encounter several issues:

- Where to place them?
- How to write them?
- How to parse script arguments?

In many cases, these requirements are one-time or have preconditions, making them unsuitable for commands. Otherwise, there would be too many commands. In such scenarios, `Semo` provides a unified solution through this command.

### Where to Place Scripts

There is a `scriptDir` configuration in which scripts are stored, defaulting to `src/scripts`. Since these scripts are not accessible to services, there's no need to keep them too close to the project's core logic.

### How to Write and Parse Arguments

Of course, you can manually create scripts and then trigger them using this command. However, scripts need to be named, and there are certain formatting requirements. Therefore, it's recommended to use the `semo generate script` command to generate them.

```
semo generate script test
```

Automatically generated boilerplate code and filename:

```js
// src/bin/semo/scripts/20191025130716346_test.ts
export const builder = function (yargs: any) {
  // yargs.option('option', {default, describe, alias})
}

export const handler = async function (argv: any) {
  console.log('Start to draw your dream code!')
}
```

As a script, instead of immediately writing business logic, or needing to declare a `shebang` identifier, you only need to define two methods: `builder` and `handler`. The `builder` method is used to declare script parameters, and the format can refer to `yargs`. If the script doesn't require parameters, it can be omitted. Since it's template-generated, it's placed there for future needs. The `handler` contains the specific execution logic, with the parsed script parameters passed as arguments, including the project's `.semorc.yml` configuration. Note that `handler` supports `async`, allowing for asynchronous operations here.

Therefore, the most significant difference between scripts and commands lies in their frequency of use and business positioning. We often define atomic commands and then orchestrate them in scripts.

## `semo shell`

> alias: `sh`

:::tip
This command has been moved to the `semo-plugin-shell` plugin.
:::

This command is straightforward—it eliminates the need to type `semo` before every command. For example:

```
semo shell
> status
> hook
> repl
```

```
semo shell --prefix=git
> log
> remote -v
```

```
semo: prefix=git
git: log
```

## `semo status`

> alias: `st`

This command simply displays the environment in which `Semo` is currently operating. For example:

```
$ semo st
  version  :  1.8.17
  location :  ~/.nvm/versions/node/[VERSION]/lib/node_modules/semo
  os       :  macOS 10.15
  node     :  8.16.2
  npm      :  6.4.1
  yarn     :  1.15.2
  hostname :  [MY_HOST]
  home     :  [MY_HOME]
  shell    :  [MY_SHELL]
```

This command implements a hook, `hook_status`. Plugins implementing this hook can display relevant plugin information here. If a business project implements this hook, it can also display project information.

## `semo completion`

This command outputs a shell script that, when placed in `.bashrc` or `.zshrc`, enables automatic completion of subcommands.

:::warning
Due to Semo's poor performance, while this auto-completion can be used, it provides a poor user experience and is not recommended.
:::