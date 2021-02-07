# Configuration

`Configuration` is one of the core concept of `Semo`, we can use many ways to interfere `Semo` behavior, then influence core or plugins. 

## Global configuration

There is a global `Semo` directory in system home directory, and there is a global `Semo` configration, located at `~/.semo/.semorc.yml`

This global `Semo` configration can set default value for commands, then you don't need to provide commands options each time you running commands. So comparing with normal CLI commands, you can change commands default value, for example:

```yml
$plugin:
  semo:
    create:
      repo: REPO_URL
      branch: master
```

This config means `semo create` command normal format is:

```
semo create PROJECT_NAME PROJECT_REPO_URL master -f
```

But we set specific default option value, then it reduce two arguments when we use is, and changed to:

```
semo create PROJECT_NAME -f
```

We often use this kind of global settings, if we find out we always set some command arguments, we can settle those settings down in global config file, here is another example:

When we run `semo repl` command, there is `--hook` option, if we pass this option, `hook_repl` can trigger other business logics, and inject some objects into REPL. But the default value is `--hook=false`, this can launch faster, but if you need the hook every time, you can put `--hook=true` into global config file `~/.semo/.semorc.yml`.

```yml
$plugin:
  semo:
    repl:
      hook: true
```

## Plugin configuration

Plugin directory also has a `.semorc.yml` file, only 3 settings affected.

```yml
commandDir: src/commands
extendDir: src/extends
hookDir: src/hooks
```

`commandDir` is for keeping commands, `extendDir` is for extending other plugins, `hookDir` is for hooking.

Except above configs, plugins would expose some configs also, these configs has special config path, if not defined, will also try to take from root level.


```yml
$plugin:
  xxx:
    foo: bar
```

This config can be read in this way:

```js
const foo = Utils._.get(argv, '$plugin.xxx.foo', argv.foo)
```

This give an opportunity for plugin to define their own config, if plugin use more top level config, it will conflict with each other. This style config is compatible with `commandDefault`, `$plugin.PLUGIN` is for plugins, `commandDefault` is for commands, the former depends on code logic, the latter works automatically. If you are a plugin author, you need describe how to use your plugin in your README.md.

## Project configuration

When we integrate `Semo` with our projects, there are also commands, extends, hooks directories, and there are more like plugins and scripts and so on.

```yml
commandDir: bin/semo/commands
pluginDir: bin/semo/plugins
extendDir: bin/semo/extends
scriptDir: bin/semo/scripts
hookDir: bin/semo/hooks
```

:::tip
`Semo` does not support define plugins in plugin, but support project define plugins.
:::

Except for configing some directories, we can also override some command options, like the `repl` command mentioned above.

```yml
hook: true
```

For another example: `semo init` command has an option `--typescript`, if using this option in project configuration file, it will share with other commands using this option like `semo generate`, it will let all generated file has typescript code style.

```json
typescript: true
```

Congurations in project configration file only work in current project. because of plugins, there may be many more configurations in project level Semo config file, that can provide specific needed features.

## Hidden configrations

`Semo` has some hidden options, those are rarely used in common cases. You can run `semo help --show-hidden` to see them. 

```
Option：
  --script-name                                       Rename script name.                    [String] [Default: "semo"]
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

As we see, by passing these options, we can change some core behaviours, even the command name itself.


```yml
--disable-global-plugin: true
--disable-home-plugin: true
```

We can use these two options in project to disable global plugins, that will improve performance a little bit.

:::tip
In `Semo` Configrations below are all equivalent.
--foo-bar
--foo--bar
--fooBar
foo-bar
fooBar
:::

## Changing configration by CLI commands

Of course, we could modify configuration by editing, but `Semo` also provide commands to do this job, so with this, you can modify configuration in scripts.

```
semo config set a.b.c d 'some comment' -g
semo config get a.b.c
semo config del a.b.c
semo config list
semo config list --watch
```

## Application configuraion

> Added since `v0.8.0`

In application root, we use `Semo` way to construct our code, like commands, cronjobs, hooks and extensions, scripts and so on. we can only recognize `.semorc.yml` before, but now it can load another env config file, e.g. when `NODE_ENV=development`, then `.semorc.development.yml` will be loaded and can override default configurations (using `Lodash` `_.merge`)

## 特殊配置项

## Special configrations

> Added since `v0.9.0`

Semo's configurations are combined with yargs's argv, argv was designed to store command line arguments and options. Semo extended this behaviour, make it to be configuration management tool, here added several special configuration started by `$`, and have special meanings.
### `$plugin`

This key defines plugin level configurations, make some configurations are not needed to pass by CLI, but in config file.

Take `$plugin.ssh.key = 1` as an example, it means to set `key=` to all commands of `semo-plugin-ssh`. But where can we get the config value? Semo has processed it into `argv.$config`, so you can get values of `$plugin.ssh` in `argv.$config` in plugin `semo-plugin-ssh` code.

In order to archive this, each command must add `export const plugin = 'ssh'` in command defination.

### `$plugins`

The above `$plugin` is to set specific settings for each plugin, but this `$plugins` is for the whole environment. There are 3 config keys.

* `$plugins.register` Whether or not to enable active plugin registration mechanism， if enabled, auto-detect mode will not work anymore.
* `$plugins.include` Secondary filter to included plugins, it's an array, support short plugin style。
* `$plugins.exclude` Secondary filter to excluded plugins, it's an array, support short plugin style。

### `$config`

This is auto-parsed configuration. Often it will be used in plugin development. For project application project, we often use `$app` to manage app configration.

### `$app` or `$application`

`$app` have nothing special, but a suggestion to put all app configration together, then it will not conflict with `Semo` internal options.

```yml
$app:
  port: 1234
```

### `$input`

This is for command line pipe feature, `$input` will be the output by pipe from previous command. It can be not `Semo` output, but the format is not defined.

### `$0`

This is inlucded by `yargs`, stands for the current script file name.

### `$command`

This is about the current command info.

### `$semo`

This is an reference to `Utils`, the reason of this key is that you need to know and process the internal info of `Semo`, but if you import `@semo/core`, you may lose some runtime info. By running `argv.$semo.Utils.getInternalCache().get('argv')` you can get correct runtime info.

## Internal configration management methods

### `Utils.extendConfig`

This method support to extend a new config file, so you don't need to put all configuration in `.semorc.yml`, also support configuration by environment.

```js
Utils.extendConfig('application.yml')
```

```
application.yml
application.development.yml
application.production.yml
```

### `Utils.config`

This method is for getting part of configuration, based on `_.get`.

### `Utils.pluginConfig`

This method is for getting plugin configuration, it only works in command handler, by default command options is to take precedence over the plugin configration.

## `.env` support

By npm package `dotenv`, we support `.env` file, and enabled by default for CLI, but need to manually enable for project.

```typescript
import { Utils } from '@semo/core'

Utils.useDotEnv()
```