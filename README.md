# What's Zignis?

Zignis is a command-line tool framework, based on [Yargs](https://www.npmjs.com/package/yargs). It can be used to make your commands and scripts interact with your project.

# Features

- Less concepts(command, plugin, hook, config), but more powerful.
- All of plugins, commands, configs can be overridden in conventional order.
- Easily register a command to Zignis, so you can combine your team toolbox or workflow to Zignis
- A plugable REPL, it's not just like native node REPL, you can hook anything into REPL, which is also support yield and await.
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

越努力，越幸运：努力到无能为力，拼搏到感动自己。 -- 智课十诫

zignis

Command：
  zignis init                        Init basic zignis config file and directories     [aliases: i]
  zignis make <template>             Generate component sample code                  [aliases: m]
  zignis new <name> [repo] [branch]  Create a new project from specific repo          [aliases: n]
  zignis repl                        Play with REPL                                  [aliases: r]
  zignis script [file]               Execute a script                                [aliases: scr]
  zignis status                      Show Zignis status                              [aliases: st]

Option：
  --version                  显示版本号                                   [boolean]
  -h, --help                 显示帮助信息                                 [boolean]
  --disable-ten-temporarily                                      [default: false]
```

Please refer to the documentation to learn how to use Zignis, because you need to do the integration by yourself to make Zignis work for your project.

# Documentation

- [Chinese(中文)](https://zignis.js.org/)
- [English(英文)], TBD

# License

MIT
