# 快速上手

## 全局安装

`Semo` 命令行工具同时也是一个辅助工程师日常开发，运维和调试的命令行工具，建议你在本地环境全局安装，具体的使用说明可以参考[这里](https://semo.js.org)。

```
$ npm i -g semo
$ semo help

semo [命令]

命令：
  semo application                 Application command namespace.                                       [aliases: app]
  semo hook                        Show hook info
  semo init                        Init basic config file and directories                                 [aliases: i]
  semo make <component>            Generate component sample code                               [aliases: generate, g]
  semo new <name> [repo] [branch]  Create a new project from specific repo                                [aliases: n]
  semo repl                        Play with REPL                                                         [aliases: r]
  semo script [file]               Execute a script                                                     [aliases: scr]
  semo shell                       Quick shell                                                           [aliases: sh]
  semo status                      Show environment status info                                          [aliases: st]
  semo completion                  Generate completion script

选项：
  --version   显示版本号                                                                                          [布尔]
  -h, --help  显示帮助信息                                                                                        [布尔]

Find more information at https://semo.js.org
```

可以看到里面有很多的内置命令，但是，需要注意的是，这些命令都是有使用场景的，在不配合任何插件和具体的业务项目时对大家的帮助不会很大，因为 `Semo` 核心在开发过程中，主要放在定义扩展规范，具体的业务逻辑需要自己去实现，而只有配合具体的业务逻辑进去才能进一步体现 `Semo` 的作用和价值。

## 项目集成

`Semo` 的主要使用场景就是为一个已经存在的业务项目添加命令行机制，如果没有 `Semo`，各个业务项目当然也是可以开发出自己的命令行的，但是这部分基本都属于重复投入，而且不同的团队实现的方案肯定是有差异的，这种差异带来的是维护成本的增加，而企业级开发，降低成本就是提高利润。

```
cd YOUR_PROJECT
npm install semo
semo init
```

业务项目集成 Semo 必须要将 `Semo` 添加为项目依赖，但是具体放到 `devDependencies` 还是 `dependencies`，需要根据实际情况而定，在业务项目使用 `Semo` 的时候有几种使用模式：

- 业务项目服务核心逻辑依赖 `Semo`，这种侵入式的，必须添加到 `dependencies`。
- 业务项目服务核心逻辑不依赖 `Semo`，但是有使用 Semo 来定义命令行或者脚本，而脚本需要在线上执行：这种是非侵入式的，但是由于要在线上执行，也需要添加到 `dependencies`。
- 业务项目服务核心逻辑不依赖 `Semo`，也没有使用 `Semo` 来定义命令行或脚本，仅仅是用了 REPL 的扩展机制，将项目的公共类和函数放到 `REPL` 环境来协助开发调试，这种也是非侵入的，而且不需要在线上执行，所以可以放到 `devDependencies`。

### 添加一个项目命令

这里要考虑的是未来项目命令行工具的规划，如果很多，最好划分一下层次，另外，第一层子命令是一些核心命令，如果我们的命令都放到第一层，会容易混淆和误用。


**定义一个一级子命令**



```
semo make command test
semo test # 执行刚刚添加的命令
```

**定义一个二级子命令**

```
semo make command application/test --extend=semo
semo application test
```

为了让项目命令和核心以及插件定义的命令隔离，这里推荐的是将项目命令用上面第二种方式添加，同时如果是复杂的项目，还可以继续分层次。当然这样造成了一个问题就是命令的层次增加导致的记忆负担，以及要多输入很多前面的命令才能找到要执行的命令。所以一般，我们在项目里还需要为运行环境的 `bashrc` 增加几个 `alias`:

**假设线上环境是用 Docker 容器部署的**

```
// Dockerfile
RUN echo 'alias semo="npx semo"' >> /home/node/.bashrc
RUN echo 'alias app="npx semo app"' >> /home/node/.bashrc
```

这面的命令演示了缩减命令长度的方法，在实际使用过程中，如果命令分层特别深，这里可以多定义一些 `alias`。

## 开发插件

如果不是在项目中使用 `Semo`，仅仅是要快速实现一些脚本命令，帮助自己提高工作效率，这时你可以使用 `Semo` 快速开始。

```
cd ~/.semo/node_modules # 这个目录下定义的插件会全局加载
semo new semo-plugin-xxx --select=plugin # 选择插件模板
cd semo-plugin-xxx
semo hi # # 默认里面有一个示例命令
code . # 用 Vscode 开始开发
yarn watch # 基于 `Typescript` 开发，需要实时编译
```

如果你对插件很满意，想和其他人分享，你直接将你的代码发布到 `npm`。

```
git remove add origin GIT_REPO_URL
git add .
git commit -m 'init'
npm login
npm version patch && npm publish
```

:::warning
注意，`Semo` 不保证每个插件定义命令的隔离性，所以如果插件安装的多了，可能会有些命令因重名而相互覆盖，但是日常使用中很少有这种情况发生，为了简单，这里没有做特殊的设计。
:::

## 安装别人开发的插件

如果打开 package.json，你会发现在插件模板里，`semo` 放在了 `peerDependencies`，也就是所有的插件如果要生效，需要和 `semo` 一起安装。

```
npm i -g semo semo-plugin-xxx
```

如果别人的插件仅仅是定义了一些你需要的命令，则你可以把命令安装在全局，如果别人的插件在业务项目中要用，则要放到项目依赖当中。

```
cd YOUR_PROJECT
npm install semo-plugin-xxx
yarn add semo-plugin-xxx // 或
```

由于 `Semo` 的插件同时也是一个 `Node` 模块，因此，我们也可以在插件中定义一些库函数，被别人在项目中引入

```js
import lib from 'semo-plugin-xxx'
```

利用 `Semo` 提供的钩子机制，也可以使用另一种风格来使用插件提供的业务逻辑支持。

```js
import { Utils } from 'semo'

const { xxx } = await Utils.invokeHook('components')
```

可以看到，在后面这种方式中，不需要显示引入包，只需要安装了即可，这种方式是使用的目录扫描的方式，性能是比较差的，而且没有IDE自动提示的支持，但是对命令行这个场景来说，代码风格简单统一也不错。


