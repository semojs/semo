# 钩子机制

作为一个偏底层的命令行开发框架，是一定要有插件系统的，尤其是像 `Semo` 这种本身其实并不提供直接的业务价值的框架，而插件系统除了要为用户提供插件扫描机制，命令扩展机制，配置管理机制之外，钩子机制也是一种极大的提升灵活性和扩展性的机制，属于 `Semo` 插件系统的一部分。

钩子这种思想其实很好理解，也随处可见，比如 Windows 的开机自启动，在开机进行到某个阶段的时候，需要看一下是否有其他应用程序需要在这个时间节点一起启动。而实现这个效果肯定是需要配置的，像 Windows 这种可以配置到注册表或者配置文件。

`Semo` 的钩子机制是通过约定动态识别的，每个插件的钩子在命令执行期间确定要不要触发，因此会有磁盘 IO 和遍历方面的性能损耗，不过考虑到一般命令行执行逻辑不会特别复杂，目前认为这样也是够用的，后续如果出现复杂的钩子调用链时可以考虑优化，优化无非就是动态转静态或者通过缓存来提速。

## 钩子的定义

```js
// 定义一个 hook_bar 钩子
const hookData = Utils.invokeHook('semo-plugin-foo:hook_bar', { mode: 'group' })
```

:::info
从 `v1.0.0` 开始，钩子调用需要指明钩子前缀，即是谁创建的这个钩子，而实现这个钩子的时候也需要指名是哪个插件定义的钩子，如果不指定，当多个插件定义了同名钩子时会引起混乱。而且一旦定义方明确指定了钩子前缀，则实现方如果不指定，是识别不到的。这个规范需要定义方和实现方一起遵守。
:::

## 钩子的实现

钩子只能在指定的钩子目录才能得到识别，这个钩子目录在插件的 `.semorc.yml` 文件中配置 `hookDir`，然后识别里面的 `index.js`。

目前存在两种风格的实现钩子的方式：

第一种，将钩子前缀放到导出的 key 前缀上，中间用短横线相连。

```js
exports.semo_plugin_foo__hook_bar = () => {}
```

第二种，将钩子前缀使用 `Semo` 的内置钩子类对象的方式声明。

```js
exports.hook_bar = new Utils.Hook('semo-plugin-foo', () => {})
```

当真的有多个插件定义同名钩子时，如果恰好你也同时都需要，你还可以这样使用第二种：

```js
exports.hook_bar = new Utils.Hook({
  'semo-plugin-foo1': () => {},
  'semo-plugin-foo2': () => {},
})
```

第三方插件在实现钩子的时候，如果需要用 `Utils.Hook` 意味着需要添加 `@semo/core` 依赖，可以采用另一种风格，省掉这个依赖。

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

## 钩子的返回值

钩子实现的目的主要是为程序执行节点进行某种操作，或者提供某些信息，为了灵活性，这里支持直接返回对象 `{}`，也支持返回一个函数，甚至是一个 `Promise` 函数，如果是函数，会得到函数的执行结果再合并。 `Promise` 的钩子用途很广泛，因为这样就可以执行一些异步操作，包括但不限于数据库，网络，Redis, ES 等。

如果钩子定义的目的是搜集信息，那么定义方可能有各种合并需求，目前支持一下几种，默认是 `assign`

- assign，这种会基于返回的对象的 key 进行覆盖
- replace, 这种会相互覆盖，只保留最后一个钩子的返回值
- group，这种基于插件名进行分组
- push，这种会把所有返回值放到一个数组里，一般返回的是基本数据类型
- merge，这种会进行深度合并

## 核心内置钩子说明

由于钩子的定义方来决定钩子的用途，以及返回值格式，所以定义方有义务在明确的位置说明这些信息，让插件的使用方可以在自己的插件或者应用中进行扩展。以下是核心钩子的说明：

- `before_command`: 这个钩子在命令执行前触发，不搜集返回值
- `after_command`: 这个钩子在命令执行后触发，不搜集返回值
- `component`: 这个钩子用于搜集一些插件里定义的组件，一般是返回一个包含实例的对象，例如 `{ redis, db }`
- `hook`: 这个钩子用于声明钩子以及用途，这不是强制的，但是是一个规范，让其他人知道定义了哪些钩子
- `repl`: 用于向 repl 中注入信息，不会相互覆盖，一般用于调试，格式不固定
- `repl_command`: 让第三方插件可以扩展 repl 里的命令
- `status`: 用于向 `semo status` 命令注入新的属性信息
- `create_project_template`: 用于给 `semo create` 命令的 `--template` 参数注入可选模板

:::tip
在 `v1.15.1` 版本中，已经将 `before_command` 和 `after-command` 两个钩子设置为默认不执行。

启动命令时通过添加 `--enable-core-hook=before_command` 和 `--enable-core-hook=after_command` 来启用。
:::

部分核心钩子的用法示例

### `repl_command`

在 REPL 模式里定义一个 .hello 命令，接收参数

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

其中，`this.clearBufferedCommand()` 和 `this.displayPrompt()` 都是 Node 的 REPL 类里的方法。注意两点：一个是这里的 action 是支持 `async/await` 的，还有就是为了 `this` 能够正确指向，这里不要写成箭头函数。
