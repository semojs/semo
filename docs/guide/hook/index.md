# Hook Mechanism

As a low-level command-line development framework, having a plugin system is essential, especially for a framework like `Semo` which itself doesn't directly provide business value. In addition to providing users with mechanisms for plugin scanning, command extension, and configuration management, the hook mechanism significantly enhances flexibility and extensibility, forming a part of the `Semo` plugin system.

The concept of hooks is actually easy to understand and ubiquitous, for example, Windows startup programs. When the startup process reaches a certain stage, it needs to check if other applications need to start together at this point in time. Achieving this effect certainly requires configuration; for systems like Windows, this can be configured in the registry or configuration files.

`Semo`'s hook mechanism uses conventions for dynamic identification. Each plugin's hooks are determined whether to trigger during command execution, thus incurring performance overhead related to disk I/O and traversal. However, considering that command-line execution logic is generally not overly complex, this is currently considered sufficient. If complex hook call chains emerge later, optimization can be considered. Optimization typically involves converting dynamic to static or using caching to improve speed.

## Hook Definition

```js
// Define a hook_bar hook
const hookData = argv.$core.invokeHook('semo-plugin-foo:hook_bar', {
  mode: 'group',
})
```

:::info
Starting from `v1.0.0`, hook invocation requires specifying the hook prefix, i.e., who created this hook. And when implementing this hook, it's also necessary to specify which plugin defined the hook. If not specified, confusion can arise when multiple plugins define hooks with the same name. Furthermore, once the definer explicitly specifies the hook prefix, if the implementer does not specify it, it won't be recognized. This specification needs to be adhered to by both the definer and the implementer.
:::

## Hook Implementation

Hooks can only be recognized in the specified hook directory. This hook directory is configured with `hookDir` in the plugin's `.semorc.yml` file, and then `index.js` within it is recognized. If the current project is a Typescript project, the `index.ts` file will be recognized, and the `index.js` file will be ignored.

```js
export const hook_bar = {
  'semo-plugin-foo': (core, argv, options) => {},
}
```

When multiple plugins genuinely define hooks with the same name, if you happen to need both simultaneously, you can also use the second method like this:

```js
exports.hook_bar = new Utils.Hook({
  'semo-plugin-foo1': () => {},
  'semo-plugin-foo2': () => {},
})
```

## Hook Return Values

The primary purpose of implementing hooks is to perform certain operations or provide specific information at program execution nodes. For flexibility, returning an object `{}` directly, a function, or even a `Promise` function is supported. If it's a function, its execution result will be obtained and then merged. `Promise` hooks are widely used because they allow executing asynchronous operations, including but not limited to databases, networks, Redis, ES, etc.

If the purpose of defining a hook is to collect information, the definer might have various merging requirements. Currently, the following methods are supported, with `assign` being the default:

- assign: This type overrides based on the keys of the returned object.
- replace: This type overwrites each other, retaining only the return value of the last hook.
- group: This type groups based on the plugin name.
- push: This type puts all return values into an array, typically used when returning primitive data types.
- merge: This type performs a deep merge.

## Explanation of Core Built-in Hooks

Since the definer of the hook determines its purpose and return value format, the definer has the obligation to clearly state this information in a specific location, allowing users of the plugin to extend it in their own plugins or applications. Below is the explanation of the core hooks:

- `before_command`: This hook triggers before command execution, does not collect return values.
- `hook`: This hook is used to declare hooks and their purposes. It's not mandatory but is a convention to let others know which hooks are defined.
- `repl`: Used to inject information into the repl. Does not overwrite each other, generally used for debugging, format is not fixed.
- `repl_command`: Allows third-party plugins to extend commands within the repl.
- `status`: Used to inject new attribute information into the `semo status` command.
- `create_project_template`: Used to inject optional templates for the `--template` parameter of the `semo create` command.

:::tip
In version `v1.15.1`, the `before_command` hook has been set to not execute by default.

Enable it by adding `--enable-core-hook=before_command` when starting the command.
:::

Usage Examples of Some Core Hooks

### `repl_command`

Define a .hello command in REPL mode that accepts parameters.

```js
const hook_repl_command = {
  semo: () => {
    return {
      hello: {
        help: 'hello',
        action(name) {
          this.clearBufferedCommand()
          console.log('hello1', name ? name : 'world')
          this.displayPrompt()
        },
      },
    }
  },
}
```

Here, `this.clearBufferedCommand()` and `this.displayPrompt()` are both methods from Node's REPL class. Note two points: one is that the `action` here supports `async/await`, and the other is that to ensure `this` points correctly, do not write it as an arrow function.
