# Core Commands

## `semo`

Please note, `Semo` provides a default mechanism that can run any file conforming to the `Semo` command-line file syntax specification.

```
semo command.js
```

Usually, the commands we define do not have extensions like `.js`, so the file will be executed directly as a command. If you need to execute `.ts` style command files, a `ts` environment is required, please refer to the entry in the FAQ.

What is the significance of this mechanism? You can use `Semo` to define and execute script files, blurring the lines between commands and scripts; they are interconnected. First, you have a script, and if you find it's used frequently, give it a good name and encapsulate it as a plugin. Early on, a `semo-plugin-script` plugin was created for this purpose. Now, this default mechanism provides built-in support for script files. However, the `semo-plugin-script` plugin also includes a script boilerplate generator, a feature the `Semo` core does not intend to provide. Here, it's more inclined to be understood as a simplified way to rapidly develop command-line tools.

## `semo application`

> alias: `app`

:::tip
This command has been moved to the `semo-plugin-application` plugin
:::

By default, this command has no functionality. Its existence establishes a convention for business projects, suggesting that commands added to a business project should be written as subcommands of this command. The reason business projects can add subcommands to this command is by utilizing `Semo`'s command extension mechanism.

```bash
npm install semo-plugin-application
semo generate command application/test --extend=application
```

This way, you can add a test command to the project, which needs to be called using `semo application test`.

Using `semo application help`, you can see all top-level subcommands defined in the current business project. Because if a project implements too many commands with multiple levels, it's generally hard to remember all commands and parameters, so the help command is frequently executed.

## `semo cleanup`

> alias: clean

This command is used to clean up some files generated internally by Semo, commonly including repl command history, shell command history, temporarily downloaded packages in repl, temporarily downloaded packages by the run command, and the global plugin directory.

Currently, it offers limited extension, only allowing the application directory to define cleanup directories. It does not support plugins adding cleanup directories, mainly for security considerations.

## `semo config`

We can use this core built-in command to view and modify configuration files. It can operate on the current project's configuration file as well as the global configuration file.

```
semo config <op>

Manage rc config

Commands:
  semo config delete <configKey>                                Delete configs by key                     [aliases: del]
  semo config get <configKey>                                   Get configs by key
  semo config list                                              List configs                   [Default] [aliases: ls, l]
  semo config set <configKey> <configValue> [configComment]     Set config by key
  [configType]

Options:
  --global, -g  For reading/writing configs from/to global yml rc file, default is false
  --watch       Watch config change, maybe only work on Mac
```

Note that the format of `<configKey>` here is `a.b.c`, representing multi-level configuration. Additionally, it supports adding comments to the configuration set at the last level.

## `semo hook`

:::tip
This command has been moved to the `semo-plugin-hook` plugin
:::

The output of this command shows all available hooks in the current environment. All logic implementing these hooks can be executed. The output displays the hook name, description, and the module where the hook is declared:

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

Here you can see a special hook `hook_hook`. Implementing this hook allows declaring hooks. Any plugin can declare its own hooks for other commands to call, thereby influencing its own behavior. Business projects generally do not need to declare their own hooks unless the project heavily utilizes this mechanism to build its own business plugin system.

Also note that even if not declared, hooks can still be used as long as they are implemented. Declaring hooks here is just for transparency. How to declare and implement hooks will be explained in the hooks-related section.

::: warning
It's possible that in the future, undeclared hooks might not be allowed.
:::

## `semo init`

> alias: `i`

This command is used for initialization. It can implement two scenarios: initialization for a business project or initialization for a plugin. The difference between these two scenarios lies in slightly different directory structures.

In a business project, we default the `Semo` directory structure to the `bin` directory:

```
├── .semorc.yml
├── bin
│   └── semo
│       ├── commands
│       ├── extends
│       ├── hooks
│       ├── plugins
│       └── scripts
└── package.json

```

Whereas in a plugin project, we put all code into the `src` directory:

```
├── .semorc.yml
├── src
│    ├── commands
│    ├── extends
│    ├── hooks
└── package.json
```

The significance of this command is merely to save engineers a few seconds. That is, if you don't use this command, manually creating these directories and folders is also OK.

:::tip
The structure and purpose of `.semorc.yml` will be explained in the Configuration Management section.
:::

Additionally, if we really want to create a plugin, doing it through initialization is still too slow. It is recommended to use a plugin project template. The specific command is as follows:

