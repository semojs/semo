# 概述

由于 `Semo` 几乎不提供任何直接的好处，所以有必要详细介绍一下如何利用好 `Semo`，从设计的初衷来说。`Semo` 被设计用来提高企业级项目开发工作的效率，那么只要项目中需要用到自定义命令或者脚本，都是 `Semo` 的用武之地。

## 从项目阶段划分

根据项目所处的阶段，`Semo` 可以在各个阶段发挥作用：

- 立项阶段：可以快速初始化项目
- 开发阶段：通过快速访问核心方法，验证方法的输入输出，封装基础设施，减少重复造轮子的情况
- 维护阶段：项目进入维护阶段，需要写大量的管理命令或者运维脚本
- 线上排查问题：线上出了BUG，但是只有线上能够重现，通过 `REPL` 可以一步步接近真相
- 线上运维：利用实现写好的脚本和命令，轻松解决需求方提出的各种要求，提高跨部门间的信任

::: warning
我们可能为项目开发一些实用的脚本和命令，但是也要知道执行脚本和命令的风险，尽量不要在生产环境执行。如果出于线上调试的目的，一定要在生产环境执行，需要精心设计脚本和命令，比如确认提示，对于一些危险操作也默认不可用，需要额外的参数来开启。还需要做好命令输入的审计。而 REPL 在线上调试也可能有使用不当的风险，所以在 REPL 中注入业务逻辑也要谨慎，尽量少注入能够写入数据和改变数据的能力，避免误操作。
:::

## 从形式上划分

`Semo` 充分考虑各种使用场景，不同的场景发挥的作用也不同：

- 开发插件：不同的插件功能不同，但代码风格一致
- 项目整合：为项目提供命令行基础设施，如果配合其他插件，甚至整个项目都可以基于 `Semo` 构建
- 解决方案：为各种业务场景提供脚手架，沉淀最佳实践，提高新项目的启动速度
- 发行版：基于解决方案进一步整合而成，构建完整可用的产品，从而产生商业价值

这里的划分方法不绝对，也没有哪个场景必须由 `Semo` 来解决，甚至，任何遇到的问题都有无数的解决方案，`Semo` 存在的目的是提供一致性，使得我们减少重复建设，提高沟通效率，沉淀最佳实践，不断夯实企业技术实力。
