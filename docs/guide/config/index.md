# Configuration Management

A core concept of `Semo` is configuration. We can influence `Semo`'s configuration through various methods, thereby affecting the behavior of the core and plugins.

## Global Configuration

There is a global `Semo` directory in the home directory, containing a configuration file that takes effect globally for the current user account, located at `~/.semo/.semorc.yml`.

This global configuration can adjust the default values of some commands, so you don't have to write options every time when using the command. For example:

```yml
$plugin:
  semo:
    create:
      repo: REPO_URL
      branch: main
```

This means that the `semo create` command, when initializing a project based on a template project, would originally be written like this:

```
semo create PROJECT_NAME PROJECT_REPO_URL main -f
```

However, with the default configuration, we can omit two parameters and write it as:

```
semo create PROJECT_NAME -f
```

We often use global configuration, especially for some functional commands. If we find ourselves passing certain parameters every time, we can fix them using global configuration. Another example:

When executing the `semo repl` command, there is a `--hook` parameter. If passed, it calls `hook_repl` to inject some business logic. However, the core default is `--hook=false` for slightly faster startup. But later, it was found that in business scenarios, `--hook=true` is needed every time. So, this configuration can be placed in the global configuration.

Now, executing the `repl` command will inject business logic by default.

```
semo repl
```

## Plugin Configuration

The plugin directory also has a `.semorc.yml` file. The configuration filename and principles are similar, but fewer configuration items actually take effect. By default, only three are generated:

```json
commandDir: src/commands
extendDir: src/extends
hookDir: src/hooks
```

As the project updates, more configuration items might become effective here. Currently, these three control the command directory, extended plugin command directory, and hook directory during plugin development, respectively.

## Project Configuration

When we integrate `Semo` into a project, the project also has command, extended plugin command, and hook directories, but also more, such as plugin and script directories:

```yml
commandDir: bin/semo/commands
pluginDir: bin/semo/plugins
extendDir: bin/semo/extends
scriptDir: bin/semo/scripts
hookDir: bin/semo/hooks
```

:::tip
The reason there is no plugin directory within a plugin is that we do not support nested declaration methods like defining plugins within plugins. However, we do support defining plugins within a project.
:::

Besides configuring directories, we can also configure options that override commands, such as the `repl` command option override mentioned earlier:

```yml
hook: true
```

Another example: the `semo init` command has an option `--typescript`. If this option is added when initializing the directory structure, the project configuration will also have a corresponding override configuration. This way, when executing the `semo generate` command, many code generation commands support both `js` and `ts` versions. Through this option, all automatically generated code will be in `typescript` style.

```json
typescript: true
```

Option overrides configured in the project configuration only take effect within the current project directory. This is just a demonstration of usage. In practice, we can provide various options during plugin development and limit behavior when using the plugin in a project, supporting both flexibility and personalization.

## Hidden Configuration

`Semo` has some hidden options that are rarely used. You can view them using `semo help --show-hidden`:

```
Options:
  --plugin-prefix                                     Set plugin prefix.                              [Default: "semo"]
  --disable-core-command, --disable-core              Disable core commands.
  --disable-completion-command, --disable-completion  Disable completion command.
  --hide-completion-command, --hide-completion        Hide completion command.
  --disable-global-plugin, --disable-global-plugins   Disable global plugins.
  --disable-home-plugin, --disable-home-plugins       Disable home plugins.
  --hide-epilog                                       Hide epilog.
  --set-epilog                                        Set epilog.                                        [Default: false]
  --set-version                                       Set version.
  --node-env-key, --node-env                          Set node env key                              [Default: "NODE_ENV"]
```

As you can see, by passing these options, we can change some core behaviors, even modifying our own command names and versions. Let's focus on two of them:

```yml
--disable-global-plugin: true
--disable-home-plugin: true
```

We generally add these two configurations in the project configuration so that plugin and hook scanning only scans the current project directory, which can slightly improve command performance.

If Semo's built-in commands are no longer needed, they can also be disabled, calling only project-customized commands, as if the Semo built-in commands didn't exist.

```yml
--disable-core-command: true
```

:::tip
In the Semo configuration environment, the following configurations are completely equivalent:
--foo-bar
--foo--bar
--fooBar
foo-bar
fooBar
:::

## Modifying Configuration via Command Line

We can certainly modify the configuration by editing the configuration file, but Semo also provides command-line tools for editing configurations. With the help of these tools, certain configurations can be customized using scripts.

```
semo config set a.b.c d 'some comment' -g
semo config get a.b.c
semo config del a.b.c
semo config list
semo config list --watch
```

## Application Environment Configuration

> This feature was introduced in `v0.8.0`

