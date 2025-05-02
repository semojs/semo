# Plugins

In the `Basics -> Plugin Development` section, the methods and precautions for plugin development have already been introduced. This section primarily introduces why and when to develop plugins.

## Business Plugins

Firstly, without plugins, `Semo`'s few built-in commands aren't very useful to everyone. All value needs to be unlocked by extending `Semo`, with plugins being the most important form. The most common function within plugins is defining commands. This isn't surprising, as `Semo` itself is a command and is designed as a command-line development framework. The key point here is that commands can be defined within plugins. As independent Node modules, plugins can be published to `npm` or a company's self-built `registry`, enabling a command to be installed across multiple projects.

It's hard to guarantee that a plugin will be useful across all of a company's projects, but different projects within the same business line might have overlaps. We can further standardize plugin names to delineate their scope of applicability, for example:

```
semo-plugin-[CompanyIdentifier]-[BusinessLineIdentifier]-[PurposeIdentifier]
```

## Innovative Plugins

Additionally, as mentioned in previous documentation, we can also develop non-business-related plugins. As long as you find it interesting and have an idea, feel free to try it out, for example:

```
semo-plugin-music-download
semo-plugin-video-download
semo-plugin-todolist
semo-plugin-puzzle-me
semo-plugin-convert-a-to-b
```

The names above are just examples; these plugins don't actually exist yet.

## Local Plugins

Not all plugins need to be published to `npm`. We can develop many plugins known only to ourselves to meet personal needs. These plugins are typically placed in `~/.semo/node_modules`, making them callable from anywhere within the current user account.

## Community Plugins

If you are satisfied with your plugin creation and want to share it with others, you can publish it to `npm` and let others know about it. Of course, since `Semo` primarily acts as a command dispatcher, there's a high probability you don't necessarily need to base such `npm` packages on `Semo`, unless you're a `Semo` fan ^\_^.

So, what community plugins are currently available? The community isn't fully established yet, and plugins are still relatively few, including but not limited to the following: (Here, 'core' refers to plugins maintained in the core repository alongside `@semo/core`)

- **semo-plugin-application**, [Core] Defines a specification for adding subcommands to a Node project.
- **semo-plugin-script**, [Core] Defines a script specification usable within a Node project.
- **semo-plugin-plugin**, [Core] Provides command-line tools for managing Semo global plugins.
- **semo-plugin-shell**, [Core] Provides a simple command-line environment to reduce typing.
- **semo-plugin-hook**, [Core] Allows viewing hook-related information.
- **semo-plugin-ssh**, [Extension] Provides simple `SSH` account management functionality.
- **semo-plugin-read**, [Extension] Provides tools to convert URLs into `Markdown`, and subsequently into various other formats.
  - **semo-plugin-read-extend-format-wechat** This is an extension for the read plugin, providing functionality for an online editor for WeChat official account articles. Needs to be used with read.
  - ... There might be many related sub-plugins here, not listed individually.
- **semo-plugin-serve**, [Extension] Provides a simple `HTTP` server functionality, similar to `serve`.
- **semo-plugin-sequelize**, [Extension] Provides integration with `Sequelize` to offer database access capabilities.
- **semo-plugin-redis**, [Extension] Provides integration with `Redis` to offer cache access capabilities.
