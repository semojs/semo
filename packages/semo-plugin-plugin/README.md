semo-plugin-plugin
------------------------

This plugin is used for semo to manage global plugins. It only can install or uninstall semo plugins from npm.

## Usage

```
yarn add semo-plugin-plugin
semo plugin list
semo plugin install xxx yyy
semo plugin uninstall xxx yyy
```

By default, it will install plugins to home `~/semo/home-plugin-cache/node_modules`. For local project, you should use `npm` or `yarn` to manage your local project dependencies.

