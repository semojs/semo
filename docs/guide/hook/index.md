# Hook Mechanism

As a command-line development framework that leans toward the lower level, having a plugin system is essential. This is especially true for frameworks like `Semo`, which don't inherently provide direct business value. Besides providing users with plugin scanning, command extension, and configuration management mechanisms, the hook mechanism is also a significant enhancement for flexibility and extensibility, forming part of the `Semo` plugin system.

The concept of hooks is quite understandable and ubiquitous. For instance, consider Windows startup programs. At certain stages during startup, Windows checks if any other applications need to start concurrently. Implementing this functionality certainly requires configuration, such as in the Windows registry or a configuration file.

The hook mechanism in `Semo` is convention-based and dynamically recognized. Each plugin's hooks are determined during command execution, causing some performance overhead in terms of disk I/O and traversal. However, considering that command execution logic is generally not overly complex, this approach is deemed sufficient for now. If complex hook invocation chains arise in the future, optimization may be considered, which typically involves transitioning from dynamic to static or utilizing caching for speed enhancement.

## Hook Definition

```js
// Define a hook named 'hook_bar'
const hookData = Utils.invokeHook('semo-plugin-foo:hook_bar', { mode: 'group' })
```

:::info
Starting from `v1.0.0`, hook invocation requires specifying the hook prefix, indicating who created the hook. When implementing the hook, it's necessary to specify which plugin defined the hook. Failure to specify may cause confusion when multiple plugins define hooks with the same name. Once the defining party explicitly specifies the hook prefix, the implementation party won't be recognized unless it also specifies it. Both parties need to adhere to this convention.
:::

## Hook Implementation

Hooks can only be recognized in designated hook directories, which are configured in the `.semorc.yml` file of the plugin under the `hookDir` key, and then recognized inside the `index.js`.

Currently, there are two styles for implementing hooks:

The first style prefixes the hook with the hook prefix, separated by hyphens.

```js
exports.semo_plugin_foo__hook_bar = () => {}
```

The second style declares the hook prefix using `Semo`'s built-in hook class object.

```js
exports.hook_bar = new Utils.Hook('semo-plugin-foo', () => {})
```

When multiple plugins define hooks with the same name and you need them all, you can use the second style like this:

```js
exports.hook_bar = new Utils.Hook({
  'semo-plugin-foo1': () => {},
  'semo-plugin-foo2': () => {},
})
```

For third-party plugins, if they need to use `Utils.Hook`, which requires adding a dependency on `@semo/core`, another style can be used to omit this dependency.

```js
export = (Utils) {
  return {
    hook_bar: new Utils.Hook({
      'semo-plugin-foo1': () => {},
      'semo-plugin-foo2': () => {},
    })
  }
}
```

## Hook Return Values

The main purpose of hook implementation is to perform certain operations at program execution nodes or provide certain information. For flexibility, direct object `{}` returns, functions, or even `Promise` functions are supported. If it's a function, the result of the function's execution will be merged. `Promise` hooks are widely used because they allow for asynchronous operations, including but not limited to database, network, Redis, and Elasticsearch operations.

If the purpose of a hook definition is to collect information, the defining party may have various merging requirements. Currently, the following merging methods are supported, with `assign` being the default:

- `assign`: Overrides based on the keys of the returned object
- `replace`: Mutual override, retaining only the last hook's return value
- `group`: Grouping based on plugin names
- `push`: Places all return values into an array, generally used for basic data types
- `merge`: Performs deep merging

## Explanation of Core Built-in Hooks

As the purpose and return value format of hooks are determined by the hook definition party, the defining party has the obligation to explicitly specify these details in a clear location, enabling plugin users to extend their own plugins or applications accordingly. Here are explanations of some core hooks:

- `before_command`: Triggered before command execution, does not collect return values
- `after_command`: Triggered after command execution, does not collect return values
- `component`: Used to collect some components defined in plugins, generally returns an object containing instances, for example `{ redis, db }`
- `hook`: Used to declare hooks and their purposes. While not mandatory, it's a convention that informs others of which hooks are defined
- `repl`: Injects information into the REPL, does not override each other, typically used for debugging, format is not fixed
- `repl_command`: Allows third-party plugins to extend commands in the REPL
- `status`: Injects new property information into the `semo status` command
- `create_project_template`: Injects optional templates into the `semo create` command's `--template` parameter

:::tip
Starting from `v1.15.1`, the `before_command` and `after-command` hooks are set to not execute by default.

To enable them during command startup, add `--enable-core-hook=before_command` and `--enable-core-hook=after_command`.
:::

Examples of using some core hooks

### `repl_command`

Defines a .hello command in REPL mode, accepting parameters

```js
const hook_repl_command = new Utils.Hook('semo', () => {
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
})
```

Here, `this.clearBufferedCommand()` and `this.displayPrompt()` are methods of Node's REPL class. Note two things: one is that the `action` here supports `async/await`, and the other is that for `this` to correctly point to the REPL, arrow functions should not be used.
