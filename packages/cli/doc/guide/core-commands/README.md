# 核心命令

## `semo application`

> alias: `app`

:::tip
这条命令已经转移到 `semo-plugin-application` 插件
:::


默认这个命令没有任何功能，存在的意思是跟业务项目建立一个约定，建议业务项目添加的命令都写成这个命令的子命令。而业务项目之所以能为这个命令添加子命令是利用了 `Semo` 的命令扩展机制。

```bash
npm install semo-plugin-application
semo generate command application/test --extend=application
```

这样就可以为项目添加一个 test 命令，而这个命令在执行的时候需要使用 `semo application test` 的方式来调用。

通过 `semo application help` 可以看到当前业务项目定义的所有顶级子命令，因为如果项目实现的命令过多，层次也多的话，一般我们很难记住所有命令和参数，所以帮助命令是我们经常要执行的。

## `semo hook`

这个命令的输出显示了当前环境下可用的所有的钩子，所有实现这些钩子的逻辑都可以被执行。在输出当中能够看到钩子的名称，描述，以及钩子在哪个模块声明的：

```
Hook                         :  Package :  Description                                     
  hook_beforeCommand           :  semo    :  Hook triggered before command execution.        
  hook_afterCommand            :  semo    :  Hook triggered after command execution.         
  hook_components              :  semo    :  Hook triggered when needing to fetch components 
  hook_hook                    :  semo    :  Hook triggered in hook command.                 
  hook_repl                    :  semo    :  Hook triggered in repl command.                 
  hook_status                  :  semo    :  Hook triggered in status command.               
  hook_create_project_template :  semo    :  Hook triggered in create command.  
```

这里可以看到有一个特殊的钩子是 `hook_hook` 实现这个钩子就可以声明钩子，任何插件都可以声明自己的钩子，让其他命令来调用，从而影响自身的行为，一般业务项目是不需要声明自己的钩子的，除非业务项目深度使用了这个机制，来构成自己业务的插件系统。

另外需要注意的是，即使不声明，钩子也是可以被使用的，只要其被实现了，这里声明钩子只是为了透明。具体如何声明和实现钩子将在钩子相关小节说明。

::: warning
这里未来有可能改成不声明的钩子不让使用的逻辑
:::

## `semo init`

> alias: `i`

这个命令用来做初始化，可以实现两种场景，对业务项目的初始化或者对插件的初始化，这两个场景的差别在于目录结构稍有差异。

业务项目中，我们默认将 `Semo` 的目录结构放到 `bin` 目录:

```
├── .semorc.json
├── bin
│   └── semo
│       ├── commands
│       ├── extends
│       ├── hooks
│       ├── plugins
│       └── scripts
└── package.json

```

而在插件项目中，我们是把所有代码放到 `src` 目录:

```
├── .semorc.json
├── src
│    ├── commands
│    ├── extends
│    ├── hooks
└── package.json
```

这个命令存在的意义也仅仅是为了节省工程师若干秒的时间，也就是说如果不用这个命令，手动去创建这些目录和文件夹也是 OK 的。

:::tip
关于 `.semorc.json` 的结构和用途将在配置管理小节说明
:::

另外，如果我们真的要创建一个插件，通过初始化的方式进行还是太慢了，这里推荐使用插件项目模板进行，具体的命令如下：

```
semo create semo-plugin-xxx --select=plugin
```

很明显这里还可以使用其他项目模板，关于 `create` 命令，参见下放关于 `create` 命令的介绍。

## `semo create <name> [repo] [branch]`

> alias: `n`

这个命令和 `generate` 以及 `init` 都不一样，是用来初始化一个新的项目目录的，这个项目可以是业务项目，也可以是一个插件。这个命令有很多参数，也有一些约定：

```
$ semo create help

semo create <name> [repo] [branch]

Create a create project from specific repo

选项：
  --version      显示版本号                                                                                       [布尔]
  --yarn         use yarn command                                                                        [默认值: false]
  --yes, -y      run npm/yarn init with --yes                                                             [默认值: true]
  --force, -f    force download, existed folder will be deleted!
  --merge, -m    merge config with exist project folder!
  --empty, -e    force empty project, ignore repo
  --select, -s   select from default repos
  --add, -A      add npm package to package.json dependencies                                            [默认值: false]
  --add-dev, -D  add npm package to package.json devDependencies                                         [默认值: false]
  --init, -i     init new project
  -h, --help     显示帮助信息                                                                                     [布尔]
```

单个的说明上面已经有了，下面我们用具体的使用场景说明一下

### 从任意代码仓库初始化

```
semo create PROJECT_NAME PROJECT_REPO_URL master -f
```

