# Configuration

:::tip
Translating...
:::

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

`Semo` 有一些隐藏选项，平时很少使用，可以通过 `semo help --show-hidden` 查看：
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

自动解析出的插件配置，一般只是插件开发的时候才需要，如果是应用，建议使用 `$app` 来管理配置

### `$app` 或者 `$application`

这里没有特殊功能，只是建议应用自己的配置也收到一起，防止跟命令行的选项混淆。比如：

```yml
$app:
  port: 1234
```

### `$input`

这个的作用是当实现支持管道的命令时，`$input` 可以自动接收前面命令的输出，不管是不是 Semo 插件的输出，但是输出的格式是不确定的，需要当前命令自己去校验和约束。

### `$0`

这个是 `yargs` 自带的，表明当前运行的脚本名称。

### `$command`

这个里放的是当前命令的信息，一般来说用处不是很大

### `$semo`

这里放的是对工具函数库 `Utils` 的引用，用这个主要原因是插件有时也想知道和处理内部信息，但是如果是在自己插件内部依赖和导入 `@semo/core` 由于位置不同，实际上是占用两份内存，而且自己导入这部分由于没有经过初始化，所以缺失必要的信息，通过 `argv.$semo.Utils.getInternalCache().get('argv')` 能够正确取到运行时的数据。

## 内置的配置管理相关方法

### `Utils.extendConfig`

这个方法支持扩展一个新的配置文件，这样可以支持配置文件组，不用把所有的配置都放到 `.semorc.yml` 里，同时支持环境配置，例如：

```js
Utils.extendConfig('application.yml')
```

```
application.yml
application.development.yml
application.production.yml
```

### `Utils.config`

这个方法用于取出总配置里的一段，默认取出所有，基于 Lodash 的 `_.get` 方法。

### `Utils.pluginConfig`

这个方法用于取出插件配置，只能在命令 `handler` 下工作，默认取出还是命令行参数优先，但是如果命令行参数没有指定并且没有默认值，则可以取插件级别的配置。

## 环境变量设置 `.env`

通过整合 `dotenv`，我们引入了对 `.env` 文件的支持，对于命令行工具来说是默认开启的。对于程序来说需要手动开启。

```typescript
import { Utils } from '@semo/core'

Utils.useDotEnv()
```