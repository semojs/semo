# Plugins

In the section "Basics->Plugin Development," the method and considerations for plugin development have been introduced. Here, we mainly discuss why and when to develop plugins.

## Business Plugins

Firstly, without plugins, several built-in commands in `Semo` are not very useful. All the value needs to be unleashed through extending `Semo`, and plugins are the most important form of extension. The most common feature of plugins is defining commands, which is not surprising because `Semo` itself is a command and is designed as a command-line development framework. The key point here is that commands can be defined within plugins, and plugins, as independent Node modules, can be published to `npm` or a company's custom `registry`, allowing a command to be installed in multiple projects.

It's challenging to ensure that a project is useful in all of the company's projects, but there may be intersections among different projects within the same business line. We can further standardize plugin names to delineate the scope of plugin applicability, for example:

```
semo-plugin-[company_identifier]-[business_line_identifier]-[purpose_identifier]
```

## Innovative Plugins

Additionally, as mentioned in previous documentation, we can develop plugins that are not related to business attributes. As long as they are interesting and have ideas, they can be tried, such as:

```
semo-plugin-music-download
semo-plugin-video-download
semo-plugin-todolist
semo-plugin-puzzle-me
semo-plugin-convert-a-to-b
```

The above are just random names; in fact, these plugins do not exist yet.

## Local Plugins

Not all plugins need to be published to `npm`. We can develop many plugins known only to ourselves to meet our own needs. These plugins are generally placed in `~/.semo/node_modules`, allowing them to be called from anywhere in the current account.

## Community Plugins

If you are satisfied with your plugin work and want to share it with others, you can publish the plugin to `npm` and then tell others to use it. Of course, since `Semo` only acts as a command dispatcher, in most cases, you don't necessarily have to write such `npm` packages based on `Semo`, unless you are a fan of `Semo` ^\_^.

So, what community plugins are available now? The community is still in its infancy, and plugins are relatively scarce, including but not limited to the following:

- **semo-plugin-application** - [Core] Defines a specification for adding subcommands to a Node project.
- **semo-plugin-script** - [Core] Defines a specification for scripts in a Node project.
- **semo-plugin-plugin** - [Core] Provides a global plugin management command-line tool for Semo.
- **semo-plugin-shell** - [Core] Provides a simple command-line environment to save keystrokes.
- **semo-plugin-hook** - [Core] Provides information related to hooks.
- **semo-plugin-ssh** - [Extension] Provides simple `SSH` account management functionality.
- **semo-plugin-read** - [Extension] Provides tools for converting URLs to `Markdown` and various other formats.
  - **semo-plugin-read-extend-format-wechat** - This is an extension of the read plugin, providing functionality for editing WeChat Official Account articles online, to be used with read.
  - ... There may be many related sub-plugins, which are not listed one by one.
- **semo-plugin-serve** - [Extension] Provides functionality for a simple `HTTP` server, similar to `serve`.
- **semo-plugin-sequelize** - [Extension] Integrates with `Sequelize` to provide database access capabilities.
- **semo-plugin-redis** - [Extension] Integrates with `Redis` to provide cache access capabilities.