这里可以看出，我们用 create 命令可以从任意 git 仓库地址下载代码，任何代码仓库都可以是我们的项目模板。其中 `master` 是分支名，默认就是 `master` 所以可以省略，`-f` 的意思是如果目录已经存在，会先删除原来的，再重新创建。

create 命令除了把代码下载下来，还帮着把原来的 `.git` 目录删除了，并且重新初始化了一个空的 `.git` 目录，然后把项目的依赖都自动下载下来了。

### 创建一个空项目，不基于任何项目模板

```
semo create PROJECT_NAME -yfie
```

这里可以看到一个 `yargs` 的特性，可以把短参数连起来用，这里相当于 `-y -f -i -e`，也就是，`-y` 帮我们在创建了 `package.json`时自动回答 `yes`，`-f` 是强制删除已存在的目录，`-i` 是自动执行 `semo init` 初始化项目目录， `-e` 是告诉命令，即不基于代码仓库，也不基于内置模板，而是要声明一个空项目。

项目的目录结构如下：

```
├── .semorc.json
├── bin
│   └── semo
│       ├── commands
│       ├── extends
│       ├── hooks
│       ├── plugins
│       └── scripts
└── package.json
```

### 创建一个 `Semo` 插件目录

如果不基于插件模板，我们可以手动创建一个基本的插件结构：

```
semo create semo-plugin-[PLUGIN_NAME] -yfie
```

可以看到，和上面很类似，除了项目名，这里存在一个项目名称的约定，如果项目名称以 `semo-plugin-` 开头，则认为是在初始化一个 `Semo` 插件，初始化时会执行 `semo init --plugin`。

项目的目录结构如下：

```
├── .semorc.json
├── package.json
└── src
    ├── commands
    ├── extends
    └── hooks
```

### 基于内置模板创建项目

如果我们创建项目执行下面的命令:

```
semo create PROJECT_NAME --select
```

则会看到下面的输出:

```
? Please choose a pre-defined repo to continue: (Use arrow keys)
❯ semo_plugin_starter [semo-plugin-starter, plugin]
❯ ...
```

这里可以选择一个想要选择的内置模板，也就是不用主动输入仓库地址了，这里默认只有一个插件模板，但是可以使用 `hook_create_project_template` 注入其他模板地址进去：

钩子实现示例，更多关于钩子的用法，请参见钩子相关说明

```js
export const hook_create_project_template = {
  demo_repo: {
    repo: 'demo_repo.git',
    branch: 'master',
    alias: ['demo']
  },
}
```

如果在初始化的时候已经知道要使用的模板和标识，可以直接指定：

```
semo create PROJECT_NAME --select=demo
semo create PROJECT_NAME --select=demo_repo
```

:::tip
在创建业务项目或者插件时，不推荐从空项目开始，因为还要考虑很多工程化的问题，技术选型的问题，推荐归纳总结自己公司常用的脚手架项目，然后通过统一的方式进行初始化。比如内置的插件模板，初始化后，可以直接编写逻辑，然后代码上传到 `Github` 再执行 `npm version patch && npm publish` 即可发布到 npm 仓库了。关于如何开发一个插件并且发布到 `npm` 仓库，会单独写文档说明。另外，需要注意，这里的脚手架项目可以是任意语言实现的。
:::

剩余的其他几个选项也很好理解，`--yarn` 声明项目使用 `yarn` 来初始化和安装依赖，`--add` 和 `--add-dev` 用来在初始化时指定新的依赖包。`--merge` 是说不删除原来的项目，而是进入项目目录，然后应用 `--init`, `--add`, `--add-dev`。

## `semo generate <component>`

> alias: `generate`, `g`
> 
这个命令是一个组件代码生成命令，这里组件的意思是对开发目标进行抽象的后的分层分类概念，比如 `Semo` 核心就定义了插件，命令和脚本3个概念，所以这三个概念有对应的代码生成子命令，同样的，`semo` 插件或者集成的项目都可以创建自己的抽象概念，并提供配套的代码生成器，比如业务项目后端会有路由，控制器，模型，数据库迁移文件，单元测试等概念，这些概念由于项目的不同可能是不通用的，但是一个项目内部最好风格保持一致，通过自动生成样板代码可以更好的保持风格一致。

```
$ semo generate help

semo generate <component>

Generate component sample code

命令：
  semo generate command <name> [description]               Generate a command template
  semo generate plugin <name>                              Generate a plugin structure
  semo generate script <name>                              Generate a script file

选项：
  --version   显示版本号                                                                                          [布尔]
  -h, --help  显示帮助信息                                                                                        [布尔]
```

