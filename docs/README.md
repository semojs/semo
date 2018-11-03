# 基础

Zignis 不是一个英文单词，其由两部分，`Z` + `ignis`，Z 是智课的智的首字母，ignis 是火种的拉丁文单词。所以，意思就很明显了，就是想做一个基础的项目，作为公司的火种，让星星之火可以燎原。

## 快速开始

### 安装

```
npm i -g zignis
```

Zignis 作为一个调度所有子命令的入口，一般建议全局安装，但是如果没有全局安装的权限，也可以安装到项目目录，或者 `$HOME` 目录的 `.zignis` 目录，`$HOME/.zignis` 目录是个特殊的目录，用于实现默认配置或者全局插件。如果安装到 `$HOME/.zignis` 目录，则需要自己在 .bashrc 或 .zshrc 的文件里配置 alias。如果是安装到项目目录，为了方便使用，需要在 `package.json` 中配置 `npm scripts`。

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

Zignis 命令自带了一个插件，用于在执行任何命令时随机展示智课十诫，通过 `--disable-ten-temporarily` 可以临时关闭。

## 命令说明

!> 注意：文档命令说明部分因为活跃开发，可能会滞后和不那么准确，请直接安装最新版本尝试这些命令

### zignis

### zignis new

```
zignis new <name> [repo][branch]

Create a new project from specific repo

选项：
--version 显示版本号 [布尔]
--repo repo url to clone [默认值: ""]
--branch repo branch to clone [默认值: "master"]
--yarn use yarn command [默认值: false]
--yes, -y use yarn command [默认值: false]
```

## 设计原则

**有用**

- 让开发能够快一些
- 让日常工作更有效率

**三层命令结构**

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

配置

## 开发插件

```

```
