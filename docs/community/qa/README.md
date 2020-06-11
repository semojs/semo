---
sidebar: auto
---
# 常见问题

## `Semo` 怎么这么慢，怎么优化？

相对于一些逻辑比较简单纯粹的脚本，Semo 考虑了很多灵活性的设置，包括但不限于插件的多层扫描，配置的覆盖规则，钩子机制等等，其中影响最大的是插件扫描的 IO负担，目前经过一些优化（引入内部缓存）已经有一些效果，后面如果把插件扫描结果彻底持久化，是可以进一步提升性能的，但是是双刃剑，还需要考虑更新机制，后面会持续优化。

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




