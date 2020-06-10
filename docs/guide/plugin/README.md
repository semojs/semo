# 插件开发

## 快速开始

`Semo` 插件就是一个标准的 `Node` 模块，只不过要符合一些目录和文件结构的约定，而这些约定往往很难记忆，所以我们为插件开发者或者工具的使用者提供了各种辅助的工具，例如代码自动生成。这里描述的是推荐的插件开发流程，但同时，在熟悉开发流程之后，也完全可以从一个空目录开始手动构建一个插件。

### 第一步：根据模板，创建插件目录

```
semo create semo-plugin-xyz --template=plugin
```

这里使用了内置的插件模板，按照之前配置管理说的，我们完全可以覆盖 `repo` 和 `branch` 选项，或者覆盖 `--template` 选项来省去每次都传默认参数。

### 第二步：进入插件目录，执行默认命令，证明一切正常

```
cd semo-plugin-xyz
semo hi
```

这是插件模板内置的一个命令，初始化完成后，进入目录即可执行，完成首次你与插件命令的一次对话，如果你看到它回答你 `Hey you!` 就证明已经准备好，接下来就可以写真正改变世界的脚本了。

## 添加命令

需要注意的是，这个插件模板是基于 `Typescript`，因此你需要有一些 `Typescript` 基础，然后我们开发时建议开着 `yarn watch` 命令窗口，来实时编译，一边开发一边测试。

```
semo generate command xyz
```

一般插件名和插件封装的命令会有一定的关联，这里我们添加一个 `xyz` 命令，当然你也可以在之前的 `hi` 命令上修改。真正掌握了插件开发之后，默认的 `hi` 命令就应该删掉了。

## 实现钩子

实现钩子是开发插件的另一个目的，而钩子往往都是其他插件或者业务项目定义的，通过钩子的实现可以影响和改变其他插件的行为。

通过这个命令查询当前环境支持哪些钩子：

```
semo hook
```

### 例子1：实现 `hook_create_project_template`

```js
// src/hooks/index.ts
export const hook_create_project_template = {
  demo_repo: {
    repo: 'demo_repo.git',
    branch: 'master',
    alias: ['demo']
  },
}
```

通过这个钩子，让我们在 `semo create [PROJECT] --template` 命令执行时可以选择自定义的项目模板，只需要记住别名，不需要记住地址；另一个好处是不需要管每个工程师个人电脑上是如何设置全局 `--repo` 选项的，只需要安装了指定的插件，那大家就都可以用相同的项目别名初始化项目了。

### 例子2：实现 `hook_repl`

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


:::tip
`hook_repl` 返回的信息都注入到了 REPL 里的 Semo 对象。
:::

```
semo repl
>>> add
[Function: add]
>>> await Semo.add(1, 2)
3
>>> multiple
[Function: multiple]
>>> await Semo.multiple(3, 4)
12
```

插件和业务项目在实现这个钩子时的出发点是不一样的，业务项目一般注入的是具体的业务逻辑，而插件一般注入的是公共的方法，具有一定的复用性，比如可以注入底层服务的实例方法，常用的库等等，比如核心注入的 `Utils` 里面就包含 `lodash` 库。

## 暴露方法

实现插件还有一个最原始的目的，就是当做一个模块，对外暴露出实例，方法或者类库。这种情况下一方面，我们可以用标准的方式定义模块，例如：

```json
// package.json
{
  "main": "index.js"
}
```

```js
// index.js
exports.func = () => {}
```

这种方式没有任何问题，但是一般定义这种方式的模块也不需要遵守 `Semo` 的规范，只要遵守 `node` 和 `npm` 的规范即可。这里 `Semo` 定义了另外一种暴露方法的方式。基于钩子机制。

```js
// src/hooks/index.ts
export const hook_component = async () {
  return {
    a: 'b'
  }
}
```

使用

```js
import { Utils } from 'semo'
const { a } = await Utils.invokeHook('components')
console.log(a)
// -> 'b'
```

利用这种方式，我们可以封装一些业务项目的公共方法，然后跨项目进行使用，这些公共方法普遍偏底层，比如各种中间件，或者底层服务。


## 发布插件

通过命令，钩子或者类库的扩展，我们就写好了一个 `Semo` 插件，如果想跟他人共享你的插件，需要做一些准备工作。

### 1. 上传代码到一个 `git` 仓库

如果是开源的可以选择 `Github`，如果是内部插件，就上传到内部仓库即可，可能是 `Github` 私有仓库或者公司的 `Gitlab` 仓库

### 2. 修改 `package.json`

主要是包名，版本，协议，仓库地址，首页地址等。

如果是内部插件，可以修改一下 `.npmrc` 文件里的 `registry` 地址。

### 3. 获得一个 npm 仓库的账号，并登录

如果是开源的插件，可以去 `https://npmjs.org` 去注册，如果是私有部署的 `npm` 仓库，则可以找运维获得账号

```
npm login --registry=[YOUR_REGISTRY]
```

### 4. 测试插件包

```
npm pack --dry-run
```

通过打包测试，看看包里是否包含多余的文件，调整 `.npmignore` 文件的配置。

### 5. 发布你的插件

```
npm version [patch|minor|major]
npm publish
```

### 6. 宣传插件，分享开发心得

酒香也怕巷子深，需要写好文档，并积极宣传，让别人使用和反馈。

### 7. 积极维护

任何 npm 包都有可能逐渐过时，或者有安全风险，需要我们积极维护，让插件发挥本来应该发挥的作用。

## 插件的层级

Semo 的插件系统会扫描多个位置，以增加灵活性，每个层级对应不同的目的和限制。

* 通过 `npm install -g semo-plugin-xxx` 安装到全局环境，所以安装的插件命令是全局可用的，这是 `npm` 默认的全局安装包的方式。
* 通过 `semo plugin install semo-plugin-xxx` 安装到家目录的 `.semo` 目录，安装的插件命令也是全局可用的，某些情况下当前用户没有权限用 npm 的方式安装到全局，可以用这种方式。
* 通过 `npm install semo-plugin-xxx` 安装到当前项目目录，这种方式的插件命令只有在当前项目才会生效。

为什么有的插件会需要安装到全局呢？因为插件不仅仅可以实现我们项目的业务需求，也可以实现我们的开发工具链，甚至可以实现一些非业务的小功能，只要有想象力，任何终端功能都可以来一波，可以是完全手写，也可以是对其他优秀项目进行封装和整合，这里的优秀项目不局限于语言和语言的扩展包仓库。

## 直接运行远程插件

这里只是一个错觉，其实还是要下载到本地，只不过下载目录是区分开的，这样就不会干扰你的实现，你可以任意测试你感兴趣的插件。

```
semo run semo-plugin-serve
```

这个插件的功能是提供简单的 HTTP 服务，首次运行是会下载，以后就会复用之前下载的插件，通过 --force 来进行强制更新。

:::tip
后续会开发清理插件缓存的功能
:::