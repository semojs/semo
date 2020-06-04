(window.webpackJsonp=window.webpackJsonp||[]).push([[9],{355:function(s,t,a){"use strict";a.r(t);var e=a(43),n=Object(e.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h1",{attrs:{id:"配置管理"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#配置管理"}},[s._v("#")]),s._v(" 配置管理")]),s._v(" "),a("p",[a("code",[s._v("Semo")]),s._v(" 的一个核心概念就是配置，我们可以用多种方法干预 "),a("code",[s._v("Semo")]),s._v(" 的配置，从而影响核心和插件的行为。")]),s._v(" "),a("h2",{attrs:{id:"全局配置"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#全局配置"}},[s._v("#")]),s._v(" 全局配置")]),s._v(" "),a("p",[s._v("在家目录有一个全局 "),a("code",[s._v("Semo")]),s._v(" 目录，里面有一个配置文件会在当前账户下全局生效，在 "),a("code",[s._v("~/.semo/.semorc.json")]),s._v("。")]),s._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[s._v("TIP")]),s._v(" "),a("p",[s._v("配置同时也支持 "),a("code",[s._v(".semorc.yml")]),s._v("，并且同时存在时以 yml 格式的配置文件优先。文档中由于历史原因都以 json 为例。")])]),s._v(" "),a("p",[s._v("这个全局配置可以对一些命令的默认值进行调整，使得实际在使用命令的时候可以不用每次都写选项，例如：")]),s._v(" "),a("div",{staticClass:"language-json extra-class"},[a("pre",{pre:!0,attrs:{class:"language-json"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// ~/.semo/.semorc.json")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"commandDefault"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n        "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"create"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n            "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"repo"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"REPO_URL"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n            "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"branch"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"master"')]),s._v("\n        "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("p",[s._v("这里的意思是，"),a("code",[s._v("semo create")]),s._v(" 命令基于模板项目初始化项目时本来应该是这么写的：")]),s._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("semo create PROJECT_NAME PROJECT_REPO_URL master -f\n")])])]),a("p",[s._v("但是，因为有了默认配置，我们就可以省略两个参数，而变成：")]),s._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("semo create PROJECT_NAME -f\n")])])]),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[s._v("TIP")]),s._v(" "),a("p",[s._v("可以看到，这里的配置是放到 "),a("code",[s._v("commandDefault")]),s._v(" 这个 Key 下的，这是因为，如果配置的第一级，会对所有的命令都生效，如果这个是你希望的，就可以放到第一级。否则，可以在 "),a("code",[s._v("commandDefault")]),s._v(" 下仅对单个命令生效。")])]),s._v(" "),a("p",[s._v("我们经常会用到全局配置，尤其是对一些功能命令，如果我们发现每次都要传一些参数，那么就可以通过全局配置固定下来，再举个例子：")]),s._v(" "),a("p",[s._v("在我们执行 "),a("code",[s._v("semo repl")]),s._v(" 命令时，有个 "),a("code",[s._v("--hook")]),s._v(" 参数，如果传了就会调用 "),a("code",[s._v("hook_repl")]),s._v(" 从而注入一些业务逻辑进来，但是核心默认是 "),a("code",[s._v("--hook=false")]),s._v("，这样启动可以稍微快一点，但是后来发现在业务场景中每次都需要传 "),a("code",[s._v("--hook=true")]),s._v("，那么就可以把这个配置放到全局配置中。")]),s._v(" "),a("div",{staticClass:"language-json extra-class"},[a("pre",{pre:!0,attrs:{class:"language-json"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// ~/.semo/.semorc.json")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"commandDefault"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n        "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"repl"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n            "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"hook"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[s._v("true")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n        "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("p",[s._v("这时，执行 "),a("code",[s._v("repl")]),s._v(" 命令就会默认注入业务逻辑了。")]),s._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("semo repl\n")])])]),a("h2",{attrs:{id:"插件配置"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#插件配置"}},[s._v("#")]),s._v(" 插件配置")]),s._v(" "),a("p",[s._v("插件目录下也有一个 "),a("code",[s._v(".semorc.json")]),s._v(" 文件，配置的文件名和原理都是类似的，但是真正能生效的配置项比较少，默认生成的只有三个")]),s._v(" "),a("div",{staticClass:"language-json extra-class"},[a("pre",{pre:!0,attrs:{class:"language-json"}},[a("code",[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"commandDir"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"src/commands"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"extendDir"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"src/extends"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"hookDir"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"src/hooks"')]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("p",[s._v("随着项目的更新，这里能够生效的配置项可能更多，目前这3个，分别控制了插件开发时的命令目录，扩展插件命令目录和钩子目录。")]),s._v(" "),a("p",[s._v("除了以上常用的插件配置，插件有时会对外暴露一些配置项，这些配置行一般约定除了从根取以外，还会从插件名命名空间之下取。")]),s._v(" "),a("div",{staticClass:"language-json extra-class"},[a("pre",{pre:!0,attrs:{class:"language-json"}},[a("code",[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"semo-plugin-xxx"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"foo"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"bar"')]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("p",[s._v("这个配置的生效依赖于插件自身实现时的主动尝试获取")]),s._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" foo "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" Utils"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("_"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("get")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("argv"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v("'semo-plugin-xxx.foo'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" argv"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("foo"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n")])])]),a("p",[s._v("这样就给了插件内部一个灵活约定专属参数的机会，如果插件内部用了太多顶级配置参数，就很可能会跟其他插件的参数发生冲突。这种风格的配置约定是对 "),a("code",[s._v("commandDefault")]),s._v(" 这种配置的一个补充，插件配置重点是配置，而 commandDefault 是从命令参数的角度的覆盖顺序，前者是主动获取，后者可以做到自动识别。具体插件用的是哪一种需要具体的插件明确给出说明。")]),s._v(" "),a("h2",{attrs:{id:"项目配置"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#项目配置"}},[s._v("#")]),s._v(" 项目配置")]),s._v(" "),a("p",[s._v("当我们把 "),a("code",[s._v("Semo")]),s._v(" 整合到项目中的时候，项目里同样也有命令目录，扩展插件命令目录和钩子目录，但是还有更多，比如插件目录和脚本目录:")]),s._v(" "),a("div",{staticClass:"language-json extra-class"},[a("pre",{pre:!0,attrs:{class:"language-json"}},[a("code",[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"commandDir"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"bin/semo/commands"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"pluginDir"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"bin/semo/plugins"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"extendDir"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"bin/semo/extends"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"scriptDir"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"bin/semo/scripts"')]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"hookDir"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('"bin/semo/hooks"')]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[s._v("TIP")]),s._v(" "),a("p",[s._v("插件里没有插件目录的原因是我们不支持在插件里定义插件这种嵌套的声明方式，但是我们支持在项目里定义插件。")])]),s._v(" "),a("p",[s._v("除了配置一些目录之外，我们还可以配置一些覆盖命令的选项，比如上面提到的 "),a("code",[s._v("repl")]),s._v(" 命令选项覆盖：")]),s._v(" "),a("div",{staticClass:"language-json extra-class"},[a("pre",{pre:!0,attrs:{class:"language-json"}},[a("code",[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"hook"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[s._v("true")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("p",[s._v("再比如："),a("code",[s._v("semo init")]),s._v(" 命令有个选项 "),a("code",[s._v("--typescript")]),s._v("，如果加了这个选项初始化目录结构，项目配置里也会有对应的覆盖配置，这样在执行 "),a("code",[s._v("semo generate")]),s._v(" 命令时，我们很多代码生成命令都是同时支持 "),a("code",[s._v("js")]),s._v(" 和 "),a("code",[s._v("ts")]),s._v(" 两个版本的，通过这个选项会让所有的代码自动生成时都是 "),a("code",[s._v("typescript")]),s._v(" 风格。")]),s._v(" "),a("div",{staticClass:"language-json extra-class"},[a("pre",{pre:!0,attrs:{class:"language-json"}},[a("code",[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"typescript"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[s._v("true")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("p",[s._v("在项目配置里配置的选项覆盖仅在当前项目目录生效。这里只是演示用法，实际上我们后面都可以在插件开发时提供多种选项，在项目使用插件时对行为进行限定，以同时支持实现灵活性和个性化。")]),s._v(" "),a("h2",{attrs:{id:"隐藏配置"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#隐藏配置"}},[s._v("#")]),s._v(" 隐藏配置")]),s._v(" "),a("p",[a("code",[s._v("Semo")]),s._v(" 有一些隐藏选项，平时很少使用，可以通过 "),a("code",[s._v("semo help --show-hidden")]),s._v(" 查看：")]),s._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v('选项：\n  --script-name                                       Rename script name.                    [字符串] [默认值: "semo"]\n  --plugin-prefix                                     Set plugin prefix.                              [默认值: "semo"]\n  --disable-core-command, --disable-core              Disable core commands.\n  --disable-completion-command, --disable-completion  Disable completion command.\n  --hide-completion-command, --hide-completion        Hide completion command.\n  --disable-global-plugin, --disable-global-plugins   Disable global plugins.\n  --disable-home-plugin, --disable-home-plugins       Disable home plugins.\n  --hide-epilog                                       Hide epilog.\n  --set-epilog                                        Set epilog.                                        [默认值: false]\n  --set-version                                       Set version.\n  --node-env-key, --node-env                          Set node env key                              [默认值: "NODE_ENV"]\n')])])]),a("p",[s._v("可以看到，通过传这些选项我们可以改变一些核心的行为，甚至连自己的命令名称和版本都可以改掉。这里重点说一下其中的两个：")]),s._v(" "),a("div",{staticClass:"language-json extra-class"},[a("pre",{pre:!0,attrs:{class:"language-json"}},[a("code",[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"--disable-global-plugin"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[s._v("true")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n  "),a("span",{pre:!0,attrs:{class:"token property"}},[s._v('"--disable-home-plugin"')]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[s._v("true")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])])]),a("p",[s._v("我们一般在项目配置中加上这两个配置，使得在做插件和钩子扫描时可以只扫描当前项目目录，可以稍微提高一点命令的性能。")])])}),[],!1,null,null,null);t.default=n.exports}}]);