---
layout: home

hero:
  name: Semo
  text: 不止脚手架
  tagline: 统一风格的命令行脚本解决方案
  actions:
    - theme: brand
      text: 快速上手 →
      link: /guide/quickstart/
features:
- title: 一致
  details: 不管Node项目使用何种框架，或者如何抽象分层，都可以使用本框架来实现统一风格的命令行脚本。
- title: 可扩展
  details: 插件可以扩展，命令可以覆写，配置可以覆盖，使用钩子机制，可以与内置或第三方插件定义的钩子交互。
- title: 高效
  details: 因为规则简单，所以开发效率高，因为使用频繁，所以工作效率高。

---

```bash
# 对于本地环境，一般推荐全局安装
npm install -g @semo/cli
semo help

# 首次在项目中整合
cd YOUR_PROJECT
npm install @semo/cli
semo init
semo generate command test

# 使用 application 命令行规范
npm install semo-plugin-application
semo generate command application/test --extend=application
```