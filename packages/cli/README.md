# What's Semo?

Semo is a command-line tool framework, based on [Yargs](https://www.npmjs.com/package/yargs). It can be used to make your commands and scripts interact with your project in same way.

# Features

- Less concepts(command, plugin, hook, config), but more powerful.
- All of plugins, commands, configs can be overridden in conventional order.
- Easily register a command to Semo, so you can combine your team toolbox or workflow to Semo
- A plugable REPL, it's not just like native node REPL, you can hook anything into REPL, which is also support **await** promise or generator functions.
- Ability to extend command's subcommands in other plugins.
- Provide a simple code generator mechanism.
- Support npm organization plugins.

# Principles

- Consistency
- Flexibility
- Efficiency

# Installation & Usage

```
$ npm i -g @semo/cli
$ semo help

semo [命令]

命令：
  semo completion                     Generate completion script
  semo create <name> [repo] [branch]  Create a new project from specific repo                               [aliases: c]
  semo generate <component>           Generate component sample code                                        [aliases: g]
  semo init                           Init basic config file and directories                                [aliases: i]
  semo repl                           Play with REPL                                                        [aliases: r]
  semo run <PLUGIN> [COMMAND...]      Run any plugin command directly
  semo status                         Show environment status info                                         [aliases: st]

Options:
  --version   显示版本号                                                                                          [布尔]
  -h, --help  显示帮助信息                                                                                        [布尔]

Find more information at https://semo.js.org
```

Please refer to the documentation to learn how to use Semo, because you need to do the integration by yourself to make Semo work with your project.

# Documentation

- https://semo.js.org
- English version TBD.

# Requirements

- Node > v8.0

# License

MIT