### 扩展 `generate` 命令添加子命令

和上面扩展 `application` 命令的方法是一样的：

```bash
semo generate command generate/test --extend=semo
```

具体怎么实现这些代码生成命令，这里是没有做约束的，因为首先 es6 内置的模板字符串机制可以解决大多数问题，然后 `Semo` 还内置了 `lodash`，其 `_.template` 方法也比较灵活，最后只要把组装好的样板代码放到想放的位置即可。

因为这部分都是基于 `Semo` 的，所以相关的配置建议放到 `.semorc.json` 文件，例如自动生成的配置里就有的：

```
{
  "commandDir": "src/commands",
  "extendDir": "src/extends",
  "hookDir": "src/hooks"
}
```

可以看到，`create` 命令生成默认配置也仅仅是约定了一些代码自动生成的目录，同时也给出一种定义目录的配置风格，如果想保持配置的一致性，可以用同样的风格定义其他目录。

## `semo plugin`

> alias: p

:::tip
这条命令已经转移到 `semo-plugin-plugin` 插件
:::

这个命令用于安装在家目录的全局插件，也可以用于优化当前项目的 semo 执行效率。

```
$ semo plugin help
semo plugin

Plugin management tool

命令：
  semo p install <plugin>    Install plugin                                                                 [aliases: i]
  semo p list                List all plugins                                                           [aliases: l, ls]
  semo p uninstall <plugin>  Uninstall plugin                                                              [aliases: un]
```

## `semo repl`

> alias: `r`

REPL(read-eval-print-loop)：交互式解析器，每一个现代的编程语言大概都有这类交互环境，在里面我们可以写一些简单的代码，做为一个快速了解和学习语言特性的工具。但是当 REPL 可以和框架或者业务项目结合以后，可以发挥出更大的作用。

### 对 `REPL` 的一些扩展

默认 REPL 的退出只能通过 `ctrl+c` 或者 `ctrl+d` 或者 `.exit` 来进行，这里我们加入了几个快捷的命令，`quit`, `q`, `exit`。

在开发Semo 和这个脚手架时，Node 的 REPL 还不支持 `await`，这里是模拟实现了这个机制，目的是可以触发执行项目中的一些 promise 或 generator 方法。通过这个能力，再加上我们可以把一些业务代码注入到 `REPL` 我们就可以在接口控制器，脚本，单元测试之外多了一种执行方式，而这种执行方式还是交互式的。

### 为 `REPL` 注入新的对象

这里需要实现内置的 `hook_repl` 钩子，并且在业务项目的声明的钩子目录配置： `hookDir`，下面代码仅供参考。

```js
// src/hooks/index.ts
export const hook_repl = () => {
  return {
    add: async (a, b) => {
      return a + b
    },
    multiple: async (a, b) => {
      return a * b
    }
  }
}

```

然后在 REPL 环境，就可以使用了:

```
>>> add
[Function: add]
>>> await add(1, 2)
3
>>> multiple
[Function: multiple]
>>> await multiple(3, 4)
12
```

在实际的业务项目中，会把项目中的公共方法，工具函数等等都注入进去，这对开发以及后面的排查问题都是很有帮助的。默认 `Semo` 把自己的 `Utils` 工具对象注入进去了，里面有一些是 `Semo` 自定义的工具函数，更多的是把 `Semo` 引入的依赖包暴露出来，比如 `lodash`。

:::tip
在具体的实践中，我们把数据库，缓存，OSS，Consul, ElasticSearch 等等多种公司的基础设施注入了进来，写成插件，使得我们更容易的直接访问基础设施。
:::

## `semo run <PLUGIN> [COMMAND]`

这个命令可以像 yarn create 一样，实现直接执行远程插件包里的命令的效果

例如：

```
semo run semo-plugin-serve serve
```

这里是调用了 semo-plugin-serve 插件实现简单的 HTTP 服务，也许我们会觉得这样写起来还是不是很方便，那么我们可以简化一下。

```
semo run serve
```

这样看是不是简洁多了，这里能把 `semo-plugin-` 省略的原因是这里只支持 semo 系列插件，而不是所有的 npm 包，所以可以内部帮着加上，而后面的 serve 命令去掉是因为插件为此实现了一个约定，插件就是一个普通的 node 包，可以对外暴露方法，这里暴露了一个 handler 方法，而这个 handler 方法又去掉了包里的 serve 命令，因为这个命令文件也是一个 Node 模块。如果插件里面包含多个命令，可以用这个机制对外暴露最常用的，其他的还是应该明确传参。另外，需要注意的是一些命令需要传递参数，这里需要把所有的参数和选项都改造成选项。

