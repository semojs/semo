# 基础

Zignis 不是一个英文单词，其由两部分，`Z` + `ignis`，Z 是智课的智的首字母，ignis 是火种的拉丁文单词。所以，意思就很明显了，就是想做一个基础的项目，作为公司的火种，让星星之火可以燎原。

## 快速开始

### 安装

```
npm i -g zignis
```

Zignis 作为一个调度所有子命令的入口命令，一般建议全局安装，但是如果没有全局安装的权限，也可以安装到项目目录，或者 `$HOME` 目录的 `.zignis` 目录，`$HOME/.zignis` 目录是个特殊的目录，用于实现默认配置或者全局插件。如果安装到 `$HOME/.zignis` 目录，则需要自己在 .bashrc 或 .zshrc 的文件里配置 alias。如果是安装到项目目录，为了方便使用，需要在 `package.json` 中配置 `npm scripts`。

### 帮助信息

```
$ zignis --help
做一个传递正能量的人，不要抱怨。 -- 智课十诫

zignis [命令]

命令：
zignis init Init basic zignis config file and directories [aliases: i] # 初始化项目的基本 Zignis 配置文件和目录
zignis make Generate component sample code [aliases: m] # 自动生成组件初始代码
zignis new <name> [repo][branch] Create a new project from specific repo [aliases: n] # 初始化新项目
zignis repl Play with REPL [aliases: r] # 进入 REPL 命令行交互模式
zignis script [file] Execute a script # 执行脚本
zignis status Show Zignis status. alias: st [aliases: st] # 查看基本信息和状态

选项：
--version 显示版本号 [布尔]
-h, --help 显示帮助信息 [布尔]
--disable-ten-temporarily [默认值: false]
```

Zignis 命令自带了一个插件，用于在执行任何命令时随机展示智课十诫，通过 `--disable-ten-temporarily` 可以临时关闭。这个效果的目的一方面是演示一下插件的写法，另外一方面也是希望通过将智课十诫与工程师的日常工作联系起来，对公司企业文化在技术部门落地有促进作用。

## 命令说明

!> 注意：文档命令说明部分因为活跃开发，可能会滞后和不那么准确，请直接安装最新版本尝试这些命令

### zignis init

```
zignis init

Init basic zignis config file and directories
```

### zignis new

```
zignis new <name> [repo][branch]

Create a new project from specific repo

选项：
--repo repo url to clone [默认值: ""]
--branch repo branch to clone [默认值: "master"]
--yarn use yarn command [默认值: false]
--yes, -y use yarn command [默认值: false]
```

### zignis make

```
zignis make

Generate component sample code

命令：
  zignis make command [name] [description]  Generate a command template
```

### zignis repl

```
zignis repl

Play with REPL
```

这个命令会进入 node 交互模式，与普通的 node 交互模式相比，不同的地方在于可以让 Zignis 插件为 REPL 注入变量，可以是普通的变量，也可以是一些方法，同时支持 await 和 yield。 REPL 模式的 hook 是 `repl`，具体 hook 方式请看进阶部分的钩子扩展方式。

### zignis status

```
zignis status

Show Zignis status. alias: st
```

### zignis script

```
zignis script [file]

Execute a script
```

## 设计原则

**有用**

- 让开发能够快一些
- 让日常工作更有效率一些

**多层命令结构**

- 内置命令
- npm 包插件命令
- 应用扩展命令

通常 Node 项目都是微服务架构，会起很多后端服务项目，每个项目的架构多少会有一些不一致，如果有一个命令行工具架构，能让整个架构在命令行操作层面进行统一，那么就可以复用很多经验，在已经不一致的架构下提升整个技术团队的效率。更进一步来说，据我观察，很多项目都是不具备命令行机制的，因此很多操作还在用更笨拙的方式进行，如果能引入到项目中，能够很快帮助建立起常用操作命令，提高对项目的掌握程度。

**扩展性**

- 插件可以分享
- 插件可以覆写
- 插件可以通过钩子影响核心行为
- 插件可配置