```
semo create semo-plugin-xxx --template=plugin
```

Obviously, other project templates can also be used here. For the `create` command, refer to the introduction of the `create` command below.

## `semo create <name> [repo] [branch]`

> alias: `n`

This command is different from `generate` and `init`. It is used to initialize a new project directory. This project can be a business project or a plugin. This command has many parameters and some conventions:

```
$ semo create help

semo create <name> [repo] [branch]

Create a create project from specific repo

Options:
  --version      Show version number                                                                                       [boolean]
  --yes, -y      run npm/yarn init with --yes                                                             [Default: true]
  --force, -F    force download, existed folder will be deleted!
  --merge, -M    merge config with exist project folder!
  --empty, -E    force empty project, ignore repo
  --template, -T   select from default repos
  --add, -A      add npm package to package.json dependencies                                            [Default: false]
  --add-dev, -D  add npm package to package.json devDependencies                                         [Default: false]
  --init-semo, -i     init new project
  -h, --help     Show help information                                                                                     [boolean]
```

The individual explanations are above. Below we illustrate with specific usage scenarios.

### Initialize from any code repository

```
semo create PROJECT_NAME PROJECT_REPO_URL main -f
```

Here you can see that we can use the create command to download code from any git repository address. Any code repository can be our project template. `main` is the branch name, which defaults to `main`, so it can be omitted. `-f` means if the directory already exists, the original will be deleted first, then recreated.

Besides downloading the code, the create command also helps delete the original `.git` directory, reinitializes an empty `.git` directory, and automatically downloads all project dependencies.

### Create an empty project, not based on any project template

```
semo create PROJECT_NAME -yfie
```

Here you can see a feature of `yargs`: short parameters can be chained together. This is equivalent to `-y -f -i -e`. That is, `-y` helps us automatically answer `yes` when creating `package.json`, `-f` forces deletion of existing directories, `-i` automatically executes `semo init` to initialize the project directory, and `-e` tells the command not to base it on a code repository or built-in template, but to declare an empty project.

The project directory structure is as follows:

```
├── .semorc.yml
├── bin
│   └── semo
│       ├── commands
│       ├── extends
│       ├── hooks
│       ├── plugins
│       └── scripts
└── package.json
```

### Create a `Semo` plugin directory

If not based on a plugin template, we can manually create a basic plugin structure:

```
semo create semo-plugin-[PLUGIN_NAME] -yfie
```

As you can see, it's very similar to the above, except for the project name. There is a convention for the project name here: if the project name starts with `semo-plugin-`, it is considered to be initializing a `Semo` plugin, and `semo init --plugin` will be executed during initialization.

The project directory structure is as follows:

```
├── .semorc.yml
├── package.json
└── src
    ├── commands
    ├── extends
    └── hooks
```

### Create project based on built-in templates

If we execute the following command to create a project:

```
semo create PROJECT_NAME --template
```

You will see the following output:

```
? Please choose a pre-defined repo to continue: (Use arrow keys)
❯ semo_plugin_starter [semo-plugin-starter, plugin]
❯ ...
```

Here you can select a desired built-in template, meaning you don't need to actively enter the repository address. By default, there is only one plugin template, but you can use `hook_create_project_template` to inject other template addresses:

Hook implementation example, for more usage of hooks, please refer to the hooks related description

```js
export const hook_create_project_template = {
  demo_repo: {
    repo: 'demo_repo.git',
    branch: 'main',
    alias: ['demo'],
  },
}
```

If you already know the template and identifier to use during initialization, you can specify it directly:

```
semo create PROJECT_NAME --template=demo
semo create PROJECT_NAME --template=demo_repo
```

:::tip
When creating a business project or plugin, it is not recommended to start from an empty project, because many engineering issues and technology selection issues need to be considered. It is recommended to summarize the commonly used scaffolding projects in your company and then initialize them in a unified way. For example, with the built-in plugin template, after initialization, you can directly write logic, then upload the code to `Github`, and then execute `npm version patch && npm publish` to publish to the npm repository. How to develop a plugin and publish it to the `npm` repository will be documented separately. Also, note that the scaffolding project here can be implemented in any language.
:::

`--add` and `--add-dev` are used to specify new dependencies during initialization. `--merge` means not deleting the original project, but entering the project directory and then applying `--init`, `--add`, `--add-dev`.