之前是命令的时候：

```
semo serve [publicDir]
```

在用 `run` 命令调度时：

```
semo run serve --public-dir=.
```

如果你在 npm 的 semo 插件包也是在 scope 下的，在用 run 时需要指定 scope

```
semo run xxx --SCOPE yyy
```

`run` 命令运行的插件肯定是缓存到本地了，只不过不在全局插件目录 `.semo/node_modules`, 而是在 `.semo/run_plugin_cache/node_modules` 目录，默认如果存在就会用缓存里的插件，如果想更新需要用参数 --upgrade

```
semo run serve --UPGRADE
```

你可能已经发现这个命令的所有参数和选项都是大写的，这是为了减少与其他插件的冲突，我们最好约定所有的插件的参数和选项都用小写。

## `semo script [file]`

> alias: `scr`

:::tip
这条命令已经转移到 `semo-plugin-script` 插件
:::

很多时候我们都需要跑一些脚本，这些脚本是在项目服务之外的，需要我们主动触发，可能是做数据迁移，可能是数据导出，可能是数据批量修改，也可能是执行业务逻辑，比如发邮件，发短信，发通知等等。在遇到这样的需求的时候，我们都需要写脚本，但是我们会遇到几个问题：

- 放哪里
- 怎么写
- 脚本参数怎么解析

很多时候这些需求都是一次性的，或者有前提的，不是很适合写成命令，不然命令就太多了，在这种场景下，`Semo` 通过这条命令给出了一个统一的方案。

### 放哪里

在配置中有一个 `scriptDir`，默认是 `src/scripts`，我们默认把脚本都放到这里，因为这些脚本不会被服务访问到，所以没必要和项目核心逻辑放的太近。

### 怎么写，怎么解析参数

当然可以手动建脚本，然后用这个命令来触发，但是因脚本还需要起名字，而且还有一定的格式要求，所以，推荐使用 `semo generate script` 命令来生成。

```
semo generate script test
```

自动生成的样板代码及文件名：

```js
// src/bin/semo/scripts/20191025130716346_test.ts
export const builder = function (yargs: any) {
  // yargs.option('option', {default, describe, alias})
}

export const handler = async function (argv: any) {
  console.log('Start to draw your dream code!')
  process.exit(0)
}
```

可以看到，作为一个脚本，不是一上来就写业务逻辑，也不需要声明 `shebang` 标识，只需要定义两个方法，一个是 `builder`，一个是 `handler`。其中 `builder` 用于声明脚本的参数，格式可以参考 `yargs`，如果脚本不需要参数，其实也可以不定义，由于是模板自动生成，放到那里即可，以备不时之需。`handler` 是具体的执行逻辑，传入的参数就是解析好的脚本参数，也包含了项目的 `.semorc.json` 里的配置。可以看到 `handler` 支持 `async` 所以这里可以执行一些异步操作。

所以，脚本和命令最大的区别其实就是使用的频率，以及业务的定位，我们经常做的分层是定义原子命令，然后在脚本中调度。

## `semo shell`

> alias: `sh`

:::tip
这条命令已经转移到 `semo-plugin-shell` 插件
:::

这个命令是个很简单的命令，目的是不用每次敲命令都输入前面的 `semo`，例如：

```
semo shell
> status
> hook
> repl
```

这个命令平时的使用频率不是很高，但是也许有一些人会喜欢使用。退出和 `repl` 命令一样支持：`q`, `quit`, `exit`。这里还有个额外的用法是，你也可以修改前缀，对其他多层级的命令行工具实现类似的效果，比如:

```
semo shell --prefix=git
> log
> remote -v
```

## `semo status`

> alias: `st`

这个命令的作用很简单，就是看 `Semo` 当前所处的环境，例如：

```
$ semo st
  version  :  1.8.17
  location :  ~/.nvm/versions/node/[VERSION]/lib/node_modules/semo
  os       :  macOS 10.15
  node     :  8.16.2
  npm      :  6.4.1
  yarn     :  1.15.2
  hostname :  [MY_HOST]
  home     :  [MY_HOME]
  shell    :  [MY_SHELL]
```

这里实现了一个 hook， `hook_status`，实现了这个 hook 的插件，可以在这里展示插件的相关信息，如果是业务项目实现了这个钩子，也可以在这里显示项目信息。

## `semo completion`

这个命令的作用是输出一段 `Shell` 脚本，放到 `.bashrc` 或者 `.zshrc` 里，就能够获得子命令的自动补全效果。

:::warning
由于 `Semo` 的性能有些差，所以这个自动补全虽然能用，但是体验极差，不建议使用。
:::