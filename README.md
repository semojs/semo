# What's Zignis?

Zignis is a command-line tool framework, based on [Yargs](https://www.npmjs.com/package/yargs). It can be used to make your commands and scripts interact with your project in same way.

# Features

- Less concepts(command, plugin, hook, config), but more powerful.
- All of plugins, commands, configs can be overridden in conventional order.
- Easily register a command to Zignis, so you can combine your team toolbox or workflow to Zignis
- A plugable REPL, it's not just like native node REPL, you can hook anything into REPL, which is also support await.
- Ability to extend command's subcommands in other plugins.
- Provide a simple code generator mechanism.
- Support organization plugins.

# Principles

- Consistency
- Flexibility
- Efficiency

# Installation & Usage

```
$ npm i -g zignis
$ zignis help

zignis [命令]

命令：
  zignis application                 Application command namespace.                                       [aliases: app]
  zignis hook                        Show hook info
  zignis init                        Init basic config file and directories                                 [aliases: i]
  zignis make <component>            Generate component sample code                               [aliases: generate, g]
  zignis new <name> [repo] [branch]  Create a new project from specific repo                                [aliases: n]
  zignis repl                        Play with REPL                                                         [aliases: r]
  zignis script [file]               Execute a script                                                     [aliases: scr]
  zignis shell                       Quick shell                                                           [aliases: sh]
  zignis status                      Show environment status info                                          [aliases: st]
  zignis completion                  Generate completion script

选项：
  --version   显示版本号                                                                                          [布尔]
  -h, --help  显示帮助信息                                                                                        [布尔]

Find more information at https://zignis.js.org
```

Please refer to the documentation to learn how to use Zignis, because you need to do the integration by yourself to make Zignis work for your project.

# Requirements

- Node > v8.0

# Documentation

- [Chinese(中文)](https://zignis.js.org/)
- [English(英文)], TBD

# License

MIT
