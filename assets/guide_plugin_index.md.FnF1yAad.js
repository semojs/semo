import{_ as a,v as s}from"./chunks/framework.CxMbDBNk.js";import"./chunks/theme.D1tVMxqi.js";const g=JSON.parse('{"title":"插件开发","description":"","frontmatter":{},"headers":[],"relativePath":"guide/plugin/index.md","filePath":"guide/plugin/index.md"}'),i={name:"guide/plugin/index.md"},e=s.createStaticVNode(`<h1 id="插件开发" tabindex="-1">插件开发 <a class="header-anchor" href="#插件开发" aria-label="Permalink to &quot;插件开发&quot;">​</a></h1><h2 id="快速开始" tabindex="-1">快速开始 <a class="header-anchor" href="#快速开始" aria-label="Permalink to &quot;快速开始&quot;">​</a></h2><p><code>Semo</code> 插件就是一个标准的 <code>Node</code> 模块，只不过要符合一些目录和文件结构的约定，而这些约定往往很难记忆，所以我们为插件开发者或者工具的使用者提供了各种辅助的工具，例如代码自动生成。这里描述的是推荐的插件开发流程，但同时，在熟悉开发流程之后，也完全可以从一个空目录开始手动构建一个插件。</p><h3 id="第一步-根据模板-创建插件目录" tabindex="-1">第一步：根据模板，创建插件目录 <a class="header-anchor" href="#第一步-根据模板-创建插件目录" aria-label="Permalink to &quot;第一步：根据模板，创建插件目录&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo create semo-plugin-xyz --template=plugin</span></span></code></pre></div><p>这里使用了内置的插件模板，按照之前配置管理说的，我们完全可以覆盖 <code>repo</code> 和 <code>branch</code> 选项，或者覆盖 <code>--template</code> 选项来省去每次都传默认参数。</p><h3 id="第二步-进入插件目录-执行默认命令-证明一切正常" tabindex="-1">第二步：进入插件目录，执行默认命令，证明一切正常 <a class="header-anchor" href="#第二步-进入插件目录-执行默认命令-证明一切正常" aria-label="Permalink to &quot;第二步：进入插件目录，执行默认命令，证明一切正常&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>cd semo-plugin-xyz</span></span>
<span class="line"><span>semo hi</span></span></code></pre></div><p>这是插件模板内置的一个命令，初始化完成后，进入目录即可执行，完成首次你与插件命令的一次对话，如果你看到它回答你 <code>Hey you!</code> 就证明已经准备好，接下来就可以写真正改变世界的脚本了。</p><h2 id="添加命令" tabindex="-1">添加命令 <a class="header-anchor" href="#添加命令" aria-label="Permalink to &quot;添加命令&quot;">​</a></h2><p>需要注意的是，这个插件模板是基于 <code>Typescript</code>，因此你需要有一些 <code>Typescript</code> 基础，然后我们开发时建议开着 <code>yarn watch</code> 命令窗口，来实时编译，一边开发一边测试。</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo generate command xyz</span></span></code></pre></div><p>一般插件名和插件封装的命令会有一定的关联，这里我们添加一个 <code>xyz</code> 命令，当然你也可以在之前的 <code>hi</code> 命令上修改。真正掌握了插件开发之后，默认的 <code>hi</code> 命令就应该删掉了。</p><h2 id="实现钩子" tabindex="-1">实现钩子 <a class="header-anchor" href="#实现钩子" aria-label="Permalink to &quot;实现钩子&quot;">​</a></h2><p>实现钩子是开发插件的另一个目的，而钩子往往都是其他插件或者业务项目定义的，通过钩子的实现可以影响和改变其他插件的行为。</p><p>通过这个命令查询当前环境支持哪些钩子：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo hook list</span></span></code></pre></div><h3 id="例子1-实现-hook-create-project-template" tabindex="-1">例子1：实现 <code>hook_create_project_template</code> <a class="header-anchor" href="#例子1-实现-hook-create-project-template" aria-label="Permalink to &quot;例子1：实现 \`hook_create_project_template\`&quot;">​</a></h3><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// src/hooks/index.ts</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">export</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> semo__hook_create_project_template</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  demo_repo: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    repo: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;demo_repo.git&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    branch: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;master&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    alias: [</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;demo&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>通过这个钩子，让我们在 <code>semo create [PROJECT] --template</code> 命令执行时可以选择自定义的项目模板，只需要记住别名，不需要记住地址；另一个好处是不需要管每个工程师个人电脑上是如何设置全局 <code>--repo</code> 选项的，只需要安装了指定的插件，那大家就都可以用相同的项目别名初始化项目了。</p><h3 id="例子2-实现-hook-repl" tabindex="-1">例子2：实现 <code>hook_repl</code> <a class="header-anchor" href="#例子2-实现-hook-repl" aria-label="Permalink to &quot;例子2：实现 \`hook_repl\`&quot;">​</a></h3><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// src/hooks/index.ts</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">export</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> const</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> semo__hook_repl</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> () </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">  return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    add</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">async</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (</span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">a</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">b</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">      return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> a </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">+</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> b</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    },</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    multiple</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">async</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> (</span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">a</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#E36209;--shiki-dark:#FFAB70;">b</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">) </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">      return</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> a </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">*</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> b</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>然后在 REPL 环境，就可以使用了:</p><div class="tip custom-block"><p class="custom-block-title">TIP</p><p><code>hook_repl</code> 返回的信息都注入到了 REPL 里的 Semo 对象。</p></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo repl</span></span>
<span class="line"><span>&gt;&gt;&gt; add</span></span>
<span class="line"><span>[Function: add]</span></span>
<span class="line"><span>&gt;&gt;&gt; await Semo.add(1, 2)</span></span>
<span class="line"><span>3</span></span>
<span class="line"><span>&gt;&gt;&gt; multiple</span></span>
<span class="line"><span>[Function: multiple]</span></span>
<span class="line"><span>&gt;&gt;&gt; await Semo.multiple(3, 4)</span></span>
<span class="line"><span>12</span></span></code></pre></div><p>插件和业务项目在实现这个钩子时的出发点是不一样的，业务项目一般注入的是具体的业务逻辑，而插件一般注入的是公共的方法，具有一定的复用性，比如可以注入底层服务的实例方法，常用的库等等，比如核心注入的 <code>Utils</code> 里面就包含 <code>lodash</code> 库。</p><h2 id="暴露方法" tabindex="-1">暴露方法 <a class="header-anchor" href="#暴露方法" aria-label="Permalink to &quot;暴露方法&quot;">​</a></h2><p>实现插件还有一个最原始的目的，就是当做一个模块，对外暴露出实例，方法或者类库。这种情况下一方面，我们可以用标准的方式定义模块，例如：</p><div class="warning custom-block"><p class="custom-block-title">WARNING</p><p>由于 <code>Semo</code> 后来引入了 <code>run</code> 命令，而这个命令依赖于入口文件进行定位，因此要求 <code>Semo</code> 的插件声明一个入口，不管这个入口是否有暴露方法。</p></div><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// package.json</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;main&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;lib/index.js&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// index.js</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">export</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> const</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> func</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> () </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> {}</span></span></code></pre></div><p>这种方式没有任何问题，但是一般定义这种方式的模块也不需要遵守 <code>Semo</code> 的规范，只要遵守 <code>node</code> 和 <code>npm</code> 的规范即可。这里 <code>Semo</code> 定义了另外一种暴露方法的方式。基于钩子机制。</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// src/hooks/index.ts</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">export</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> semo__hook_component</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> async</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> () {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  return {</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    a</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;b&#39;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>使用</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { Utils } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &#39;@semo/core&#39;</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">a</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> await</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Utils.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">invokeHook</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;semo:component&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">console.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">log</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(a)</span></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// -&gt; &#39;b&#39;</span></span></code></pre></div><p>利用这种方式，我们可以封装一些业务项目的公共方法，然后跨项目进行使用，这些公共方法普遍偏底层，比如各种中间件，或者底层服务。</p><h2 id="发布插件" tabindex="-1">发布插件 <a class="header-anchor" href="#发布插件" aria-label="Permalink to &quot;发布插件&quot;">​</a></h2><p>通过命令，钩子或者类库的扩展，我们就写好了一个 <code>Semo</code> 插件，如果想跟他人共享你的插件，需要做一些准备工作。</p><h3 id="_1-上传代码到一个-git-仓库" tabindex="-1">1. 上传代码到一个 <code>git</code> 仓库 <a class="header-anchor" href="#_1-上传代码到一个-git-仓库" aria-label="Permalink to &quot;1. 上传代码到一个 \`git\` 仓库&quot;">​</a></h3><p>如果是开源的可以选择 <code>Github</code>，如果是内部插件，就上传到内部仓库即可，可能是 <code>Github</code> 私有仓库或者公司的 <code>Gitlab</code> 仓库</p><h3 id="_2-修改-package-json" tabindex="-1">2. 修改 <code>package.json</code> <a class="header-anchor" href="#_2-修改-package-json" aria-label="Permalink to &quot;2. 修改 \`package.json\`&quot;">​</a></h3><p>主要是包名，版本，协议，仓库地址，首页地址等。</p><p>如果是内部插件，可以修改一下 <code>.npmrc</code> 文件里的 <code>registry</code> 地址。</p><h3 id="_3-获得一个-npm-仓库的账号-并登录" tabindex="-1">3. 获得一个 npm 仓库的账号，并登录 <a class="header-anchor" href="#_3-获得一个-npm-仓库的账号-并登录" aria-label="Permalink to &quot;3. 获得一个 npm 仓库的账号，并登录&quot;">​</a></h3><p>如果是开源的插件，可以去 <code>https://npmjs.org</code> 去注册，如果是私有部署的 <code>npm</code> 仓库，则可以找运维获得账号</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>npm login --registry=[YOUR_REGISTRY]</span></span></code></pre></div><h3 id="_4-测试插件包" tabindex="-1">4. 测试插件包 <a class="header-anchor" href="#_4-测试插件包" aria-label="Permalink to &quot;4. 测试插件包&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>npm pack --dry-run</span></span></code></pre></div><p>通过打包测试，看看包里是否包含多余的文件，调整 <code>.npmignore</code> 文件的配置。</p><h3 id="_5-发布你的插件" tabindex="-1">5. 发布你的插件 <a class="header-anchor" href="#_5-发布你的插件" aria-label="Permalink to &quot;5. 发布你的插件&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>npm version [patch|minor|major]</span></span>
<span class="line"><span>npm publish</span></span></code></pre></div><h3 id="_6-宣传插件-分享开发心得" tabindex="-1">6. 宣传插件，分享开发心得 <a class="header-anchor" href="#_6-宣传插件-分享开发心得" aria-label="Permalink to &quot;6. 宣传插件，分享开发心得&quot;">​</a></h3><p>酒香也怕巷子深，需要写好文档，并积极宣传，让别人使用和反馈。</p><h3 id="_7-积极维护" tabindex="-1">7. 积极维护 <a class="header-anchor" href="#_7-积极维护" aria-label="Permalink to &quot;7. 积极维护&quot;">​</a></h3><p>任何 npm 包都有可能逐渐过时，或者有安全风险，需要我们积极维护，让插件发挥本来应该发挥的作用。</p><h2 id="插件的层级" tabindex="-1">插件的层级 <a class="header-anchor" href="#插件的层级" aria-label="Permalink to &quot;插件的层级&quot;">​</a></h2><p>Semo 的插件系统会扫描多个位置，以增加灵活性，每个层级对应不同的目的和限制。</p><ul><li>通过 <code>npm install -g semo-plugin-xxx</code> 安装到全局环境，所以安装的插件命令是全局可用的，这是 <code>npm</code> 默认的全局安装包的方式。</li><li>通过 <code>semo plugin install semo-plugin-xxx</code> 安装到家目录的 <code>.semo/home-plugin-cache</code> 目录，安装的插件命令也是全局可用的，某些情况下当前用户没有权限用 npm 的方式安装到全局，可以用这种方式。</li><li>通过 <code>npm install semo-plugin-xxx</code> 安装到当前项目目录，这种方式的插件命令只有在当前项目才会生效。</li></ul><p>为什么有的插件会需要安装到全局呢？因为插件不仅仅可以实现我们项目的业务需求，也可以实现我们的开发工具链，甚至可以实现一些非业务的小功能，只要有想象力，任何终端功能都可以来一波，可以是完全手写，也可以是对其他优秀项目进行封装和整合，这里的优秀项目不局限于语言和语言的扩展包仓库。</p><h2 id="直接运行远程插件" tabindex="-1">直接运行远程插件 <a class="header-anchor" href="#直接运行远程插件" aria-label="Permalink to &quot;直接运行远程插件&quot;">​</a></h2><p>这里只是一个错觉，其实还是要下载到本地，只不过下载目录是区分开的，这样就不会干扰你的实现，你可以任意测试你感兴趣的插件。</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo run semo-plugin-serve</span></span></code></pre></div><p>这个插件的功能是提供简单的 HTTP 服务，首次运行是会下载，以后就会复用之前下载的插件，通过 --force 来进行强制更新。</p><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>后续会开发清理插件缓存的功能</p></div><h2 id="特殊的家目录插件" tabindex="-1">特殊的家目录插件 <a class="header-anchor" href="#特殊的家目录插件" aria-label="Permalink to &quot;特殊的家目录插件&quot;">​</a></h2><blockquote><p>此特性 <code>v0.8.0</code> 引入</p></blockquote><p>我们为了给 <code>Semo</code> 添加全局的配置，需要在 <code>~/.semo</code> 目录添加一个 <code>.semorc.yml</code> 配置文件，一旦这个配置文件建立，则 <code>.semo</code> 目录自动识别为一个全局插件（其他的全局插件都在 <code>~/.semo/home-plugin-cache</code> 目录），你可以在这个插件里定义一些你自己的命令，扩展其他插件的命令，扩展其他插件的钩子等等，这个特殊的插件在于全局可识别，同时，由于默认存在，如果你有一些逻辑是本地常用的，并且不想发布成 npm 包，则可以在这里快速开始。当然，要注意，其全局可用的特点，如果有错误，也会影响到本地全局。</p><p>我们没有预设这个特殊插件的实现方式，也就是说你可以用 <code>js</code> 来写，也可以用 <code>typescript</code> 来写。你可以通过 <code>semo init</code> 命令来初始化基本的目录解构，也可以通过 <code>semo create .semo --template=pluging</code> 用模板重新生成一个 <code>.semo</code> 目录（需要提前备份 <code>.semo</code> 目录，之后再把里面的东西合并回来）</p><h2 id="识别任意目录里的插件" tabindex="-1">识别任意目录里的插件 <a class="header-anchor" href="#识别任意目录里的插件" aria-label="Permalink to &quot;识别任意目录里的插件&quot;">​</a></h2><p>我们可以看到配置文件里的 <code>pluginDir</code>，如果在命令行执行的时候手动指定这个参数，就可以起到任意指定的目的，而且还支持多个目录：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo help --plugin-dir=dir1 --plugin-dir=dir2</span></span></code></pre></div><p>另外，还支持通过常量的方式指定：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>SEMO_PLUGIN_DIR=dir3 semo help</span></span></code></pre></div><h2 id="应用内部定义的插件在-typescript-模式下失效的问题" tabindex="-1">应用内部定义的插件在 Typescript 模式下失效的问题 <a class="header-anchor" href="#应用内部定义的插件在-typescript-模式下失效的问题" aria-label="Permalink to &quot;应用内部定义的插件在 Typescript 模式下失效的问题&quot;">​</a></h2><p>这是由于 <code>tsc</code> 在编译时，只能识别 ts 和 js 相关文件，不能识别我们的 <code>yml</code> 格式，而且官方也不打算支持复制 ts 之外的文件，因为 ts 毕竟不是一个完整的构建工具，所以我们需要自己来把确实的文件拷过去，这件事用 <code>cpy-cli</code> 或者 <code>copyfiles</code> 都可以实现，以 <code>copyfiles</code> 为例：</p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;">// package.json</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">{</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">  &quot;scripts&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: {</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;copyfiles&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;copyfiles -u 1 -a src/**/*.yml dist -E&quot;</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  }</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>其中参数含义:</p><ul><li><code>-u</code> 表示去掉一层再拷贝</li><li><code>-a</code> 表示支持隐藏文件</li><li><code>dist</code> 是我们 ts 的 out 目录</li><li><code>-E</code> 表示如果什么都没有 copy 时抛异常</li></ul><h2 id="插件的主动注册机制" tabindex="-1">插件的主动注册机制 <a class="header-anchor" href="#插件的主动注册机制" aria-label="Permalink to &quot;插件的主动注册机制&quot;">​</a></h2><blockquote><p><code>v1.3.0</code> 引入</p></blockquote><p>早期的 <code>Semo</code> 只支持插件的自动注册机制，而且为了灵活性，可以在多个位置进行遍历，有一定的 IO 性能损失，所以加入了主动注册机制，一旦使用主动注册机制，则自动注册机制自动失效。</p><h3 id="开启方法" tabindex="-1">开启方法 <a class="header-anchor" href="#开启方法" aria-label="Permalink to &quot;开启方法&quot;">​</a></h3><p>在 <code>.semorc.yml</code> 的 <code>$plugins</code> 段下写插件的键值对</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">$plugins</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">  register</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">    plugin-a</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">/绝对路径</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">    plugin-b</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">.相对路径</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">    plugin-c</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>支持三种风格，绝对路径和相对路径比较好理解，第三种就是用 node.js 的模块加载机制来声明。作为 key 的插件名，这里可以省略 <code>semo-plugin-</code> 前缀。另外，这里也支持家目录的简写 <code>~</code></p>`,85),n=[e];function p(t,l,h,o,d,c){return s.openBlock(),s.createElementBlock("div",null,n)}const E=a(i,[["render",p]]);export{g as __pageData,E as default};