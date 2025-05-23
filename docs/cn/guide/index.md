# 介绍

Semo 是一个命令行开发框架，基于优秀的 `yargs` 包做的封装和扩展，Semo 要解决的不是如何解析命令行选项和参数，如何定义命令和触发命令这样的问题，而是对如何在业务中落地做了规范和约定，使得公司内部众多的Node 微服务项目可以有一致的命令行架构，并且在此基础上提供了各种扩展特性。

## 原则

- **一致性**: 不管Node项目使用何种框架，或者如何抽象分层，都可以使用本框架来实现统一风格的命令行脚本。
- **可扩展性**: 插件可以扩展，命令可以覆写，配置可以覆盖，使用钩子机制，可以与内置或第三方插件定义的钩子交互。
- **高效**: 上手简单，开发效率高，风格一致，维护效率高，使用频繁，工作效率高。

## 特性

- 核心概念少但是强大，包括插件，命令，脚本，配置，钩子等。
- 插件，命令，配置，都可以按照约定的方式进行扩展或者覆盖。
- 提供了一个可扩展的 REPL 环境，并且支持 `await`。
- 可以为其他插件定义的命令添加子命令。
- 提供了一个简单的代码生成的机制，基本的插件，命令，脚本样板代码可以自动生成，支持扩展。
- 支持 `npm` 组织包名格式的插件。

## 名字的由来

众所周知，起名字很难，Semo是我基于心目中火种的概念，在各个语言里翻出来的，是世界语里种子的含义，寓意起点和希望。

## 一些约定

- 所有的示例代码都是基于 `Typescript` 的，`Semo` 核心也是基于 `Typescript` 编写的，但是 `Semo` 是支持纯 `js` 编写的项目的，具体方法在配置管理小节有说明。
- 文档中默认环境已经全局安装了 `semo`，就不在具体的章节中提示了。
- 本项目的开发环境是 `Mac`，运行环境除了本机就是线上的容器环境，在 `Windows` 上没有测试过，有可能有兼容性问题。
