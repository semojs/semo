(window.webpackJsonp=window.webpackJsonp||[]).push([[17],{363:function(e,v,_){"use strict";_.r(v);var s=_(42),o=Object(s.a)({},(function(){var e=this,v=e.$createElement,_=e._self._c||v;return _("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[_("h1",{attrs:{id:"插件"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#插件"}},[e._v("#")]),e._v(" 插件")]),e._v(" "),_("p",[e._v("在 "),_("code",[e._v("基础->插件开发")]),e._v(" 小节，已经介绍了插件开发的方法和注意事项，这里主要是介绍一些为什么开发插件，什么时候开发插件。")]),e._v(" "),_("h2",{attrs:{id:"业务插件"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#业务插件"}},[e._v("#")]),e._v(" 业务插件")]),e._v(" "),_("p",[e._v("首先，如果没有插件， "),_("code",[e._v("Semo")]),e._v(" 内置的几个命令对大家也没有多大用处，所有的价值都需要通过扩展 "),_("code",[e._v("Semo")]),e._v(" 释放，其中插件就是最重要的一种形态。插件里最常见的就是定义命令，这不奇怪，因为 "),_("code",[e._v("Semo")]),e._v(" 本身就是个命令，也被设计为命令行开发框架。这里的重点是命令可以定义到插件中，而插件作为独立的 Node 模块可以发布到 "),_("code",[e._v("npm")]),e._v(" 或公司自建的 "),_("code",[e._v("registry")]),e._v("，从而使得一个命令可以被安装到多个项目。")]),e._v(" "),_("p",[e._v("我们很难保证一个项目可以在公司所有的项目中都有用，但是相同业务线的不同项目中是有可能有交集的，我们可以通过对插件名进一步规范来划分插件的适用范围，例如：")]),e._v(" "),_("div",{staticClass:"language- extra-class"},[_("pre",{pre:!0,attrs:{class:"language-text"}},[_("code",[e._v("semo-plugin-[公司标识]-[业务线标识]-[用途标识]\n")])])]),_("h2",{attrs:{id:"创新插件"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#创新插件"}},[e._v("#")]),e._v(" 创新插件")]),e._v(" "),_("p",[e._v("另外，之前的文档中也提到，我们也可以开发非业务属性的插件，只要自己觉得有趣，有想法，都可以试试，例如：")]),e._v(" "),_("div",{staticClass:"language- extra-class"},[_("pre",{pre:!0,attrs:{class:"language-text"}},[_("code",[e._v("semo-plugin-music-download\nsemo-plugin-video-download\nsemo-plugin-todolist\nsemo-plugin-puzzle-me\nsemo-plugin-convert-a-to-b\n")])])]),_("p",[e._v("上面只是随便起一些名字，其实这些插件还都不存在。")]),e._v(" "),_("h2",{attrs:{id:"本地插件"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#本地插件"}},[e._v("#")]),e._v(" 本地插件")]),e._v(" "),_("p",[e._v("不是所有的插件都必须要发布到 "),_("code",[e._v("npm")]),e._v(" 的，我们可以开发很多只有自己知道的插件，满足自己的需求，这种插件一般都是放到 "),_("code",[e._v("~/.semo/node_modules")]),e._v(" 的，这样可以在当前账户的任意位置调用。")]),e._v(" "),_("h2",{attrs:{id:"社区插件"}},[_("a",{staticClass:"header-anchor",attrs:{href:"#社区插件"}},[e._v("#")]),e._v(" 社区插件")]),e._v(" "),_("p",[e._v("如果对自己的插件作品很满意，想分享给其他人使用，就可以把插件发布到 "),_("code",[e._v("npm")]),e._v(" 上，然后告诉别人来用。当然，由于 "),_("code",[e._v("Semo")]),e._v(" 只是充当一个命令调度的作用，其实很大概率上你不必非要基于 "),_("code",[e._v("Semo")]),e._v(" 来写这种 "),_("code",[e._v("npm")]),e._v(" 包，除非你是 "),_("code",[e._v("Semo")]),e._v(" 的粉丝 ^_^。")]),e._v(" "),_("p",[e._v("那么目前都有哪些社区插件了呢，目前的社区还没怎么建起来，插件还比较少，包括但不限于以下插件：（这里的核心指的是放到核心仓库和 "),_("code",[e._v("@semo/core")]),e._v(" 一起维护的插件）")]),e._v(" "),_("ul",[_("li",[_("strong",[e._v("semo-plugin-application")]),e._v("，【核心】定义了一个 Node 项目中可以使用的，给项目添加子命令的规范。")]),e._v(" "),_("li",[_("strong",[e._v("semo-plugin-script")]),e._v("，【核心】定义了一个 Node 项目中可以使用的脚本规范。")]),e._v(" "),_("li",[_("strong",[e._v("semo-plugin-plugin")]),e._v("，【核心】提供了 Semo 全局插件管理命令行工具。")]),e._v(" "),_("li",[_("strong",[e._v("semo-plugin-shell")]),e._v("，【核心】提供了一个简单的命令行环境，可以少敲几个字母。")]),e._v(" "),_("li",[_("strong",[e._v("semo-plugin-hook")]),e._v("，【核心】可以查看钩子相关的信息。")]),e._v(" "),_("li",[_("strong",[e._v("semo-plugin-ssh")]),e._v(", 【扩展】提供了简单的 "),_("code",[e._v("SSH")]),e._v(" 账户管理功能。")]),e._v(" "),_("li",[_("strong",[e._v("semo-plugin-read")]),e._v("，【扩展】提供了将 URL 转换成 "),_("code",[e._v("Markdown")]),e._v("，进而转换成各种格式的工具。\n"),_("ul",[_("li",[_("strong",[e._v("semo-plugin-read-extend-format-wechat")]),e._v(" 这是 read 插件的一个扩展，提供了微信公众号文章在线编辑器的功能，需要和 read 一起使用。")]),e._v(" "),_("li",[e._v("... 这里可能有很多相关子插件，就不一一列举了。")])])]),e._v(" "),_("li",[_("strong",[e._v("semo-plugin-serve")]),e._v("，【扩展】提供了一个简单的 "),_("code",[e._v("HTTP")]),e._v(" 服务器的功能，类似于 "),_("code",[e._v("serve")]),e._v("。")]),e._v(" "),_("li",[_("strong",[e._v("semo-plugin-sequelize")]),e._v(", 【扩展】提供了对  "),_("code",[e._v("Sequelize")]),e._v(" 的集成以提供数据库的访问能力")]),e._v(" "),_("li",[_("strong",[e._v("semo-plugin-redis")]),e._v("，【扩展】提供了对 "),_("code",[e._v("Redis")]),e._v(" 的集成已提供缓存的访问能力")])])])}),[],!1,null,null,null);v.default=o.exports}}]);