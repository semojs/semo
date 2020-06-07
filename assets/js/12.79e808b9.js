(window.webpackJsonp=window.webpackJsonp||[]).push([[12],{358:function(e,s,a){"use strict";a.r(s);var t=a(43),n=Object(t.a)({},(function(){var e=this,s=e.$createElement,a=e._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[a("h1",{attrs:{id:"快速上手"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#快速上手"}},[e._v("#")]),e._v(" 快速上手")]),e._v(" "),a("h2",{attrs:{id:"全局安装"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#全局安装"}},[e._v("#")]),e._v(" 全局安装")]),e._v(" "),a("p",[a("code",[e._v("Semo")]),e._v(" 命令行工具同时也是一个辅助工程师日常开发，运维和调试的命令行工具，建议你在本地环境全局安装，具体的使用说明可以参考"),a("a",{attrs:{href:"https://semo.js.org",target:"_blank",rel:"noopener noreferrer"}},[e._v("这里"),a("OutboundLink")],1),e._v("。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("$ npm i -g @semo/cli\n$ semo help\n\nsemo [命令]\n\n命令：\n  semo application                    Application command namespace                                      [aliases: app]\n  semo create <name> [repo] [branch]  Create a new project from specific repo                               [aliases: n]\n  semo generate <component>           Generate component sample code                                        [aliases: g]\n  semo hook                           Show hook info\n  semo init                           Init basic config file and directories                                [aliases: i]\n  semo plugin                         Plugin management tool                                                [aliases: p]\n  semo repl                           Play with REPL                                                        [aliases: r]\n  semo run <plugin> [command]         Run any plugin command directly\n  semo script [file]                  Execute a script                                                    [aliases: scr]\n  semo shell                          Quick shell                                                          [aliases: sh]\n  semo status                         Show environment status info                                         [aliases: st]\n  semo completion                     Generate completion script\n\nOptions:\n  --version   显示版本号                                                                                          [布尔]\n  -h, --help  显示帮助信息                                                                                        [布尔]\n\n")])])]),a("p",[e._v("可以看到里面有很多的内置命令，但是，需要注意的是，这些命令都是有使用场景的，在不配合任何插件和具体的业务项目时对大家的帮助不会很大，因为 "),a("code",[e._v("Semo")]),e._v(" 核心在开发过程中，主要放在定义扩展规范，具体的业务逻辑需要自己去实现，而只有配合具体的业务逻辑进去才能进一步体现 "),a("code",[e._v("Semo")]),e._v(" 的作用和价值。")]),e._v(" "),a("h2",{attrs:{id:"项目集成"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#项目集成"}},[e._v("#")]),e._v(" 项目集成")]),e._v(" "),a("p",[a("code",[e._v("Semo")]),e._v(" 的主要使用场景就是为一个已经存在的业务项目添加命令行机制，如果没有 "),a("code",[e._v("Semo")]),e._v("，各个业务项目当然也是可以开发出自己的命令行的，但是这部分基本都属于重复投入，而且不同的团队实现的方案肯定是有差异的，这种差异带来的是维护成本的增加，而企业级开发，降低成本就是提高利润。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("cd YOUR_PROJECT\nnpm install semo\nsemo init\n")])])]),a("p",[e._v("业务项目集成 Semo 必须要将 "),a("code",[e._v("Semo")]),e._v(" 添加为项目依赖，但是具体放到 "),a("code",[e._v("devDependencies")]),e._v(" 还是 "),a("code",[e._v("dependencies")]),e._v("，需要根据实际情况而定，在业务项目使用 "),a("code",[e._v("Semo")]),e._v(" 的时候有几种使用模式：")]),e._v(" "),a("ul",[a("li",[e._v("业务项目服务核心逻辑依赖 "),a("code",[e._v("Semo")]),e._v("，这种侵入式的，必须添加到 "),a("code",[e._v("dependencies")]),e._v("。")]),e._v(" "),a("li",[e._v("业务项目服务核心逻辑不依赖 "),a("code",[e._v("Semo")]),e._v("，但是有使用 Semo 来定义命令行或者脚本，而脚本需要在线上执行：这种是非侵入式的，但是由于要在线上执行，也需要添加到 "),a("code",[e._v("dependencies")]),e._v("。")]),e._v(" "),a("li",[e._v("业务项目服务核心逻辑不依赖 "),a("code",[e._v("Semo")]),e._v("，也没有使用 "),a("code",[e._v("Semo")]),e._v(" 来定义命令行或脚本，仅仅是用了 REPL 的扩展机制，将项目的公共类和函数放到 "),a("code",[e._v("REPL")]),e._v(" 环境来协助开发调试，这种也是非侵入的，而且不需要在线上执行，所以可以放到 "),a("code",[e._v("devDependencies")]),e._v("。")])]),e._v(" "),a("h3",{attrs:{id:"添加一个项目命令"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#添加一个项目命令"}},[e._v("#")]),e._v(" 添加一个项目命令")]),e._v(" "),a("p",[e._v("这里要考虑的是未来项目命令行工具的规划，如果很多，最好划分一下层次，另外，第一层子命令是一些核心命令，如果我们的命令都放到第一层，会容易混淆和误用。")]),e._v(" "),a("p",[a("strong",[e._v("定义一个一级子命令")])]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo generate command test\nsemo test # 执行刚刚添加的命令\n")])])]),a("p",[a("strong",[e._v("定义一个二级子命令")])]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("npm install semo-plugin-application\nsemo generate command application/test --extend=application\nsemo application test\n")])])]),a("p",[e._v("为了让项目命令和核心以及插件定义的命令隔离，这里推荐的是将项目命令用上面第二种方式添加，同时如果是复杂的项目，还可以继续分层次。当然这样造成了一个问题就是命令的层次增加导致的记忆负担，以及要多输入很多前面的命令才能找到要执行的命令。所以一般，我们在项目里还需要为运行环境的 "),a("code",[e._v("bashrc")]),e._v(" 增加几个 "),a("code",[e._v("alias")]),e._v(":")]),e._v(" "),a("p",[a("strong",[e._v("假设线上环境是用 Docker 容器部署的")])]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("// Dockerfile\nRUN echo 'alias semo=\"npx semo\"' >> /home/node/.bashrc\nRUN echo 'alias app=\"npx semo app\"' >> /home/node/.bashrc\n")])])]),a("p",[e._v("这面的命令演示了缩减命令长度的方法，在实际使用过程中，如果命令分层特别深，这里可以多定义一些 "),a("code",[e._v("alias")]),e._v("。")]),e._v(" "),a("h2",{attrs:{id:"开发插件"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#开发插件"}},[e._v("#")]),e._v(" 开发插件")]),e._v(" "),a("p",[e._v("如果不是在项目中使用 "),a("code",[e._v("Semo")]),e._v("，仅仅是要快速实现一些脚本命令，帮助自己提高工作效率，这时你可以使用 "),a("code",[e._v("Semo")]),e._v(" 快速开始。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("cd ~/.semo/node_modules # 这个目录下定义的插件会全局加载\nsemo create semo-plugin-xxx --select=plugin # 选择插件模板\ncd semo-plugin-xxx\nsemo hi # # 默认里面有一个示例命令\ncode . # 用 Vscode 开始开发\nyarn watch # 基于 `Typescript` 开发，需要实时编译\n")])])]),a("p",[e._v("如果你对插件很满意，想和其他人分享，你直接将你的代码发布到 "),a("code",[e._v("npm")]),e._v("。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("git remove add origin GIT_REPO_URL\ngit add .\ngit commit -m 'init'\nnpm login\nnpm version patch && npm publish\n")])])]),a("div",{staticClass:"custom-block warning"},[a("p",{staticClass:"custom-block-title"},[e._v("WARNING")]),e._v(" "),a("p",[e._v("注意，"),a("code",[e._v("Semo")]),e._v(" 不保证每个插件定义命令的隔离性，所以如果插件安装的多了，可能会有些命令因重名而相互覆盖，但是日常使用中很少有这种情况发生，为了简单，这里没有做特殊的设计。")])]),e._v(" "),a("h2",{attrs:{id:"安装别人开发的插件"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#安装别人开发的插件"}},[e._v("#")]),e._v(" 安装别人开发的插件")]),e._v(" "),a("p",[e._v("如果打开 package.json，你会发现在插件模板里，"),a("code",[e._v("semo")]),e._v(" 放在了 "),a("code",[e._v("peerDependencies")]),e._v("，也就是所有的插件如果要生效，需要和 "),a("code",[e._v("semo")]),e._v(" 一起安装。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("npm i -g @semo/cli semo-plugin-xxx\n")])])]),a("p",[e._v("如果别人的插件仅仅是定义了一些你需要的命令，则你可以把命令安装在全局，如果别人的插件在业务项目中要用，则要放到项目依赖当中。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("cd YOUR_PROJECT\nnpm install semo-plugin-xxx\nyarn add semo-plugin-xxx // 或\n")])])]),a("p",[e._v("由于 "),a("code",[e._v("Semo")]),e._v(" 的插件同时也是一个 "),a("code",[e._v("Node")]),e._v(" 模块，因此，我们也可以在插件中定义一些库函数，被别人在项目中引入")]),e._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("import")]),e._v(" lib "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("from")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[e._v("'semo-plugin-xxx'")]),e._v("\n")])])]),a("p",[e._v("利用 "),a("code",[e._v("Semo")]),e._v(" 提供的钩子机制，也可以使用另一种风格来使用插件提供的业务逻辑支持。")]),e._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("import")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v(" Utils "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("from")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[e._v("'semo'")]),e._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v(" xxx "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("await")]),e._v(" Utils"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[e._v("invokeHook")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[e._v("'components'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v("\n")])])]),a("p",[e._v("可以看到，在后面这种方式中，不需要显示引入包，只需要安装了即可，这种方式是使用的目录扫描的方式，性能是比较差的，而且没有IDE自动提示的支持，但是对命令行这个场景来说，代码风格简单统一也不错。")])])}),[],!1,null,null,null);s.default=n.exports}}]);