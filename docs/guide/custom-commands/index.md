# Custom Commands

Whether developing `Semo` plugins or building applications and tool scripts based on `Semo`, adding `Semo` command lines is almost unavoidable before encapsulating plugins. To achieve a smooth development experience, `Semo` has been continuously optimizing the entire process, and this is still ongoing. This article explains how to define commands under `Semo`.

## Preparation Phase

As will be mentioned later, we don't need to create command code templates ourselves; it's entirely repetitive work. Therefore, a command-line code generator is provided. But where should this code be placed? First, it needs to be declared. The configuration file recognized by `Semo` here is `.semorc.yml`, and the effective configuration is `commandDir`. Sometimes the project is based on TS, requiring configuration of a TS command-line directory `commandMakeDir`. Sometimes you are writing subcommands for commands defined by other plugins; in this case, the corresponding `extendDir` and `extendMakeDir` need to be defined.

Taking plugin development as an example, the configuration file is roughly as follows:

```yml
typescript: true

commandDir: lib/commands
commandMakeDir: src/commands
extendDir: lib/extends
extendMakeDir: src/extends
```

## The Command for Creating Commands

`Semo` has a built-in code generation mechanism, including a code generation command for adding new commands:

```
semo generate command COMMAND_NAME COMMAND_DESCRIPTION
```

## Command-line Code Template Example

Here is an example using the TS version command:

```bash
semo generate command test 'test description'
```

```typescript
export const disabled = false // Set to true to disable this command temporarily
// export const plugin = '' // Set this for importing plugin config
export const command = 'test'
export const desc = 'test description'
// export const aliases = ''
// export const middlewares = (argv) => {}

export const builder = function (yargs: any) {
  // yargs.option('option', { default, describe, alias })
  // yargs.commandDir('test')
}

export const handler = async function (argv: any) {
  console.log('Start to draw your dream code!')
}
```

As you can see, compared to commands in the yargs framework, there are some differences. Since `Semo` is based on `yargs`, the differences here are customizations based on `yargs`'s extensibility.

## Explanation of Command-line Attributes

### `disabled` or `disable`

This indicates whether the command is disabled. When disabled, it is not only invisible but also inactive. Mainly used in scenarios where you want to disable a command without deleting the code.

### `command`, `desc`, `aliases`, `builder`, `handler`

These attributes are part of the `yargs` command specification and are easy to understand, requiring no further explanation. You can refer to the [yargs related documentation](https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module)

`desc` can also be written as `description` or `describe`.

### `middlewares`

Yes, middlewares are supported here. The benefit is that you can extract similar processing logic into middlewares and reuse the code across multiple commands. Generally needed only in complex business scenarios.

### `plugin`

This is an attribute specific to `Semo` plugins. If you define a command within a plugin, declaring this allows you to retrieve specific configurations from the global configuration file via `Utils.pluginConfig`.

~/.semo/.semorc.yml

```yml
$plugin:
  test:
    a: 1
```

In the code, you can:

```
const a = Utils.pluginConfig('a', 1)
```

Internally, it will calculate which plugin's configuration to retrieve the value from.

## Regarding Subcommands

Notice the line in the code template:

```
yargs.commandDir('test')
```

The effect of this line is to look for subcommands in the `test` directory. There is a drawback here: when a plugin wants other plugins to extend this subcommand, other plugins cannot do so. How can it be done? `Semo` has wrapped this method.

```typescript
const argv = await yargs.argv
await argv.$core?.extendSubCommand('test', 'semo-plugin-test', yargs, __dirname)
```

The key here is that the first two parameters must be filled in correctly. Then, how do other plugins extend the subcommand? When creating the command, write it like this:

```
semo generate command test/subcommand --extend=semo-plugin-test
```
