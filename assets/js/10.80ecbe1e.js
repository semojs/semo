(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{356:function(e,s,a){"use strict";a.r(s);var t=a(43),n=Object(t.a)({},(function(){var e=this,s=e.$createElement,a=e._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[a("h1",{attrs:{id:"核心命令"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#核心命令"}},[e._v("#")]),e._v(" 核心命令")]),e._v(" "),a("h2",{attrs:{id:"semo-application"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-application"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo application")])]),e._v(" "),a("blockquote",[a("p",[e._v("alias: "),a("code",[e._v("app")])])]),e._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),a("p",[e._v("这条命令已经转移到 "),a("code",[e._v("semo-plugin-application")]),e._v(" 插件")])]),e._v(" "),a("p",[e._v("默认这个命令没有任何功能，存在的意思是跟业务项目建立一个约定，建议业务项目添加的命令都写成这个命令的子命令。而业务项目之所以能为这个命令添加子命令是利用了 "),a("code",[e._v("Semo")]),e._v(" 的命令扩展机制。")]),e._v(" "),a("div",{staticClass:"language-bash extra-class"},[a("pre",{pre:!0,attrs:{class:"language-bash"}},[a("code",[a("span",{pre:!0,attrs:{class:"token function"}},[e._v("npm")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[e._v("install")]),e._v(" semo-plugin-application\nsemo generate "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[e._v("command")]),e._v(" application/test --extend"),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v("application\n")])])]),a("p",[e._v("这样就可以为项目添加一个 test 命令，而这个命令在执行的时候需要使用 "),a("code",[e._v("semo application test")]),e._v(" 的方式来调用。")]),e._v(" "),a("p",[e._v("通过 "),a("code",[e._v("semo application help")]),e._v(" 可以看到当前业务项目定义的所有顶级子命令，因为如果项目实现的命令过多，层次也多的话，一般我们很难记住所有命令和参数，所以帮助命令是我们经常要执行的。")]),e._v(" "),a("h2",{attrs:{id:"semo-cleanup"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-cleanup"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo cleanup")])]),e._v(" "),a("blockquote",[a("p",[e._v("alias: clean")])]),e._v(" "),a("p",[e._v("这个命令用于清理一些 Semo 内部产生的文件，常见的有 repl 命令的历史， shell 命令的历史， repl 里临时下载的包，run 命令临时下载的包，以及全局插件目录。")]),e._v(" "),a("p",[e._v("目前提供了有限的扩展，只允许应用目录定义清理目录，不支持插件来添加清理目录，主要是为了安全性考虑。")]),e._v(" "),a("h2",{attrs:{id:"semo-config"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-config"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo config")])]),e._v(" "),a("p",[e._v("我们可以通过核心内置的这个命令来查看和修改配置文件，可以操作当前项目的配置文件，也可以操作全局配置文件。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo config <op>\n\nManage rc config\n\n命令：\n  semo config delete <configKey>                                Delete configs by key                     [aliases: del]\n  semo config get <configKey>                                   Get configs by key\n  semo config list                                              List configs                   [默认值] [aliases: ls, l]\n  semo config set <configKey> <configValue> [configComment]     Set config by key\n  [configType]\n\nOptions:\n  --global, -g  For reading/writing configs from/to global yml rc file, default is false\n  --watch       Watch config change, maybe only work on Mac\n")])])]),a("p",[e._v("注意，这里的 "),a("configKey",[e._v(" 的格式是 "),a("code",[e._v("a.b.c")]),e._v(" 的形式，代表多层级配置。另外，这里支持对设置的最后一个层级的配置添加注释。")])],1),e._v(" "),a("h2",{attrs:{id:"semo-hook"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-hook"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo hook")])]),e._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),a("p",[e._v("这条命令已经转移到 "),a("code",[e._v("semo-plugin-hook")]),e._v(" 插件")])]),e._v(" "),a("p",[e._v("这个命令的输出显示了当前环境下可用的所有的钩子，所有实现这些钩子的逻辑都可以被执行。在输出当中能够看到钩子的名称，描述，以及钩子在哪个模块声明的：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("Hook                         :  Package :  Description                                     \n  hook_beforeCommand           :  semo    :  Hook triggered before command execution.        \n  hook_afterCommand            :  semo    :  Hook triggered after command execution.         \n  hook_component               :  semo    :  Hook triggered when needing to fetch component \n  hook_hook                    :  semo    :  Hook triggered in hook command.                 \n  hook_repl                    :  semo    :  Hook triggered in repl command.                 \n  hook_status                  :  semo    :  Hook triggered in status command.               \n  hook_create_project_template :  semo    :  Hook triggered in create command.  \n")])])]),a("p",[e._v("这里可以看到有一个特殊的钩子是 "),a("code",[e._v("hook_hook")]),e._v(" 实现这个钩子就可以声明钩子，任何插件都可以声明自己的钩子，让其他命令来调用，从而影响自身的行为，一般业务项目是不需要声明自己的钩子的，除非业务项目深度使用了这个机制，来构成自己业务的插件系统。")]),e._v(" "),a("p",[e._v("另外需要注意的是，即使不声明，钩子也是可以被使用的，只要其被实现了，这里声明钩子只是为了透明。具体如何声明和实现钩子将在钩子相关小节说明。")]),e._v(" "),a("div",{staticClass:"custom-block warning"},[a("p",{staticClass:"custom-block-title"},[e._v("WARNING")]),e._v(" "),a("p",[e._v("这里未来有可能改成不声明的钩子不让使用的逻辑")])]),e._v(" "),a("h2",{attrs:{id:"semo-init"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-init"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo init")])]),e._v(" "),a("blockquote",[a("p",[e._v("alias: "),a("code",[e._v("i")])])]),e._v(" "),a("p",[e._v("这个命令用来做初始化，可以实现两种场景，对业务项目的初始化或者对插件的初始化，这两个场景的差别在于目录结构稍有差异。")]),e._v(" "),a("p",[e._v("业务项目中，我们默认将 "),a("code",[e._v("Semo")]),e._v(" 的目录结构放到 "),a("code",[e._v("bin")]),e._v(" 目录:")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("├── .semorc.yml\n├── bin\n│   └── semo\n│       ├── commands\n│       ├── extends\n│       ├── hooks\n│       ├── plugins\n│       └── scripts\n└── package.json\n\n")])])]),a("p",[e._v("而在插件项目中，我们是把所有代码放到 "),a("code",[e._v("src")]),e._v(" 目录:")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("├── .semorc.yml\n├── src\n│    ├── commands\n│    ├── extends\n│    ├── hooks\n└── package.json\n")])])]),a("p",[e._v("这个命令存在的意义也仅仅是为了节省工程师若干秒的时间，也就是说如果不用这个命令，手动去创建这些目录和文件夹也是 OK 的。")]),e._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),a("p",[e._v("关于 "),a("code",[e._v(".semorc.yml")]),e._v(" 的结构和用途将在配置管理小节说明")])]),e._v(" "),a("p",[e._v("另外，如果我们真的要创建一个插件，通过初始化的方式进行还是太慢了，这里推荐使用插件项目模板进行，具体的命令如下：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo create semo-plugin-xxx --template=plugin\n")])])]),a("p",[e._v("很明显这里还可以使用其他项目模板，关于 "),a("code",[e._v("create")]),e._v(" 命令，参见下放关于 "),a("code",[e._v("create")]),e._v(" 命令的介绍。")]),e._v(" "),a("h2",{attrs:{id:"semo-create-name-repo-branch"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-create-name-repo-branch"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo create <name> [repo] [branch]")])]),e._v(" "),a("blockquote",[a("p",[e._v("alias: "),a("code",[e._v("n")])])]),e._v(" "),a("p",[e._v("这个命令和 "),a("code",[e._v("generate")]),e._v(" 以及 "),a("code",[e._v("init")]),e._v(" 都不一样，是用来初始化一个新的项目目录的，这个项目可以是业务项目，也可以是一个插件。这个命令有很多参数，也有一些约定：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("$ semo create help\n\nsemo create <name> [repo] [branch]\n\nCreate a create project from specific repo\n\n选项：\n  --version      显示版本号                                                                                       [布尔]\n  --yarn         use yarn command                                                                        [默认值: false]\n  --yes, -y      run npm/yarn init with --yes                                                             [默认值: true]\n  --force, -F    force download, existed folder will be deleted!\n  --merge, -M    merge config with exist project folder!\n  --empty, -E    force empty project, ignore repo\n  --template, -T   select from default repos\n  --add, -A      add npm package to package.json dependencies                                            [默认值: false]\n  --add-dev, -D  add npm package to package.json devDependencies                                         [默认值: false]\n  --init-semo, -i     init new project\n  -h, --help     显示帮助信息                                                                                     [布尔]\n")])])]),a("p",[e._v("单个的说明上面已经有了，下面我们用具体的使用场景说明一下")]),e._v(" "),a("h3",{attrs:{id:"从任意代码仓库初始化"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#从任意代码仓库初始化"}},[e._v("#")]),e._v(" 从任意代码仓库初始化")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo create PROJECT_NAME PROJECT_REPO_URL master -f\n")])])]),a("p",[e._v("这里可以看出，我们用 create 命令可以从任意 git 仓库地址下载代码，任何代码仓库都可以是我们的项目模板。其中 "),a("code",[e._v("master")]),e._v(" 是分支名，默认就是 "),a("code",[e._v("master")]),e._v(" 所以可以省略，"),a("code",[e._v("-f")]),e._v(" 的意思是如果目录已经存在，会先删除原来的，再重新创建。")]),e._v(" "),a("p",[e._v("create 命令除了把代码下载下来，还帮着把原来的 "),a("code",[e._v(".git")]),e._v(" 目录删除了，并且重新初始化了一个空的 "),a("code",[e._v(".git")]),e._v(" 目录，然后把项目的依赖都自动下载下来了。")]),e._v(" "),a("h3",{attrs:{id:"创建一个空项目，不基于任何项目模板"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#创建一个空项目，不基于任何项目模板"}},[e._v("#")]),e._v(" 创建一个空项目，不基于任何项目模板")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo create PROJECT_NAME -yfie\n")])])]),a("p",[e._v("这里可以看到一个 "),a("code",[e._v("yargs")]),e._v(" 的特性，可以把短参数连起来用，这里相当于 "),a("code",[e._v("-y -f -i -e")]),e._v("，也就是，"),a("code",[e._v("-y")]),e._v(" 帮我们在创建了 "),a("code",[e._v("package.json")]),e._v("时自动回答 "),a("code",[e._v("yes")]),e._v("，"),a("code",[e._v("-f")]),e._v(" 是强制删除已存在的目录，"),a("code",[e._v("-i")]),e._v(" 是自动执行 "),a("code",[e._v("semo init")]),e._v(" 初始化项目目录， "),a("code",[e._v("-e")]),e._v(" 是告诉命令，即不基于代码仓库，也不基于内置模板，而是要声明一个空项目。")]),e._v(" "),a("p",[e._v("项目的目录结构如下：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("├── .semorc.yml\n├── bin\n│   └── semo\n│       ├── commands\n│       ├── extends\n│       ├── hooks\n│       ├── plugins\n│       └── scripts\n└── package.json\n")])])]),a("h3",{attrs:{id:"创建一个-semo-插件目录"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#创建一个-semo-插件目录"}},[e._v("#")]),e._v(" 创建一个 "),a("code",[e._v("Semo")]),e._v(" 插件目录")]),e._v(" "),a("p",[e._v("如果不基于插件模板，我们可以手动创建一个基本的插件结构：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo create semo-plugin-[PLUGIN_NAME] -yfie\n")])])]),a("p",[e._v("可以看到，和上面很类似，除了项目名，这里存在一个项目名称的约定，如果项目名称以 "),a("code",[e._v("semo-plugin-")]),e._v(" 开头，则认为是在初始化一个 "),a("code",[e._v("Semo")]),e._v(" 插件，初始化时会执行 "),a("code",[e._v("semo init --plugin")]),e._v("。")]),e._v(" "),a("p",[e._v("项目的目录结构如下：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("├── .semorc.yml\n├── package.json\n└── src\n    ├── commands\n    ├── extends\n    └── hooks\n")])])]),a("h3",{attrs:{id:"基于内置模板创建项目"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#基于内置模板创建项目"}},[e._v("#")]),e._v(" 基于内置模板创建项目")]),e._v(" "),a("p",[e._v("如果我们创建项目执行下面的命令:")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo create PROJECT_NAME --template\n")])])]),a("p",[e._v("则会看到下面的输出:")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("? Please choose a pre-defined repo to continue: (Use arrow keys)\n❯ semo_plugin_starter [semo-plugin-starter, plugin]\n❯ ...\n")])])]),a("p",[e._v("这里可以选择一个想要选择的内置模板，也就是不用主动输入仓库地址了，这里默认只有一个插件模板，但是可以使用 "),a("code",[e._v("hook_create_project_template")]),e._v(" 注入其他模板地址进去：")]),e._v(" "),a("p",[e._v("钩子实现示例，更多关于钩子的用法，请参见钩子相关说明")]),e._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("export")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" hook_create_project_template "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n  demo_repo"),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n    repo"),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[e._v("'demo_repo.git'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n    branch"),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[e._v("'master'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n    alias"),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("[")]),a("span",{pre:!0,attrs:{class:"token string"}},[e._v("'demo'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("]")]),e._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n")])])]),a("p",[e._v("如果在初始化的时候已经知道要使用的模板和标识，可以直接指定：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo create PROJECT_NAME --template=demo\nsemo create PROJECT_NAME --template=demo_repo\n")])])]),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),a("p",[e._v("在创建业务项目或者插件时，不推荐从空项目开始，因为还要考虑很多工程化的问题，技术选型的问题，推荐归纳总结自己公司常用的脚手架项目，然后通过统一的方式进行初始化。比如内置的插件模板，初始化后，可以直接编写逻辑，然后代码上传到 "),a("code",[e._v("Github")]),e._v(" 再执行 "),a("code",[e._v("npm version patch && npm publish")]),e._v(" 即可发布到 npm 仓库了。关于如何开发一个插件并且发布到 "),a("code",[e._v("npm")]),e._v(" 仓库，会单独写文档说明。另外，需要注意，这里的脚手架项目可以是任意语言实现的。")])]),e._v(" "),a("p",[e._v("剩余的其他几个选项也很好理解，"),a("code",[e._v("--yarn")]),e._v(" 声明项目使用 "),a("code",[e._v("yarn")]),e._v(" 来初始化和安装依赖，"),a("code",[e._v("--add")]),e._v(" 和 "),a("code",[e._v("--add-dev")]),e._v(" 用来在初始化时指定新的依赖包。"),a("code",[e._v("--merge")]),e._v(" 是说不删除原来的项目，而是进入项目目录，然后应用 "),a("code",[e._v("--init")]),e._v(", "),a("code",[e._v("--add")]),e._v(", "),a("code",[e._v("--add-dev")]),e._v("。")]),e._v(" "),a("h2",{attrs:{id:"semo-generate-component"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-generate-component"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo generate <component>")])]),e._v(" "),a("blockquote",[a("p",[e._v("alias: "),a("code",[e._v("generate")]),e._v(", "),a("code",[e._v("g")])])]),e._v(" "),a("p",[e._v("这个命令是一个组件代码生成命令，这里组件的意思是对开发目标进行抽象的后的分层分类概念，比如 "),a("code",[e._v("Semo")]),e._v(" 核心就定义了插件，命令和脚本3个概念，所以这三个概念有对应的代码生成子命令，同样的，"),a("code",[e._v("semo")]),e._v(" 插件或者集成的项目都可以创建自己的抽象概念，并提供配套的代码生成器，比如业务项目后端会有路由，控制器，模型，数据库迁移文件，单元测试等概念，这些概念由于项目的不同可能是不通用的，但是一个项目内部最好风格保持一致，通过自动生成样板代码可以更好的保持风格一致。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("$ semo generate help\n\nsemo generate <component>\n\nGenerate component sample code\n\n命令：\n  semo generate command <name> [description]               Generate a command template\n  semo generate plugin <name>                              Generate a plugin structure\n  semo generate script <name>                              Generate a script file\n\n选项：\n  --version   显示版本号                                                                                          [布尔]\n  -h, --help  显示帮助信息                                                                                        [布尔]\n")])])]),a("h3",{attrs:{id:"扩展-generate-命令添加子命令"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#扩展-generate-命令添加子命令"}},[e._v("#")]),e._v(" 扩展 "),a("code",[e._v("generate")]),e._v(" 命令添加子命令")]),e._v(" "),a("p",[e._v("和上面扩展 "),a("code",[e._v("application")]),e._v(" 命令的方法是一样的：")]),e._v(" "),a("div",{staticClass:"language-bash extra-class"},[a("pre",{pre:!0,attrs:{class:"language-bash"}},[a("code",[e._v("semo generate "),a("span",{pre:!0,attrs:{class:"token builtin class-name"}},[e._v("command")]),e._v(" generate/test --extend"),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v("semo\n")])])]),a("p",[e._v("具体怎么实现这些代码生成命令，这里是没有做约束的，因为首先 es6 内置的模板字符串机制可以解决大多数问题，然后 "),a("code",[e._v("Semo")]),e._v(" 还内置了 "),a("code",[e._v("lodash")]),e._v("，其 "),a("code",[e._v("_.template")]),e._v(" 方法也比较灵活，最后只要把组装好的样板代码放到想放的位置即可。")]),e._v(" "),a("p",[e._v("因为这部分都是基于 "),a("code",[e._v("Semo")]),e._v(" 的，所以相关的配置建议放到 "),a("code",[e._v(".semorc.yml")]),e._v(" 文件，例如自动生成的配置里就有的：")]),e._v(" "),a("div",{staticClass:"language-yml extra-class"},[a("pre",{pre:!0,attrs:{class:"language-yml"}},[a("code",[a("span",{pre:!0,attrs:{class:"token key atrule"}},[e._v("commandDir")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(":")]),e._v(" src/commands\n"),a("span",{pre:!0,attrs:{class:"token key atrule"}},[e._v("extendDir")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(":")]),e._v(" src/extends\n"),a("span",{pre:!0,attrs:{class:"token key atrule"}},[e._v("hookDir")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(":")]),e._v(" src/hooks\n")])])]),a("p",[e._v("可以看到，"),a("code",[e._v("create")]),e._v(" 命令生成默认配置也仅仅是约定了一些代码自动生成的目录，同时也给出一种定义目录的配置风格，如果想保持配置的一致性，可以用同样的风格定义其他目录。")]),e._v(" "),a("h2",{attrs:{id:"semo-plugin"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-plugin"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo plugin")])]),e._v(" "),a("blockquote",[a("p",[e._v("alias: p")])]),e._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),a("p",[e._v("这条命令已经转移到 "),a("code",[e._v("semo-plugin-plugin")]),e._v(" 插件")])]),e._v(" "),a("p",[e._v("这个命令用于安装在家目录的全局插件，也可以用于优化当前项目的 semo 执行效率。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("$ semo plugin help\nsemo plugin\n\nPlugin management tool\n\n命令：\n  semo p install <plugin>    Install plugin                                                                 [aliases: i]\n  semo p list                List all plugins                                                           [aliases: l, ls]\n  semo p uninstall <plugin>  Uninstall plugin                                                              [aliases: un]\n")])])]),a("h2",{attrs:{id:"semo-repl"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-repl"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo repl")])]),e._v(" "),a("blockquote",[a("p",[e._v("alias: "),a("code",[e._v("r")])])]),e._v(" "),a("p",[e._v("REPL(read-eval-print-loop)：交互式解析器，每一个现代的编程语言大概都有这类交互环境，在里面我们可以写一些简单的代码，做为一个快速了解和学习语言特性的工具。但是当 REPL 可以和框架或者业务项目结合以后，可以发挥出更大的作用。")]),e._v(" "),a("h3",{attrs:{id:"对-repl-的一些扩展"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#对-repl-的一些扩展"}},[e._v("#")]),e._v(" 对 "),a("code",[e._v("REPL")]),e._v(" 的一些扩展")]),e._v(" "),a("p",[e._v("默认 REPL 的退出只能通过 "),a("code",[e._v("ctrl+c")]),e._v(" 或者 "),a("code",[e._v("ctrl+d")]),e._v(" 或者 "),a("code",[e._v(".exit")]),e._v(" 来进行，这里我们加入了几个快捷的命令，"),a("code",[e._v("quit")]),e._v(", "),a("code",[e._v("q")]),e._v(", "),a("code",[e._v("exit")]),e._v("。")]),e._v(" "),a("p",[e._v("在开发Semo 和这个脚手架时，Node 的 REPL 还不支持 "),a("code",[e._v("await")]),e._v("，这里是模拟实现了这个机制，目的是可以触发执行项目中的一些 promise 或 generator 方法。通过这个能力，再加上我们可以把一些业务代码注入到 "),a("code",[e._v("REPL")]),e._v(" 我们就可以在接口控制器，脚本，单元测试之外多了一种执行方式，而这种执行方式还是交互式的。")]),e._v(" "),a("h3",{attrs:{id:"为-repl-注入新的对象"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#为-repl-注入新的对象"}},[e._v("#")]),e._v(" 为 "),a("code",[e._v("REPL")]),e._v(" 注入新的对象")]),e._v(" "),a("p",[e._v("这里需要实现内置的 "),a("code",[e._v("hook_repl")]),e._v(" 钩子，并且在业务项目的声明的钩子目录配置： "),a("code",[e._v("hookDir")]),e._v("，下面代码仅供参考。")]),e._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// src/hooks/index.ts")]),e._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("export")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token function-variable function"}},[e._v("hook_repl")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=>")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("return")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n    "),a("span",{pre:!0,attrs:{class:"token function-variable function"}},[e._v("add")]),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("async")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[e._v("a"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v(" b")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=>")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n      "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("return")]),e._v(" a "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("+")]),e._v(" b\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n    "),a("span",{pre:!0,attrs:{class:"token function-variable function"}},[e._v("multiple")]),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("async")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[e._v("a"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v(" b")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=>")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n      "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("return")]),e._v(" a "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("*")]),e._v(" b\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n\n")])])]),a("p",[e._v("然后在 REPL 环境，就可以使用了:")]),e._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),a("p",[a("code",[e._v("hook_repl")]),e._v(" 返回的信息都注入到了 REPL 里的 Semo 对象。")])]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v(">>> add\n[Function: add]\n>>> await Semo.add(1, 2)\n3\n>>> multiple\n[Function: multiple]\n>>> await Semo.multiple(3, 4)\n12\n")])])]),a("p",[e._v("在实际的业务项目中，会把项目中的公共方法，工具函数等等都注入进去，这对开发以及后面的排查问题都是很有帮助的。默认 "),a("code",[e._v("Semo")]),e._v(" 把自己的 "),a("code",[e._v("Utils")]),e._v(" 工具对象注入进去了，里面有一些是 "),a("code",[e._v("Semo")]),e._v(" 自定义的工具函数，更多的是把 "),a("code",[e._v("Semo")]),e._v(" 引入的依赖包暴露出来，比如 "),a("code",[e._v("lodash")]),e._v("。")]),e._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),a("p",[e._v("在具体的实践中，我们把数据库，缓存，OSS，Consul, ElasticSearch 等等多种公司的基础设施注入了进来，写成插件，使得我们更容易的直接访问基础设施。")])]),e._v(" "),a("h2",{attrs:{id:"semo-run-plugin-command"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-run-plugin-command"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo run <PLUGIN> [COMMAND]")])]),e._v(" "),a("p",[e._v("这个命令可以像 yarn create 一样，实现直接执行远程插件包里的命令的效果")]),e._v(" "),a("p",[e._v("例如：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo run semo-plugin-serve serve\n")])])]),a("p",[e._v("这里是调用了 semo-plugin-serve 插件实现简单的 HTTP 服务，也许我们会觉得这样写起来还是不是很方便，那么我们可以简化一下。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo run serve\n")])])]),a("p",[e._v("这样看是不是简洁多了，这里能把 "),a("code",[e._v("semo-plugin-")]),e._v(" 省略的原因是这里只支持 semo 系列插件，而不是所有的 npm 包，所以可以内部帮着加上，而后面的 serve 命令去掉是因为插件为此实现了一个约定，插件就是一个普通的 node 包，可以对外暴露方法，这里暴露了一个 handler 方法，而这个 handler 方法又去掉了包里的 serve 命令，因为这个命令文件也是一个 Node 模块。如果插件里面包含多个命令，可以用这个机制对外暴露最常用的，其他的还是应该明确传参。另外，需要注意的是一些命令需要传递参数，这里需要把所有的参数和选项都改造成选项。")]),e._v(" "),a("p",[e._v("之前是命令的时候：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo serve [publicDir]\n")])])]),a("p",[e._v("在用 "),a("code",[e._v("run")]),e._v(" 命令调度时：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo run serve --public-dir=.\n")])])]),a("p",[e._v("如果你在 npm 的 semo 插件包也是在 scope 下的，在用 run 时需要指定 scope")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo run xxx --SCOPE yyy\n")])])]),a("p",[a("code",[e._v("run")]),e._v(" 命令运行的插件肯定是缓存到本地了，只不过不在全局插件目录 "),a("code",[e._v(".semo/node_modules")]),e._v(", 而是在 "),a("code",[e._v(".semo/run_plugin_cache/node_modules")]),e._v(" 目录，默认如果存在就会用缓存里的插件，如果想更新需要用参数 --upgrade")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo run serve --UPGRADE|--UP\n")])])]),a("p",[e._v("有些插件可能依赖于另一些插件，如果有这种情况，就需要手动指定依赖插件，实现一起下载，为什么不能基于 npm 的依赖关系呢，可以看一下下面这个例子：")]),e._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),a("p",[e._v("此特性 v0.8.2 引入")])]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo run read READ_URL --format=editor --DEP=read-extend-format-editor\n")])])]),a("p",[e._v("editor 这个插件在开发时是依赖于 read 的，但是在运行时，read 指定的参数却是 editor 这个插件实现的，所以只能手动指定依赖了。")]),e._v(" "),a("p",[e._v("你可能已经发现这个命令的所有参数和选项都是大写的，这是为了减少与其他插件的冲突，我们最好约定所有的插件的参数和选项都用小写。")]),e._v(" "),a("h2",{attrs:{id:"semo-script-file"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-script-file"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo script [file]")])]),e._v(" "),a("blockquote",[a("p",[e._v("alias: "),a("code",[e._v("scr")])])]),e._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),a("p",[e._v("这条命令已经转移到 "),a("code",[e._v("semo-plugin-script")]),e._v(" 插件")])]),e._v(" "),a("p",[e._v("很多时候我们都需要跑一些脚本，这些脚本是在项目服务之外的，需要我们主动触发，可能是做数据迁移，可能是数据导出，可能是数据批量修改，也可能是执行业务逻辑，比如发邮件，发短信，发通知等等。在遇到这样的需求的时候，我们都需要写脚本，但是我们会遇到几个问题：")]),e._v(" "),a("ul",[a("li",[e._v("放哪里")]),e._v(" "),a("li",[e._v("怎么写")]),e._v(" "),a("li",[e._v("脚本参数怎么解析")])]),e._v(" "),a("p",[e._v("很多时候这些需求都是一次性的，或者有前提的，不是很适合写成命令，不然命令就太多了，在这种场景下，"),a("code",[e._v("Semo")]),e._v(" 通过这条命令给出了一个统一的方案。")]),e._v(" "),a("h3",{attrs:{id:"放哪里"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#放哪里"}},[e._v("#")]),e._v(" 放哪里")]),e._v(" "),a("p",[e._v("在配置中有一个 "),a("code",[e._v("scriptDir")]),e._v("，默认是 "),a("code",[e._v("src/scripts")]),e._v("，我们默认把脚本都放到这里，因为这些脚本不会被服务访问到，所以没必要和项目核心逻辑放的太近。")]),e._v(" "),a("h3",{attrs:{id:"怎么写，怎么解析参数"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#怎么写，怎么解析参数"}},[e._v("#")]),e._v(" 怎么写，怎么解析参数")]),e._v(" "),a("p",[e._v("当然可以手动建脚本，然后用这个命令来触发，但是因脚本还需要起名字，而且还有一定的格式要求，所以，推荐使用 "),a("code",[e._v("semo generate script")]),e._v(" 命令来生成。")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo generate script test\n")])])]),a("p",[e._v("自动生成的样板代码及文件名：")]),e._v(" "),a("div",{staticClass:"language-js extra-class"},[a("pre",{pre:!0,attrs:{class:"language-js"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// src/bin/semo/scripts/20191025130716346_test.ts")]),e._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("export")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token function-variable function"}},[e._v("builder")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("function")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[e._v("yargs"),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" any")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n  "),a("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// yargs.option('option', {default, describe, alias})")]),e._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("export")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token function-variable function"}},[e._v("handler")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("async")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("function")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[e._v("argv"),a("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" any")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n  console"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[e._v("log")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token string"}},[e._v("'Start to draw your dream code!'")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v("\n  process"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[e._v("exit")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[e._v("0")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n")])])]),a("p",[e._v("可以看到，作为一个脚本，不是一上来就写业务逻辑，也不需要声明 "),a("code",[e._v("shebang")]),e._v(" 标识，只需要定义两个方法，一个是 "),a("code",[e._v("builder")]),e._v("，一个是 "),a("code",[e._v("handler")]),e._v("。其中 "),a("code",[e._v("builder")]),e._v(" 用于声明脚本的参数，格式可以参考 "),a("code",[e._v("yargs")]),e._v("，如果脚本不需要参数，其实也可以不定义，由于是模板自动生成，放到那里即可，以备不时之需。"),a("code",[e._v("handler")]),e._v(" 是具体的执行逻辑，传入的参数就是解析好的脚本参数，也包含了项目的 "),a("code",[e._v(".semorc.yml")]),e._v(" 里的配置。可以看到 "),a("code",[e._v("handler")]),e._v(" 支持 "),a("code",[e._v("async")]),e._v(" 所以这里可以执行一些异步操作。")]),e._v(" "),a("p",[e._v("所以，脚本和命令最大的区别其实就是使用的频率，以及业务的定位，我们经常做的分层是定义原子命令，然后在脚本中调度。")]),e._v(" "),a("h2",{attrs:{id:"semo-shell"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-shell"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo shell")])]),e._v(" "),a("blockquote",[a("p",[e._v("alias: "),a("code",[e._v("sh")])])]),e._v(" "),a("div",{staticClass:"custom-block tip"},[a("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),a("p",[e._v("这条命令已经转移到 "),a("code",[e._v("semo-plugin-shell")]),e._v(" 插件")])]),e._v(" "),a("p",[e._v("这个命令是个很简单的命令，目的是不用每次敲命令都输入前面的 "),a("code",[e._v("semo")]),e._v("，例如：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo shell\n> status\n> hook\n> repl\n")])])]),a("p",[e._v("这个命令平时的使用频率不是很高，但是也许有一些人会喜欢使用。退出和 "),a("code",[e._v("repl")]),e._v(" 命令一样支持："),a("code",[e._v("q")]),e._v(", "),a("code",[e._v("quit")]),e._v(", "),a("code",[e._v("exit")]),e._v("。这里还有个额外的用法是，你也可以修改前缀，对其他多层级的命令行工具实现类似的效果，比如:")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("semo shell --prefix=git\n> log\n> remote -v\n")])])]),a("h2",{attrs:{id:"semo-status"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-status"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo status")])]),e._v(" "),a("blockquote",[a("p",[e._v("alias: "),a("code",[e._v("st")])])]),e._v(" "),a("p",[e._v("这个命令的作用很简单，就是看 "),a("code",[e._v("Semo")]),e._v(" 当前所处的环境，例如：")]),e._v(" "),a("div",{staticClass:"language- extra-class"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[e._v("$ semo st\n  version  :  1.8.17\n  location :  ~/.nvm/versions/node/[VERSION]/lib/node_modules/semo\n  os       :  macOS 10.15\n  node     :  8.16.2\n  npm      :  6.4.1\n  yarn     :  1.15.2\n  hostname :  [MY_HOST]\n  home     :  [MY_HOME]\n  shell    :  [MY_SHELL]\n")])])]),a("p",[e._v("这里实现了一个 hook， "),a("code",[e._v("hook_status")]),e._v("，实现了这个 hook 的插件，可以在这里展示插件的相关信息，如果是业务项目实现了这个钩子，也可以在这里显示项目信息。")]),e._v(" "),a("h2",{attrs:{id:"semo-completion"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#semo-completion"}},[e._v("#")]),e._v(" "),a("code",[e._v("semo completion")])]),e._v(" "),a("p",[e._v("这个命令的作用是输出一段 "),a("code",[e._v("Shell")]),e._v(" 脚本，放到 "),a("code",[e._v(".bashrc")]),e._v(" 或者 "),a("code",[e._v(".zshrc")]),e._v(" 里，就能够获得子命令的自动补全效果。")]),e._v(" "),a("div",{staticClass:"custom-block warning"},[a("p",{staticClass:"custom-block-title"},[e._v("WARNING")]),e._v(" "),a("p",[e._v("由于 "),a("code",[e._v("Semo")]),e._v(" 的性能有些差，所以这个自动补全虽然能用，但是体验极差，不建议使用。")])])])}),[],!1,null,null,null);s.default=n.exports}}]);