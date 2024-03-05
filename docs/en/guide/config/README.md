# Configuration Management

A core concept of `Semo` is configuration. We can intervene in the configuration of `Semo` in multiple ways to influence the behavior of both the core and plugins.

## Global Configuration

There is a global `Semo` directory in the home directory, containing a configuration file that will take effect globally under the current account, located at `~/.semo/.semorc.yml`.

This global configuration can adjust default values for some commands, allowing options to be omitted when using commands each time, for example:

```yml
$plugin:
  semo:
    create:
      repo: REPO_URL
      branch: master
```

This means that the `semo create` command, which initializes a project based on a template project, would originally be written as follows:

```
semo create PROJECT_NAME PROJECT_REPO_URL master -f
```

However, with default configuration, we can omit two parameters and write:

```
semo create PROJECT_NAME -f
```

:::tip
You can see that the configuration is placed under the `commandDefault` key. This is because if it's configured at the top level, it will affect all commands. If this is desired behavior, it can be placed at the top level. Otherwise, it can be placed under `commandDefault` to only affect a single command.
:::

We often use global configuration, especially for some functional commands. If we find ourselves needing to pass certain parameters every time, we can fix them through global configuration. For example:

When executing the `semo repl` command, there is a `--hook` parameter. If passed, it will call `hook_repl` to inject some business logic. However, the default for the core is `--hook=false`, which starts a bit faster, but later it was found that in the business scenario, `--hook=true` was needed every time. In this case, we can add this configuration to the global configuration.

```yml
commandDefault:
  repl:
    hook: true
```

Now, when executing the `repl` command, business logic will be injected by default.

```
semo repl
```

## Plugin Configuration

There is also a `.semorc.yml` file under the plugin directory, with similar configuration file names and principles, but with fewer configurations that actually take effect. By default, only three are generated:

```json
commandDir: src/commands
extendDir: src/extends
hookDir: src/hooks
```

As the project evolves, more configurations that can take effect here may be added. Currently, these three control the command directory, plugin extension command directory, and hook directory during plugin development.

In addition to the commonly used plugin configurations mentioned above, plugins sometimes expose some configuration options externally. These configuration lines generally agree to be retrieved from both the root and the namespace of the plugin name.

```yml
semo-plugin-xxx:
  foo: bar
```

The effectiveness of this configuration depends on the plugin's own implementation trying to retrieve it actively.

```js
const foo = Utils._.get(argv, 'semo-plugin-xxx.foo', argv.foo)
```

This provides an opportunity for plugins to flexibly agree on exclusive parameters internally. If a plugin uses too many top-level configuration parameters internally, it is likely to conflict with parameters from other plugins. This style of configuration agreement is a supplement to configurations like `commandDefault`. The focus of plugin configuration is configuration, while `commandDefault` is the override order from the perspective of command parameters. The former is actively obtained, while the latter can be automatically recognized. The specific plugin should clearly indicate which method it uses.

## Project Configuration

When we integrate `Semo` into a project, the project also has command directories, plugin extension command directories, and hook directories, but there are more, such as plugin directories and script directories:

```yml
commandDir: bin/semo/commands
pluginDir: bin/semo/plugins
extendDir: bin/semo/extends
scriptDir: bin/semo/scripts
hookDir: bin/semo/hooks
```

:::tip
The reason there is no plugin directory in the plugin is because we do not support the nested declaration of plugins in plugins, but we support defining plugins in projects.
:::

In addition to configuring some directories, we can also configure some options to override commands, such as the `repl` command option override mentioned above:

```yml
hook: true
```

For example, the `semo init` command has an `--typescript` option. If this option is added to initialize the directory structure, there will also be a corresponding override configuration in the project configuration. This way, when executing the `semo generate` command, many code generation commands that support both `js` and `ts` versions will be automatically generated as `typescript` style.

```json
typescript: true
```

Options configured in the project configuration only take effect in the current project directory. This is just a demonstration of usage. In fact, we can provide multiple options when developing plugins, and limit behaviors when using plugins in projects to support flexibility and personalization.

## Hidden Configuration

`Semo` has some hidden options that are rarely used in ordinary times, which can be viewed by `semo help --show-hidden`:

```
Options:
  --script-name                                       Rename script name.                    [string] [default: "semo"]
  --plugin-prefix                                     Set plugin prefix.                              [default: "semo"]
  --disable-core-command, --disable-core              Disable core commands.
  --disable-completion-command, --disable-completion  Disable completion command.
  --hide-completion-command, --hide-completion        Hide completion command.
  --disable-global-plugin, --disable-global-plugins   Disable global plugins.
  --disable-home-plugin, --disable-home-plugins       Disable home plugins.
  --hide-epilog                                       Hide epilog.
  --set-epilog                                        Set epilog.                                        [default: false]
  --set-version                                       Set version.
  --node-env-key, --node-env                          Set node env key                              [default: "NODE_ENV"]
```

