semo-plugin-plugin
------------------------

This plugin is used for semo to manage global and local plugins. It only can install or uninstall semo plugins from npm.

## Usage

```
yarn add semo-plugin-plugin
semo plugin list
semo plugin install xxx
semo plugin uninstall xxx
```

By default, it will install plugins to home `~/semo/node_modules`, if you want to install plugins to current project, you can use `--local` option, but mostly you will just use `npm` or `yarn` to manage your local project dependencies.