## `semo generate <component>`

> alias: `generate`, `g`
>
> This command is a component code generation command. Here, component means the layered and classified concepts abstracted from the development target. For example, the `Semo` core defines three concepts: plugins, commands, and scripts, so these three concepts have corresponding code generation subcommands. Similarly, `semo` plugins or integrated projects can create their own abstract concepts and provide supporting code generators. For example, a backend business project might have concepts like routes, controllers, models, database migration files, unit tests, etc. These concepts may not be universal across different projects, but within a single project, it's best to maintain a consistent style. Automatically generating boilerplate code can better maintain style consistency.

```
$ semo generate help

semo generate <component>

Generate component sample code

Commands:
  semo generate command <name> [description]               Generate a command template
  semo generate plugin <name>                              Generate a plugin structure
  semo generate script <name>                              Generate a script file

Options:
  --version   Show version number                                                                                          [boolean]
  -h, --help  Show help information                                                                                        [boolean]
```

### Extend `generate` command to add subcommands

The method is the same as extending the `application` command above:

```bash
semo generate command generate/test --extend=semo
```

How to implement these code generation commands is not constrained here, because firstly, the built-in template string mechanism in ES6 can solve most problems, then `lodash`'s `_.template` method is also quite flexible, and finally, just put the assembled boilerplate code in the desired location.

Since this part is based on `Semo`, related configurations are recommended to be placed in the `.semorc.yml` file, for example, configurations automatically generated include:

```yml
commandDir: src/commands
extendDir: src/extends
hookDir: src/hooks
```

As you can see, the `create` command generating default configurations merely defines some directories for automatic code generation and also provides a style for defining directory configurations. If you want to maintain configuration consistency, you can define other directories using the same style.

## `semo plugin`

> alias: p

:::tip
This command has been moved to the `semo-plugin-plugin` plugin
:::

This command is used to install global plugins in the home directory, and can also be used to optimize the semo execution efficiency of the current project.

```
$ semo plugin help
semo plugin

Plugin management tool

Commands:
  semo p install <plugin>    Install plugin                                                                 [aliases: i]
  semo p list                List all plugins                                                           [aliases: l, ls]
  semo p uninstall <plugin>  Uninstall plugin                                                              [aliases: un]
```

## `semo repl [replFile]`

> alias: `r`

REPL (read-eval-print-loop): An interactive interpreter. Every modern programming language probably has this type of interactive environment where we can write simple code as a tool for quickly understanding and learning language features. However, when REPL can be combined with frameworks or business projects, it can play a greater role.

### Some extensions to `REPL`

During the development of Semo and this scaffold, Node's REPL did not yet support `await`. This mechanism was simulated here to trigger the execution of some promise or generator methods in the project. Through this capability, combined with the ability to inject some business code into `REPL`, we gain an additional execution method besides interface controllers, scripts, and unit tests, and this execution method is interactive.

### Injecting new objects into `REPL`

Here you need to implement the built-in `hook_repl` hook and configure it in the hook directory declared in the business project: `hookDir`. The following code is for reference only.

```js
// src/hooks/index.ts
export const hook_repl = {
  semo: {
    add: async (a, b) => {
      return a + b
    },
    multiple: async (a, b) => {
      return a * b
    },
  },
}
```

Then in the REPL environment, you can use it:

:::tip
All information returned by `hook_repl` is injected into `Semo.hooks.application` in the REPL.
:::

```
>>> Semo.hooks.application.add
[Function: add]
>>> await Semo.add(1, 2)
3
>>> Semo.hooks.application.multiple
[Function: multiple]
>>> await Semo.multiple(3, 4)
12
```

In actual business projects, common methods, utility functions, etc., from the project are injected. This is very helpful for development and subsequent troubleshooting. By default, `Semo` injects its own runtime object, such as Semo.argv.

:::tip
In practice, we have injected various company infrastructures like databases, caches, OSS, Consul, ElasticSearch, etc., written as plugins, making it easier for us to directly access the infrastructure.
:::

### Reloading hook files

`.reload` or `Semo.reload()` can re-execute the `hook_repl` hook and inject the latest results into Semo. The purpose is to call the latest hook results without exiting the REPL environment. This only guarantees reloading and executing the hook file itself. If the hook internally uses `require`, it will still be cached. This part needs to be handled by the user, for example, by trying to delete `require.cache` before each `require`.