As seen, by passing these options, we can change some core behaviors, and even change our own command names and versions. Here, two of them are emphasized:

```yml
--disable-global-plugin: true
--disable-home-plugin: true
```

We generally add these two configurations in project configuration, so that when scanning plugins and hooks, only the current project directory is scanned, which can slightly improve command performance.

:::tip
In the Semo configuration environment, the following configurations are completely equivalent
--foo-bar
--foo--bar
--fooBar
foo-bar
fooBar
:::

## Modifying Configuration via Command Line

Of course, we can modify the configuration by editing the configuration file, but Semo also provides a command line tool to edit the configuration. With this command line tool, we can customize certain configurations through scripts.

```
semo config set a.b.c d 'some comment' -g
semo config get a.b.c
semo config del a.b.c
semo config list
semo config list --watch
```

## Application Environment Configuration

> This feature was introduced in `v0.8.0`

In the application directory (usually the current directory where the semo command is run), we organize our project code using Semo's mechanism, such as command line tools, scheduled tasks, hook extensions, command extensions, scripts, etc. Previously, the system could only recognize the `.semorc.yml` configuration file, but the latest version can continue to load an environment configuration. For example, if the current `NODE_ENV=development` (default value), then `.semorc.development.yml` will also be recognized and loaded, and will override configurations with the same name in the main configuration (using Lodash's `_.merge`).

## Special Configuration Items

> This feature was introduced in `v0.9.0`

Semo's configuration and command line `argv` are closely coupled. The original intention of `argv` was only to store command line parameters. Semo further expands its capabilities, hoping it can take on the responsibility of project configuration management. Here, several configurations starting with `$` have special meanings:

### `$plugin`

This configuration defines plugin-level configuration items. Previously, commands could only agree on configurations through parameters, but there are some complex configurations that do not need to be declared as parameters. Therefore, this configuration item was designed:

Taking `$plugin.ssh.key = 1` as an example, it means that each command under the `semo-plugin-ssh` plugin is provided with a configuration `key=1`. Where does this configuration go? Semo has already helped assemble it into `argv.$config`, so you can retrieve `argv.$config` under the command of the ssh plugin, and all configurations obtained are under `$plugin.ssh`.

To achieve this, each command adds a declaration like `export const plugin = 'ssh'` when declared.

### `$plugins`

The `$plugin` mentioned above adds configurations for each specific plugin, while this one determines the effective plugins for the entire environment, supporting three configurations:

* `$plugins.register` determines whether to enable the active registration mechanism. If enabled, the automatic scanning mechanism is disabled. Refer to [Active Registration Mechanism for Plugins](../plugin/README.md).
* `$plugins.include` performs secondary filtering on registered plugins. This is a whitelist and is an array that supports shorthand notation for plugin names.
* `$plugins.exclude` performs secondary filtering on registered plugins. This is a blacklist and is an array that supports shorthand notation for plugin names.

### `$config`

Automatically parsed plugin configurations. Generally, this is only needed during plugin development. If it is an application, it is recommended to use `$app` to manage configurations.

### `$app` or `$application`

There is no special function here. It is only suggested that the application's own configuration be grouped together to prevent confusion with command line options. For example:

```yml
$app:
  port: 1234
```

### `$input`

The purpose of this is when implementing commands that support piping, `$input` can automatically receive the output of previous commands, regardless of whether it is the output of Semo plugins, but the format of the output is uncertain and needs to be verified and constrained by the current command itself.

### `$0`

This is built into `yargs`, indicating the name of the current script being run.

### `$command`

This contains information about the current command. Generally, its usefulness is not very significant.

### `$semo`

This contains a reference to the utility function library `Utils`. The main reason for using this is that sometimes plugins also want to know and process internal information. However, if a plugin depends on and imports `@semo/core` internally, due to different positions, it actually occupies two separate memories, and the imported part is missing necessary information due to lack of initialization. By using `argv.$semo.Utils.getInternalCache().get('argv')`, you can correctly obtain the runtime data.

## Built-in Configuration Management Methods

### `Utils.extendConfig`

This method supports extending a new configuration file, which allows for configuration file groups without putting all configurations in `.semorc.yml`, while also supporting environment configurations. For example:

```js
Utils.extendConfig('application.yml')
```

```
application.yml
application.development.yml
application.production.yml
```

### `Utils.config`

This method is used to extract a section of the total configuration, with all sections extracted by default, based on Lodash's `_.get` method.

### `Utils.pluginConfig`

This method is used to extract plugin configurations and only works in the `handler` of commands. By default, it still takes precedence over command line parameters, but if the command line parameters are not specified and there is no default value, plugin-level configurations can be obtained.

## Setting Environment Variables `.env`

By integrating `dotenv`, we have introduced support for the `.env` file, which is enabled by default for command line tools. For programs, you need to enable it manually.

```typescript
import { Utils } from '@semo/core'

Utils.useDotEnv()
```