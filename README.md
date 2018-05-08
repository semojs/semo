# Zignis

Zignis is a cross-project, extensible command line tool to help building application easier.

__NOT_READY_FOR_PRODUCTION__

## Install

```
npm install -g zignis
```

## Concepts

### Plugin

Plugin is the main way to extend the power of Zignis to meet our needs. There are 3 types of plugins: 

- Core plugins
- Npm plugins
- Custom plugins

Below plugins are able to replace above plugins totally. So it is recommended to name your plugins with 
a specific prefix, and if you know what you are doing, you can override any plugins.

Plugins are normal Node modules, but need to export some hook functions, those hook functions are invoked by Zignis.

#### Plugin name convention

All plugins are all begin with: `zignis-plugin-`

#### Plugin hooks

##### `__repl__`

Plugins can expose Object/Instance to Zignis REPL by this hook.

### command

Command is everything for Zignis, we want to create more and more commands to help us do thos repeated and boring jobs.

- Core commands
- Npm commands
- Custom commands

Below commands are able to replace above commands if their name or alias same with each other. so also we need to name our commands with prefix.

Anytime you can get Zignis help by execute: `Zignis` or `Zignis --help`, here we just show some core commands:

##### `__zignis new <name> [repo] [branch]__`

Get a repo as the start point of you application. we do not want to suppose a dedicated repo, but if you do have a often used repo, you can config it in `.zignisrc.json`, and put it at your HOME directory.

example:
```
{
  "commandDefault": {
    "new": {
      "repo": "REPO url",
      "branch": "master"
    }
  }
}
```

##### `__zignis repl__`

REPL is a interactive way to play with Zignis and your application.

##### `__zignis status [key]__`

status command can tell you some Zignis and application information.


### .zignisrc.json

A way to talk with Zignis or Zignis plugins. 

- Application's .zignisrc.json
  - commandDir: locate custom commands
  - commandDefault: set default command arguments or options
  - pluginDir: locate custom plugins
    - Custom plugins can also define commands, so we put reusable plugins here and if ready we can publish these plugins to npm.
- Plugin's .zignisrc.json
  - Plugin exposed out some info in this way.



