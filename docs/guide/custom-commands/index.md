# Custom Commands

Whether it's developing plugins for `Semo` or building applications and utility scripts based on `Semo`, one thing that cannot be avoided is adding `Semo` command lines before encapsulating plugins. In order to achieve a smooth development experience, `Semo` has been continuously optimizing the entire process, which is still ongoing. This article will discuss how to define commands in `Semo`.

## Preparation Stage

As mentioned later, we don't need to create command code templates ourselves, as it would be repetitive work. Therefore, a command line code generator is provided. But where should this code be placed? First, it needs to be declared. The configuration file recognized by `Semo` here is `.semorc.yml`, and the effective configuration is `commandDir`. Sometimes, if the project is based on TypeScript, you also need to configure a TypeScript command line directory `commandMakeDir`. If you are defining commands for other plugins, you need to define the corresponding `extandDir` and `extandMakeDir`.

Taking plugin development as an example, the configuration file is roughly as follows:

```yml
typescript: true

commandDir: lib/commands
commandMakeDir: src/commands
extendDir: lib/extends
extendMakeDir: src/extends
```

## Creating a Command

`Semo` has a built-in code generation mechanism, including a command to generate code for adding new commands:

```
semo generate command COMMAND_NAME COMMAND_DESCRIPTION
```

## Example Command Code Template

Here's an example of a TypeScript-based command:

```bash
semo generate command test 'test description'
```

```typescript
export const disabled = false // Set to true to disable this command temporarily
// export const plugin = '' // Set this for importing plugin config
export const command = 'test'
export const desc = 'test description'
// export const aliases = ''
// export const middleware = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('test')
}

export const handler = async function (argv: any) {
  console.log('Start to draw your dream code!')
}
```

You can see that there are some differences compared to commands in the yargs framework because `Semo` is based on `yargs`, so these differences are customized based on the extensibility of `yargs`.

## Explanation of Command Properties

### `disabled`

This indicates whether the command is disabled. When disabled, it is not visible or functional. It's mainly used in scenarios where you want to disable a command without deleting the code.

### `command`, `desc`, `aliases`, `builder`, `handler`

These properties are all part of the `yargs` command specification and are straightforward. They can be referred to in the [yargs documentation](https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module).

### `middleware`

Yes, middleware is supported here. The advantage is that you can extract similar processing logic into middleware and reuse the code in multiple commands. It's generally needed in complex business scenarios.

### `plugin`

This is an attribute exclusive to `Semo` plugins. If you define commands within a plugin, the benefit of declaring this attribute is that you can retrieve global configuration from the configuration file using `Utils.pluginConfig`.

~/.semo/.semorc.yml

```yml
$plugin:
  test:
    a: 1
```

In the code, you can use:

```
const a = Utils.pluginConfig('a', 1)
```

Internally, it calculates from which plugin configuration to retrieve the value.

## About the Return Value of `handler`

Since `Semo` has unified entry points, if you really need to recycle resources through `onFinishCommand`, it cannot be directly called by the command line. However, you can achieve this by enabling the `after_command` hook. Additionally, the return value of the command also participates in the logic.

- Returning `true` or nothing executes `onFinishCommand`.
- Returning `false` doesn't execute `onFinishCommand`. Even if the `after_command` hook is enabled, it won't execute.

Resource recycling for command lines should be implemented using the `after_command` hook.

## About Subcommands

Note the line in the code template:

```
yargs.commandDir('test')
```

The effect of this line is to look for subcommands in the `test` directory. There is a flaw here: when a plugin wants other plugins to extend this subcommand, other plugins cannot do so. How to do it then? `Semo` encapsulates this method based on this method.

```
Utils.extendSubCommand('test', 'test-plugin', yargs, __dirname)
```

The key here is to fill in the first two parameters correctly. Then, how do other plugins extend subcommands? When creating a command, write it like this:

```
semo generate command test/subcommand --extend=test-plugin
```
