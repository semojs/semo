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

## Plugin config

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

这样就给了插件内部一个灵活约定专属参数的机会，如果插件内部用了太多顶级配置参数，就很可能会跟其他插件的参数发生冲突。这种风格的配置约定是对 `commandDefault` 这种配置的一个补充，插件配置重点是配置，而 commandDefault 是从命令参数的角度的覆盖顺序，前者是主动获取，后者可以做到自动识别。具体插件用的是哪一种需要具体的插件明确给出说明。

## 项目配置

当我们把 `Semo` 整合到项目中的时候，项目里同样也有命令目录，扩展插件命令目录和钩子目录，但是还有更多，比如插件目录和脚本目录:

```yml
commandDir: bin/semo/commands
pluginDir: bin/semo/plugins
extendDir: bin/semo/extends
scriptDir: bin/semo/scripts
hookDir: bin/semo/hooks
```

:::tip
插件里没有插件目录的原因是我们不支持在插件里定义插件这种嵌套的声明方式，但是我们支持在项目里定义插件。
:::

除了配置一些目录之外，我们还可以配置一些覆盖命令的选项，比如上面提到的 `repl` 命令选项覆盖：

```yml
hook: true
```

再比如：`semo init` 命令有个选项 `--typescript`，如果加了这个选项初始化目录结构，项目配置里也会有对应的覆盖配置，这样在执行 `semo generate` 命令时，我们很多代码生成命令都是同时支持 `js` 和 `ts` 两个版本的，通过这个选项会让所有的代码自动生成时都是 `typescript` 风格。

```json
typescript: true
```

在项目配置里配置的选项覆盖仅在当前项目目录生效。这里只是演示用法，实际上我们后面都可以在插件开发时提供多种选项，在项目使用插件时对行为进行限定，以同时支持实现灵活性和个性化。

## 隐藏配置

`Semo` 有一些隐藏选项，平时很少使用，可以通过 `semo help --show-hidden` 查看：

```
选项：
  --script-name                                       Rename script name.                    [字符串] [默认值: "semo"]
  --plugin-prefix                                     Set plugin prefix.                              [默认值: "semo"]
  --disable-core-command, --disable-core              Disable core commands.
  --disable-completion-command, --disable-completion  Disable completion command.
  --hide-completion-command, --hide-completion        Hide completion command.
  --disable-global-plugin, --disable-global-plugins   Disable global plugins.
  --disable-home-plugin, --disable-home-plugins       Disable home plugins.
  --hide-epilog                                       Hide epilog.
  --set-epilog                                        Set epilog.                                        [默认值: false]
  --set-version                                       Set version.
  --node-env-key, --node-env                          Set node env key                              [默认值: "NODE_ENV"]
```

可以看到，通过传这些选项我们可以改变一些核心的行为，甚至连自己的命令名称和版本都可以改掉。这里重点说一下其中的两个：

```yml
--disable-global-plugin: true
--disable-home-plugin: true
```

我们一般在项目配置中加上这两个配置，使得在做插件和钩子扫描时可以只扫描当前项目目录，可以稍微提高一点命令的性能。

:::tip
在 Semo 配置环境里以下配置是完全等价的
--foo-bar
--foo--bar
--fooBar
foo-bar
fooBar
:::

## 通过命令行修改配置

我们当然可以通过编辑配置文件的方式修改配置，但是 Semo 也提供了编辑配置的命令行工具，在命令行工具的帮助下，就可以用脚本的方式定制某些配置了。

```
semo config set a.b.c d 'some comment' -g
semo config get a.b.c
semo config del a.b.c
semo config list
semo config list --watch
```

## 应用环境配置

> 此特性 `v0.8.0` 引入

在应用目录（一般是指运行 semo 命令的当前目录），我们会用 Semo 的机制组织我们的项目代码，比如命令行工具，计划任务，钩子扩展，命令扩展，脚本等等。之前系统只能识别 `.semorc.yml` 这个配置文件，最新的版本已经可以继续加载一个环境配置，比如当前 `NODE_ENV=development`(默认值)，则 `.semorc.development.yml` 如果存在也会识别和加载，并会覆盖主配置的同名配置（用的是 Lodash 的 `_.merge`）

## 特殊配置项

> 此特性 `v0.9.0` 引入

Semo 的配置和命令行的 `argv` 是紧密耦合在一起的，argv 原本的意图只是存储命令行参数，Semo 进一步扩展，希望其能承担项目配置管理的重任，这里约定了几个 `$` 开头的配置，有特殊的含义：

### `$plugin`

这个配置约定了插件级别的配置项，以前命令只能通过参数来约定配置，但是有一些复杂的配置，没有必要声明成参数，所以设计了这个配置项：

以 `$plugin.ssh.key = 1` 举例，意思是给 `semo-plugin-ssh` 这个插件下的每个命令都提供了一个配置 `key=1`， 那这个配置到那里去取呢，Semo 已经帮助装配到 `argv.$config` 了，所以你在 ssh 插件的命令下取到的 `argv.$config` 就都是 `$plugin.ssh` 下的配置。

为了实现这一点，每个命令在声明的时候，添加了一个 `export const plugin = 'ssh'` 这样的声明。

### `$plugins`

上面的 `$plugin` 是给每个具体的插件添加配置的，而这个是决定整个环境生效的插件的，支持三个配置

* `$plugins.register` 决定是否启用主动注册机制，如果启用，则自动扫描机制失效。参考[插件的主动注册机制](../plugin/README.md)
* `$plugins.include` 对注册的插件进行二次过滤，这个是允许名单，是数组，支持插件名的简写形式。
* `$plugins.exclude` 对注册的插件进行二次过滤，这个是禁止名单，是数组，支持插件名的简写形式。

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