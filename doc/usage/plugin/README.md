# 插件

在 `基础->插件开发` 小节，已经介绍了插件开发的方法和注意事项，这里主要是介绍一些为什么开发插件，什么时候开发插件。

## 业务插件

首先，如果没有插件， `Zignis` 内置的几个命令对大家也没有多大用处，所有的价值都需要通过扩展 `Zignis` 释放，其中插件就是最重要的一种形态。插件里最常见的就是定义命令，这不奇怪，因为 `Zignis` 本身就是个命令，也被设计为命令行开发框架。这里的重点是命令可以定义到插件中，而插件作为独立的 Node 模块可以发布到 `npm` 或公司自建的 `registry`，从而使得一个命令可以被安装到多个项目。

我们很难保证一个项目可以在公司所有的项目中都有用，但是相同业务线的不同项目中是有可能有交集的，我们可以通过对插件名进一步规范来划分插件的适用范围，例如：

```
zignis-plugin-[公司标识]-[业务线标识]-[用途标识]
```

## 创新插件

另外，之前的文档中也提到，我们也可以开发非业务属性的插件，只要自己觉得有趣，有想法，都可以试试，例如：

```
zignis-plugin-music-download
zignis-plugin-video-download
zignis-plugin-todolist
zignis-plugin-puzzle-me
zignis-plugin-convert-a-to-b
```

上面只是随便起一些名字，其实这些插件还都不存在。

## 本地插件

不是所有的插件都必须要发布到 `npm` 的，我们可以开发很多只有自己知道的插件，满足自己的需求，这种插件一般都是放到 `~/.zignis/node_modules` 的，这样可以在当前账户的任意位置调用。

## 社区插件

目前我已知的插件一部分是开源的，一部分是公司内部仓库的，现在把开源的插件列出来，供大家参考。

- [zignis-plugin-ssh](https://github.com/vipzhicheng/zignis-plugin-ssh): 一个管理 SSH 账户的插件，支持添加，列表，删除，搜索，登录等操作
- [zignis-plugin-serve](https://github.com/vipzhicheng/zignis-plugin-serve): 一个 Web 服务插件，支持静态资源也支持动态接口，基于 `Koa`
- [zignis-plugin-zhike](https://github.com/zhike-team/zignis-plugin-zhike): 整合了公司的基础设施，其中鉴权是走的是配置管理服务，这个插件只负责自动连接和暴露方法
- [zignis-plugin-zhike-dingtalk](https://github.com/zhike-team/zignis-plugin-zhike-dingtalk): 整合了钉钉的 Webhook，可以快速给钉钉群发消息
- [zignis-plugin-read](https://github.com/vipzhicheng/zignis-plugin-read): 借助各种开源项目实现的把一个网页主体转成各种各样常用的格式