In the application directory (usually the current directory where the `semo` command is run), we use Semo's mechanisms to organize our project code, such as command-line tools, scheduled tasks, hook extensions, command extensions, scripts, etc. Previously, the system could only recognize the `.semorc.yml` configuration file. The latest version can now load an additional environment configuration. For example, if the current `NODE_ENV=development` (default value), then `.semorc.development.yml`, if it exists, will also be recognized and loaded, overriding same-named configurations in the main configuration (using Lodash's `_.merge`).

> This feature was introduced in `v2.0.2`

Added support for `.semorc.local.yml`. This configuration file has the highest priority, mainly used to override sensitive information such as database passwords. This file should not be committed to git.

So, in summary, the configuration priority order is: Parameters passed directly via command line > `.semorc.local.yml` > `.semorc.development.yml` > `.semorc.yml` > packageJson.semo > `~/.semo/.semorc.yml`

## Special Configuration Items

> This feature was introduced in `v0.9.0`

Semo's configuration is tightly coupled with the command line's `argv`. `argv` was originally intended only to store command-line parameters. Semo further extends it, hoping it can take on the important task of project configuration management. Several configurations starting with `$` are defined here with special meanings:

### `$plugin`

This configuration defines plugin-level configuration items. Previously, commands could only define configurations through parameters, but some complex configurations don't need to be declared as parameters, hence this configuration item was designed:

Taking `$plugin.ssh.key = 1` as an example, it means providing a configuration `key=1` to every command under the `semo-plugin-ssh` plugin. Where is this configuration retrieved? Semo has already assembled it into `argv.$config`. So, the `argv.$config` you get under the ssh plugin's command contains the configurations under `$plugin.ssh`.

To achieve this, each command declaration adds a statement like `export const plugin = 'ssh'`.

### `$plugins`

The `$plugin` above adds configuration to specific plugins, while this determines the plugins that take effect in the entire environment. It supports three configurations:

- `$plugins.register` Determines whether to enable the active registration mechanism. If enabled, the automatic scanning mechanism is disabled. Refer to [Plugin Active Registration Mechanism](../plugin/README.md)
- `$plugins.include` Performs secondary filtering on registered plugins. This is a whitelist, an array, supporting shorthand forms of plugin names.
- `$plugins.exclude` Performs secondary filtering on registered plugins. This is a blacklist, an array, supporting shorthand forms of plugin names.

### `$config`

Automatically parsed plugin configuration, generally only needed during plugin development. For applications, it is recommended to use `$app` to manage configuration.

### `$app` or `$application`

There's no special function here, it's just a recommendation to group application-specific configurations together to avoid confusion with command-line options. For example:

```yml
$app:
  port: 1234
```

### `$input`

When implementing commands that support piping, `$input` can automatically receive the output of the preceding command, regardless of whether it's the output of a Semo plugin. However, the output format is uncertain and needs to be validated and constrained by the current command itself.

### `$0`

This is built-in with `yargs`, indicating the name of the currently running script.

### `$command`

This contains information about the current command, generally not very useful.

### `$core`

`2.x` refactored the project structure, placing many strongly related methods into the `Core` class. This is the instance of Core.

### Log Related

Added in `2.x`, for convenient log output.

```js
argv.$log = log
argv.$info = info
argv.$error = error
argv.$warn = warn
argv.$success = success
argv.$jsonLog = jsonLog
argv.$colorfulLog = colorfulLog
argv.$colorize = colorize
```

Only `argv.$colorize` is used for coloring text; the others are for outputting logs.

### Debug Related

```js
argv.$debugCore = this.debugCore
argv.$debugCoreChannel = this.debugCoreChannel
argv.$debugChannel = this.debugChannel
```

If you use it with `DEBUG=*`, you will see debugging information printed by the core. If you also want to use this capability, you can use these APIs.

### Prompt Related

```js
argv.$prompt = {
  confirm,
  checkbox,
  expand,
  input,
  password,
  rawlist,
  select,
  search,
  editor,
  number,
}
```

This is a wrapper around @inquirer/prompts. You can refer to the inquirer documentation.

## Built-in Configuration Management Related Methods

### `argv.$core.extendConfig`

This method supports extending a new configuration file, allowing for configuration file groups instead of putting all configurations into `.semorc.yml`. It also supports environment configuration, for example:

```js
argv.$core.extendConfig('application.yml')
```

```
application.yml
application.development.yml
application.production.yml
```

### `argv.$core.config`

This method is used to retrieve a segment of the total configuration, defaulting to retrieving everything. Based on Lodash's `_.get` method.

### `argv.$core.getPluginConfig`

This method is used to retrieve plugin configuration, only working within the command `handler`. By default, command-line parameters still take priority, but if a command-line parameter is not specified and has no default value, the plugin-level configuration can be retrieved.

## Environment Variable Setting `.env`

By integrating `dotenv`, we introduced support for `.env` files. It is enabled by default for command-line tools. For programs, it needs to be enabled manually.

```typescript
import { Core } from '@semo/core'
const core = new Core()
core.useDotEnv()
```