### Temporarily trying npm packages

Under REPL, `Semo.import` supports temporarily downloading and debugging some packages. These debugging packages will not be downloaded into the current project's node_modules directory. (There is an equivalent method: Semo.require)

```
>>> let _ = Semo.import('lodash')
>>> _.VERSION
```

#### Using internal commands

> Added in v1.5.14
> `.require` and `.import` are equivalent and can quickly import some commonly used packages for debugging, for example:

```
>>> .import lodash:_ dayjs:day
```

The part after the colon is the alias, meaning the variable name to store it as after importing.

### Extracting object properties into the REPL environment

```
>>> Semo.extract(Semo, ['hooks.application.add', 'hooks.application.multiple'])
```

The potential risk of this operation is overwriting built-in objects in the REPL environment. However, the purpose and function of this API are to release specific objects, such as releasing all table models from an ORM into the database.

This operation is also supported in the configuration. For example, to inject the `Utils` object from the Semo object, you can configure it in the configuration file:

```
$plugin:
  semo:
    repl:
      hook: true
      extract:
        Semo:
          - hooks.application.add
          - hooks.application.multiple
```

If you only want to inject `Utils`, it supports writing like this.

```
$plugin:
  semo:
    extract:
      Semo: [Utils]
```

### Introduction to the Semo Object

Initially, the plan was for the core and plugins to freely inject into the REPL environment. Later, it was felt to be uncontrollable, so it was decided that both the core and plugins can only be injected into the `Semo` object. Below is the structure of the Semo object:

- Semo.hooks To isolate information from various plugins, all injected information from plugins is injected here according to the plugin name, so different plugins do not interfere with each other.
- Semo.argv This is the `yargs` argv parameter that enters the command. Sometimes it can be used to check if configuration merging is effective and to experiment with yargs parameter parsing.
- Semo.repl The object instance of the current REPL environment.
- Semo.Utils The core utility package, which includes several custom functions, etc.
- Semo.reload Re-executes the `hook_repl` hook, using the latest hook file.
- Semo.import Used for temporarily experimenting with some npm packages. Cache can be cleared using `semo cleanup`.
- Semo.extract Used to release key-value pairs of internal objects into the current scope. Can be considered compensation for putting all hook injections into the `Semo.hooks` object.

### Three methods injected into the global scope

If you feel the default object hierarchy is too deep, you can configure or use parameters to inject directly into the REPL's global scope by default.

#### Method 1: `--extract` option

```
semo repl --extract Semo.hooks
```

#### Method 2: Configuration: Modify `.semorc.yml`

```
$plugin:
  semo:
    extract: Semo.hooks.application
```

#### Method 3: Execute Semo.extract in REPL

```
>>> Semo.extract(Semo, ['hooks.application.add', 'hooks.application.multiple'])
```

Semo.extract is very flexible. You can specify which keys to export, or leave it blank to export all keys by default.

### Support for executing a repl file

The purpose is also to execute logic and then inject some results into the REPL. The file is also a Node module and needs to conform to the specified format.

```js
exports.handler = async (argv, context) => {}

// or

module.exports = async (argv, context) => {}
```

Objects can be added either through the context or by returning an object.

What is the use of this mechanism? The main purpose is that during development and debugging, some debugging tasks intended for the REPL have many prerequisite logics. If entered line by line in the REPL, it's too cumbersome. Therefore, this method allows固化 (solidifying/fixing) the debugging logic.

The difference between a repl file and extract is that extract can only operate on existing objects, while a repl file can add any needed objects to the REPL. From this perspective, it is similar to hook_repl, but more convenient to operate, without needing to consider the format of hook implementation.

## `semo run <PLUGIN> [COMMAND]`

This command can achieve the effect of directly executing commands within remote plugin packages, similar to `pnpm create`.

For example:

```
semo run semo-plugin-serve serve
```

Here it calls the `semo-plugin-serve` plugin to implement a simple HTTP service. We might feel that writing it this way is still not very convenient, so we can simplify it.

```
semo run serve
```

