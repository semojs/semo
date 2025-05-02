---
sidebar: auto
---

# 常见问题

## `Semo` 有点慢，怎么优化？

相对于一些逻辑比较简单纯粹的脚本，Semo 考虑了很多灵活性的设置，包括但不限于插件的多层扫描，配置的覆盖规则，钩子机制等等，其中影响最大的是插件扫描的 I/O 负担，目前经过一些优化已经有一些效果。

另外，到目前为止，都在探索 `Semo` 在业务开发中的各种可能性，暂时性能问题影响并没有那么大，所以更倾向于投入在探索和兼容各种可能性上。

通过缩小插件扫描范围可以进一步提速：

```
semo status --disable-global-plugin --disable-home-plugin
```

如果不想每次都输入，可以放到 `.semorc.yml` 文件当中：

```yml
--disable-global-plugin: true,
--disable-home-plugin: true
```

或

```yml
disableGlobalPlugin: true,
disableHomePlugin: true
```

## `Semo` 可以直接运行 `Typescript` 命令么？

简单来说，不可以，如果可以的话，岂不是就成 `Deno` 啦，但是，在特殊的条件下是可以的，以下是步骤：

**1、项目中应该有 `typescript` 和 `tsx` 两个包**

这里本来也可以选择用 `ts-node`，但是经过测试 `tsx` 的兼容性更好。

```
pnpm add typescript tsx -D
```

**2、初始化 tsconfig.json**

```
npx tsc --init
```

**可以根据需要进行配置，这里最少要修改的配置如下:**

```
"target": "es6",
```

原因是，转换的代码里有 `async/await`

**3、package.json 里配置一个 scripts 命令**

```
"scripts": {
    "semo": "tsx ./node_modules/@semo/cli/lib/bin.js",
}
```

**4、修改 `.semorc.yml`**

添加对 typescript 的支持

```
typescript: true
```

**5、最后创建一个ts的命令行脚本吧**

```
semo g command test
pnpm semo test
```

最后，这种方式比较适合于定义本地命令，性能要比执行编译之后的代码要慢一些，但是开发体验较好，我们甚至可以选择完全不构建 Semo 的代码，只在 tsx 下本地执行。
