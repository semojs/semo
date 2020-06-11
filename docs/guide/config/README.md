# 配置管理

`Semo` 的一个核心概念就是配置，我们可以用多种方法干预 `Semo` 的配置，从而影响核心和插件的行为。

## 全局配置

在家目录有一个全局 `Semo` 目录，里面有一个配置文件会在当前账户下全局生效，在 `~/.semo/.semorc.yml`。

这个全局配置可以对一些命令的默认值进行调整，使得实际在使用命令的时候可以不用每次都写选项，例如：

```yml
commandDefault:
  create:
    repo: REPO_URL
    branch: master
```

这里的意思是，`semo create` 命令基于模板项目初始化项目时本来应该是这么写的：

```
semo create PROJECT_NAME PROJECT_REPO_URL master -f
```

但是，因为有了默认配置，我们就可以省略两个参数，而变成：

```
semo create PROJECT_NAME -f
```

:::tip
可以看到，这里的配置是放到 `commandDefault` 这个 Key 下的，这是因为，如果配置的第一级，会对所有的命令都生效，如果这个是你希望的，就可以放到第一级。否则，可以在 `commandDefault` 下仅对单个命令生效。
:::

我们经常会用到全局配置，尤其是对一些功能命令，如果我们发现每次都要传一些参数，那么就可以通过全局配置固定下来，再举个例子：

在我们执行 `semo repl` 命令时，有个 `--hook` 参数，如果传了就会调用 `hook_repl` 从而注入一些业务逻辑进来，但是核心默认是 `--hook=false`，这样启动可以稍微快一点，但是后来发现在业务场景中每次都需要传 `--hook=true`，那么就可以把这个配置放到全局配置中。

```yml
commandDefault:
  repl:
    hook: true
```

这时，执行 `repl` 命令就会默认注入业务逻辑了。

```
semo repl
```

## 插件配置

插件目录下也有一个 `.semorc.yml` 文件，配置的文件名和原理都是类似的，但是真正能生效的配置项比较少，默认生成的只有三个

```json
commandDir: src/commands
extendDir: src/extends
hookDir: src/hooks
```

随着项目的更新，这里能够生效的配置项可能更多，目前这3个，分别控制了插件开发时的命令目录，扩展插件命令目录和钩子目录。

除了以上常用的插件配置，插件有时会对外暴露一些配置项，这些配置行一般约定除了从根取以外，还会从插件名命名空间之下取。

```yml
semo-plugin-xxx:
  foo: bar
```

这个配置的生效依赖于插件自身实现时的主动尝试获取

```js
const foo = Utils._.get(argv, 'semo-plugin-xxx.foo', argv.foo)
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