Isn't this much simpler? The reason `semo-plugin-` can be omitted here is that only semo series plugins are supported, not all npm packages, so it can be added internally. The `serve` command at the end is removed because the plugin implements a convention for this. The plugin is a normal node package that can expose methods externally. Here it exposes a handler method, and this handler method, in turn, calls the `serve` command within the package, because this command file is also a Node module. If the plugin contains multiple commands, this mechanism can be used to expose the most commonly used one, while others should still be passed explicitly. Also, note that some commands require parameters to be passed; here, all parameters and options need to be converted into options.

When it was a command before:

```
semo serve [publicDir]
```

When scheduling with the `run` command: Note that parameters from the plugin command need to be placed after `--`.

```
semo run serve -- --public-dir=.
```

If your npm semo plugin package is also under a scope, you need to specify the scope when using run.

```
semo run xxx --scope yyy
```

Plugins run by the `run` command are definitely cached locally, just not in the global plugin directory `.semo/node_modules`, but in the `.semo/run_plugin_cache/node_modules` directory. By default, if it exists, the cached plugin will be used. If you want to update, you need to use the parameter --force (Note: original text says --upgrade, but example uses --force. Translating based on example usage.).

```
semo run serve --force
```

Some plugins may depend on other plugins. If this is the case, you need to manually specify the dependent plugins to download them together. Why can't it be based on npm dependencies? Look at the example below:

:::tip
This feature introduced in v0.8.2
:::

```
semo run read READ_URL --format=editor --with=read-extend-format-editor
```

The `editor` plugin depends on `read` during development, but at runtime, the parameter specified by `read` is implemented by the `editor` plugin, so the dependency must be specified manually.

## `semo script [file]`

> alias: `scr`

:::tip
This command has been moved to the `semo-plugin-script` plugin
:::

Many times we need to run some scripts. These scripts are outside the project service and need to be triggered actively by us. They might be for data migration, data export, batch data modification, or executing business logic, such as sending emails, SMS, notifications, etc. When faced with such requirements, we need to write scripts, but we encounter several problems:

- Where to put them
- How to write them
- How to parse script parameters

Often these requirements are one-off or conditional, not very suitable for being written as commands, otherwise, there would be too many commands. In such scenarios, `Semo` provides a unified solution through this command.

### Where to put it

There is a `scriptDir` in the configuration, defaulting to `src/scripts`. We default to putting scripts here because these scripts will not be accessed by the service, so there's no need to place them too close to the core project logic.

### How to write, how to parse arguments

Of course, you can manually create scripts and trigger them with this command, but because scripts need names and have certain format requirements, it is recommended to use the `semo generate script` command to generate them.

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

As you can see, as a script, it doesn't start writing business logic right away, nor does it need to declare a `shebang` identifier. It only needs to define two methods: `builder` and `handler`. `builder` is used to declare the script's parameters, the format can refer to `yargs`. If the script doesn't need parameters, it doesn't actually need to be defined. Since it's automatically generated by the template, just leave it there in case it's needed. `handler` is the specific execution logic. The passed parameter is the parsed script parameters, which also includes the configuration from the project's `.semorc.yml`. You can see that `handler` supports `async`, so asynchronous operations can be performed here.

Therefore, the biggest difference between scripts and commands is actually the frequency of use and business positioning. A common layering we do is to define atomic commands and then orchestrate them in scripts.

## `semo shell`

> alias: `sh`

:::tip
This command has been moved to the `semo-plugin-shell` plugin
:::

This command is very simple. Its purpose is to avoid typing the preceding `semo` every time you type a command, for example:

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

The purpose of this command is simple: to see the current environment `Semo` is in, for example:

```
$ semo st
  version  :  1.8.17
  location :  ~/.nvm/versions/node/[VERSION]/lib/node_modules/semo
  os       :  macOS 10.15
  node     :  8.16.2
  npm      :  6.4.1
  hostname :  [MY_HOST]
  home     :  [MY_HOME]
  shell    :  [MY_SHELL]
```

A hook, `hook_status`, is implemented here. Plugins that implement this hook can display relevant plugin information here. If a business project implements this hook, it can also display project information here.

## `semo completion`

The purpose of this command is to output a piece of `Shell` script. Placing it in `.bashrc` or `.zshrc` enables autocompletion for subcommands.

```bash
eval "$(semo completion)"
```

:::warning
Since Semo scans commands defined by plugins at various levels in real-time during execution, if there are too many plugins and commands in the environment, Semo execution might become slow. In this case, it is not recommended to put the completion script in `.bashrc` or `.zshrc`.
:::
