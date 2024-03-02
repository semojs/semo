# 自定义命令

不管是做 `Semo` 的插件开发，还是基于 `Semo` 来开发应用和工具脚本。其中基本无法避免的就是要添加 `Semo` 命令行，然后才是封装插件。为了实现流畅的开发体验，`Semo` 一直在不断的优化整个流程，现在也仍然在进行当中，本文就说一说如何在 `Semo` 下定义命令。

## 准备阶段

后面会说到，我们不需要自己去创建命令代码模板，完全是重复劳动，所以提供了命令行代码生成器。但是要往哪里放这些代码呢，首先需要声明。这里 `Semo` 识别的配置文件是 `.semorc.yml`，起作用的配置是 `commandDir`，有时项目是基于 ts 的，还需要配置一个 ts 的命令行目录 `commandMakeDir`，有时你是为其他插件定义的命令写子命令，这时，需要定义相应的 `extandDir` 和 `extandMakeDir`。

以插件开发为例，配置文件大致如下：

```yml
typescript: true

commandDir: lib/commands
commandMakeDir: src/commands
extendDir: lib/extends
extendMakeDir: src/extends
```

## 创建命令的命令

`Semo` 内置了代码生成的机制，并包含了新增命令的代码生成命令：

```
semo generate command COMMAND_NAME COMMAND_DESCRIPTION
```

## 命令行代码模板示例

这里以 ts 版命令为例

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

可以看到和 yargs 框架的命令相比，还是有一些不同，因为 `Semo` 是基于 `yargs` 的，所以这里的不同是基于 `yargs` 的扩展性定制的。

## 命令行的属性说明

### `disabled`

这个是标识是否有禁用这个命令，当禁用时不光看不见，也不起作用。主要是用于想禁用命令又不想说删除代码的场景。

### `command`, `desc`, `aliases`, `builder`, `handler`

这几个属性都是 `yargs` 命令规范里的，很好理解，无需赘述。可以参考 [yargs 相关文档](https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module)

### `middleware`

没错，这里是支持中间件的，好处是什么呢，就是你可以把相似的处理逻辑，提取成中间件，然后在多个命令中复用代码，一般只在复杂的业务场景下需要。

### `plugin`

这个是专属于 `Semo` 插件的属性，如果你在一个插件里定义命令，那么声明这个的好处是，你可以通过 `Utils.pluginConfig` 获取到全局配置文件里的专属配置。

~/.semo/.semorc.yml

```yml
$plugin:
  test:
    a: 1
```

在代码中可以

```
const a = Utils.pluginConfig('a', 1)
```

这里内部会计算从哪个插件配置里取值。

## 关于 `handler` 的返回值

由于 `Semo` 统一了入口，如果真的需要通过 `onFinishCommand` 回收资源的化，命令行无法直接调用，但是可以通过启用 `after_command` 这个钩子来实现。同时命令的返回值也会参与逻辑。

* return true 或 什么都不返回，效果都是执行 `onFinishCommand`
* return false，不执行 `onFinishCommand`，此时即使启用了 `after_command` 钩子也不会执行。

命令行的资源回收要交给 `after_command` 这个钩子来实现。

## 关于子命令

注意到，代码模板里有一行：

```
yargs.commandDir('test')
```

这一行的效果是去 test 目录去找子命令。这里有一个缺陷，当插件想让其他插件扩展这个子命令时，其他插件没办法做到，那怎么做呢，`Semo` 基于这个方法封装了一下。

```
Utils.extendSubCommand('test', 'test-plugin', yargs, __dirname)
```

这里重点是前两个参数要填写正确，然后其他插件怎么扩展子命令呢，在创建命令的时候这么写：

```
semo generate command test/subcommand --extend=test-plugin
```