# 进阶

## 扩展机制

Zignis 有多重扩展机制，只为了能得到良好的扩展性，满足各种需要。

### 配置扩展

在 Zignis 的架构下，配置统一都使用 .zignisrc.json 文件保存，采用了类似于模块的查找方式，也有自己的特殊考量，整个配置的覆盖关系如下：

- $HOME/.zignis/.zignisrc.json # 家目录的配置文件用于保存默认配置，同时也可以提供配置的覆盖机制
- 插件目录下的 .zignisrc.json 的配置
- 应用目录的 package.json 的配置
- 应用目录的 .zignisrc.json 的配置

配置是自下而上的次序覆盖，插件的配置和插件一样有多层优先级次序，插件的加载层级关系可以参考插件小节，每个插件下面都可以有一个 .zignisrc.json 配置。

### 命令扩展

应用目录可以有一个 `extendDir` 目录，可以在此目录扩展一些可以扩展的插件，比如内置命令的 `make` 命令，默认只有一个 command 子命令，我们可以在应用的 extendDir 目录添加应用相关的 make 子命令，例如生成控制器文件的 controller 子命令，生成模型文件的 model 子命令。

创建子命令时只要目录结构符合 $extendDir/zignis/make/subcommand.js，就可以实现 zignis make subcommand 子命令了。

### 钩子扩展

## 开发插件

Zignis 的插件的命名必须是 `zignis-plugin-*` 这样的格式；开发插件之前需要先了解插件的加载次序，因为这决定了相同命令的覆盖次序。插件的加载顺序从上到下如下：

- Zignis 内置插件
- 跟 Zignis 同级的插件，这个目录使得插件 global 安装成为可能
- $HOME/.zignis/node_modules 这里的插件可以理解成跨项目全局生效的插件，是应用无关的
- 应用的 node_modules 目录里的插件
- 应用的 config.pluginDir 插件目录
- [optional] 如果当前目录刚好是一个插件，则会最后加载，这会获得最高的优先级，从而可以在开发插件时覆盖正常安装时的优先级。

每个插件都有自己的插件配置，并且可以按照这个顺序进行覆盖合并，合并方法用的是 `lodash` 的 `_.merge`。

我们开发插件可能有两种情况，一种是想开发一个可以在几个项目中复用的插件或者开发一个项目无关的通用插件，另一种是开发一个仅用于当前应用的插件。当然，我们实现插件可以先实现应用级的插件，在认为时机成熟时发布成 npm 包，从而实现跨项目的复用。

开发插件有两个目的：

1. 实现一些子命令，用于实现快捷操作
2. 实现一些钩子，用于参与核心或者其他命令的执行流程

### 创建一个插件

这里以实现应用级插件为例，在没有插件基础设施的项目里，首先要进行初始化：

```
zignis init
```

init 命令还有一个参数是 `--plugin`，当明确知道是为开发复用插件，则应该加上这个参数。上面的 init 命令执行之后，会在 `./bin/zignis` 目录下初始化几个目录：`plugins`, `extends`, `commands`。需要考虑的是如果明确知道我们要开发的

### 创建一个命令

Zignis 里的按顺序加载的，除了配置和插件之外，还有一个就是命令，这几个概念之间有很多关联关系，又有差别，命令的加载顺序如下：(仍然是自上而下加载，自下而上覆盖)

- 加载核心命令
  - 如果当前是在开发 Zignis 项目自己，则以当前项目的命令为主，而不会加载全局环境安装的 Zignis 的命令
- 加载插件里的命令
- 加载当前应用中的命令

假设我们是在项目的 `./bin/zignis/commands` 中创建命令，则执行一下命令即可：

```
zignis make command
```

这里生成的命令文件，文件格式是基于 `yargs` 的，我们可以基于自动生成的代码再做扩展。

### 实现一个钩子

目前已知的核心钩子如下，另外第三方插件也可以定义自己的钩子

**repl**
**status**
