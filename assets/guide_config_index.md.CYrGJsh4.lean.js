import{_ as a,v as s}from"./chunks/framework.CxMbDBNk.js";import"./chunks/theme.D1tVMxqi.js";const g=JSON.parse('{"title":"配置管理","description":"","frontmatter":{},"headers":[],"relativePath":"guide/config/index.md","filePath":"guide/config/index.md"}'),i={name:"guide/config/index.md"},e=s.createStaticVNode(`<h1 id="配置管理" tabindex="-1">配置管理 <a class="header-anchor" href="#配置管理" aria-label="Permalink to &quot;配置管理&quot;">​</a></h1><p><code>Semo</code> 的一个核心概念就是配置，我们可以用多种方法干预 <code>Semo</code> 的配置，从而影响核心和插件的行为。</p><h2 id="全局配置" tabindex="-1">全局配置 <a class="header-anchor" href="#全局配置" aria-label="Permalink to &quot;全局配置&quot;">​</a></h2><p>在家目录有一个全局 <code>Semo</code> 目录，里面有一个配置文件会在当前账户下全局生效，在 <code>~/.semo/.semorc.yml</code>。</p><p>这个全局配置可以对一些命令的默认值进行调整，使得实际在使用命令的时候可以不用每次都写选项，例如：</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">$plugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">  semo</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">    create</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">      repo</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">REPO_URL</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">      branch</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">master</span></span></code></pre></div><p>这里的意思是，<code>semo create</code> 命令基于模板项目初始化项目时本来应该是这么写的：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo create PROJECT_NAME PROJECT_REPO_URL master -f</span></span></code></pre></div><p>但是，因为有了默认配置，我们就可以省略两个参数，而变成：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo create PROJECT_NAME -f</span></span></code></pre></div><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>可以看到，这里的配置是放到 <code>commandDefault</code> 这个 Key 下的，这是因为，如果配置的第一级，会对所有的命令都生效，如果这个是你希望的，就可以放到第一级。否则，可以在 <code>commandDefault</code> 下仅对单个命令生效。</p></div><p>我们经常会用到全局配置，尤其是对一些功能命令，如果我们发现每次都要传一些参数，那么就可以通过全局配置固定下来，再举个例子：</p><p>在我们执行 <code>semo repl</code> 命令时，有个 <code>--hook</code> 参数，如果传了就会调用 <code>hook_repl</code> 从而注入一些业务逻辑进来，但是核心默认是 <code>--hook=false</code>，这样启动可以稍微快一点，但是后来发现在业务场景中每次都需要传 <code>--hook=true</code>，那么就可以把这个配置放到全局配置中。</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">commandDefault</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">  repl</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">    hook</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>这时，执行 <code>repl</code> 命令就会默认注入业务逻辑了。</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo repl</span></span></code></pre></div><h2 id="插件配置" tabindex="-1">插件配置 <a class="header-anchor" href="#插件配置" aria-label="Permalink to &quot;插件配置&quot;">​</a></h2><p>插件目录下也有一个 <code>.semorc.yml</code> 文件，配置的文件名和原理都是类似的，但是真正能生效的配置项比较少，默认生成的只有三个</p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">commandDir: src/commands</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">extendDir: src/extends</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">hookDir: src/hooks</span></span></code></pre></div><p>随着项目的更新，这里能够生效的配置项可能更多，目前这3个，分别控制了插件开发时的命令目录，扩展插件命令目录和钩子目录。</p><p>除了以上常用的插件配置，插件有时会对外暴露一些配置项，这些配置行一般约定除了从根取以外，还会从插件名命名空间之下取。</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">semo-plugin-xxx</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">  foo</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bar</span></span></code></pre></div><p>这个配置的生效依赖于插件自身实现时的主动尝试获取</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> foo</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Utils._.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">get</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(argv, </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;semo-plugin-xxx.foo&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, argv.foo)</span></span></code></pre></div><p>这样就给了插件内部一个灵活约定专属参数的机会，如果插件内部用了太多顶级配置参数，就很可能会跟其他插件的参数发生冲突。这种风格的配置约定是对 <code>commandDefault</code> 这种配置的一个补充，插件配置重点是配置，而 commandDefault 是从命令参数的角度的覆盖顺序，前者是主动获取，后者可以做到自动识别。具体插件用的是哪一种需要具体的插件明确给出说明。</p><h2 id="项目配置" tabindex="-1">项目配置 <a class="header-anchor" href="#项目配置" aria-label="Permalink to &quot;项目配置&quot;">​</a></h2><p>当我们把 <code>Semo</code> 整合到项目中的时候，项目里同样也有命令目录，扩展插件命令目录和钩子目录，但是还有更多，比如插件目录和脚本目录:</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">commandDir</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bin/semo/commands</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">pluginDir</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bin/semo/plugins</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">extendDir</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bin/semo/extends</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">scriptDir</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bin/semo/scripts</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">hookDir</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bin/semo/hooks</span></span></code></pre></div><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>插件里没有插件目录的原因是我们不支持在插件里定义插件这种嵌套的声明方式，但是我们支持在项目里定义插件。</p></div><p>除了配置一些目录之外，我们还可以配置一些覆盖命令的选项，比如上面提到的 <code>repl</code> 命令选项覆盖：</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">hook</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>再比如：<code>semo init</code> 命令有个选项 <code>--typescript</code>，如果加了这个选项初始化目录结构，项目配置里也会有对应的覆盖配置，这样在执行 <code>semo generate</code> 命令时，我们很多代码生成命令都是同时支持 <code>js</code> 和 <code>ts</code> 两个版本的，通过这个选项会让所有的代码自动生成时都是 <code>typescript</code> 风格。</p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">typescript: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>在项目配置里配置的选项覆盖仅在当前项目目录生效。这里只是演示用法，实际上我们后面都可以在插件开发时提供多种选项，在项目使用插件时对行为进行限定，以同时支持实现灵活性和个性化。</p><h2 id="隐藏配置" tabindex="-1">隐藏配置 <a class="header-anchor" href="#隐藏配置" aria-label="Permalink to &quot;隐藏配置&quot;">​</a></h2><p><code>Semo</code> 有一些隐藏选项，平时很少使用，可以通过 <code>semo help --show-hidden</code> 查看：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>选项：</span></span>
<span class="line"><span>  --script-name                                       Rename script name.                    [字符串] [默认值: &quot;semo&quot;]</span></span>
<span class="line"><span>  --plugin-prefix                                     Set plugin prefix.                              [默认值: &quot;semo&quot;]</span></span>
<span class="line"><span>  --disable-core-command, --disable-core              Disable core commands.</span></span>
<span class="line"><span>  --disable-completion-command, --disable-completion  Disable completion command.</span></span>
<span class="line"><span>  --hide-completion-command, --hide-completion        Hide completion command.</span></span>
<span class="line"><span>  --disable-global-plugin, --disable-global-plugins   Disable global plugins.</span></span>
<span class="line"><span>  --disable-home-plugin, --disable-home-plugins       Disable home plugins.</span></span>
<span class="line"><span>  --hide-epilog                                       Hide epilog.</span></span>
<span class="line"><span>  --set-epilog                                        Set epilog.                                        [默认值: false]</span></span>
<span class="line"><span>  --set-version                                       Set version.</span></span>
<span class="line"><span>  --node-env-key, --node-env                          Set node env key                              [默认值: &quot;NODE_ENV&quot;]</span></span></code></pre></div><p>可以看到，通过传这些选项我们可以改变一些核心的行为，甚至连自己的命令名称和版本都可以改掉。这里重点说一下其中的两个：</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">--disable-global-plugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">--disable-home-plugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>我们一般在项目配置中加上这两个配置，使得在做插件和钩子扫描时可以只扫描当前项目目录，可以稍微提高一点命令的性能。</p><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>在 Semo 配置环境里以下配置是完全等价的 --foo-bar --foo--bar --fooBar foo-bar fooBar</p></div><h2 id="通过命令行修改配置" tabindex="-1">通过命令行修改配置 <a class="header-anchor" href="#通过命令行修改配置" aria-label="Permalink to &quot;通过命令行修改配置&quot;">​</a></h2><p>我们当然可以通过编辑配置文件的方式修改配置，但是 Semo 也提供了编辑配置的命令行工具，在命令行工具的帮助下，就可以用脚本的方式定制某些配置了。</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo config set a.b.c d &#39;some comment&#39; -g</span></span>
<span class="line"><span>semo config get a.b.c</span></span>
<span class="line"><span>semo config del a.b.c</span></span>
<span class="line"><span>semo config list</span></span>
<span class="line"><span>semo config list --watch</span></span></code></pre></div><h2 id="应用环境配置" tabindex="-1">应用环境配置 <a class="header-anchor" href="#应用环境配置" aria-label="Permalink to &quot;应用环境配置&quot;">​</a></h2><blockquote><p>此特性 <code>v0.8.0</code> 引入</p></blockquote><p>在应用目录（一般是指运行 semo 命令的当前目录），我们会用 Semo 的机制组织我们的项目代码，比如命令行工具，计划任务，钩子扩展，命令扩展，脚本等等。之前系统只能识别 <code>.semorc.yml</code> 这个配置文件，最新的版本已经可以继续加载一个环境配置，比如当前 <code>NODE_ENV=development</code>(默认值)，则 <code>.semorc.development.yml</code> 如果存在也会识别和加载，并会覆盖主配置的同名配置（用的是 Lodash 的 <code>_.merge</code>）</p><h2 id="特殊配置项" tabindex="-1">特殊配置项 <a class="header-anchor" href="#特殊配置项" aria-label="Permalink to &quot;特殊配置项&quot;">​</a></h2><blockquote><p>此特性 <code>v0.9.0</code> 引入</p></blockquote><p>Semo 的配置和命令行的 <code>argv</code> 是紧密耦合在一起的，argv 原本的意图只是存储命令行参数，Semo 进一步扩展，希望其能承担项目配置管理的重任，这里约定了几个 <code>$</code> 开头的配置，有特殊的含义：</p><h3 id="plugin" tabindex="-1"><code>$plugin</code> <a class="header-anchor" href="#plugin" aria-label="Permalink to &quot;\`$plugin\`&quot;">​</a></h3><p>这个配置约定了插件级别的配置项，以前命令只能通过参数来约定配置，但是有一些复杂的配置，没有必要声明成参数，所以设计了这个配置项：</p><p>以 <code>$plugin.ssh.key = 1</code> 举例，意思是给 <code>semo-plugin-ssh</code> 这个插件下的每个命令都提供了一个配置 <code>key=1</code>， 那这个配置到那里去取呢，Semo 已经帮助装配到 <code>argv.$config</code> 了，所以你在 ssh 插件的命令下取到的 <code>argv.$config</code> 就都是 <code>$plugin.ssh</code> 下的配置。</p><p>为了实现这一点，每个命令在声明的时候，添加了一个 <code>export const plugin = &#39;ssh&#39;</code> 这样的声明。</p><h3 id="plugins" tabindex="-1"><code>$plugins</code> <a class="header-anchor" href="#plugins" aria-label="Permalink to &quot;\`$plugins\`&quot;">​</a></h3><p>上面的 <code>$plugin</code> 是给每个具体的插件添加配置的，而这个是决定整个环境生效的插件的，支持三个配置</p><ul><li><code>$plugins.register</code> 决定是否启用主动注册机制，如果启用，则自动扫描机制失效。参考<a href="./../plugin/README.html">插件的主动注册机制</a></li><li><code>$plugins.include</code> 对注册的插件进行二次过滤，这个是允许名单，是数组，支持插件名的简写形式。</li><li><code>$plugins.exclude</code> 对注册的插件进行二次过滤，这个是禁止名单，是数组，支持插件名的简写形式。</li></ul><h3 id="config" tabindex="-1"><code>$config</code> <a class="header-anchor" href="#config" aria-label="Permalink to &quot;\`$config\`&quot;">​</a></h3><p>自动解析出的插件配置，一般只是插件开发的时候才需要，如果是应用，建议使用 <code>$app</code> 来管理配置</p><h3 id="app-或者-application" tabindex="-1"><code>$app</code> 或者 <code>$application</code> <a class="header-anchor" href="#app-或者-application" aria-label="Permalink to &quot;\`$app\` 或者 \`$application\`&quot;">​</a></h3><p>这里没有特殊功能，只是建议应用自己的配置也收到一起，防止跟命令行的选项混淆。比如：</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">$app</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">  port</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">1234</span></span></code></pre></div><h3 id="input" tabindex="-1"><code>$input</code> <a class="header-anchor" href="#input" aria-label="Permalink to &quot;\`$input\`&quot;">​</a></h3><p>这个的作用是当实现支持管道的命令时，<code>$input</code> 可以自动接收前面命令的输出，不管是不是 Semo 插件的输出，但是输出的格式是不确定的，需要当前命令自己去校验和约束。</p><h3 id="_0" tabindex="-1"><code>$0</code> <a class="header-anchor" href="#_0" aria-label="Permalink to &quot;\`$0\`&quot;">​</a></h3><p>这个是 <code>yargs</code> 自带的，表明当前运行的脚本名称。</p><h3 id="command" tabindex="-1"><code>$command</code> <a class="header-anchor" href="#command" aria-label="Permalink to &quot;\`$command\`&quot;">​</a></h3><p>这个里放的是当前命令的信息，一般来说用处不是很大</p><h3 id="semo" tabindex="-1"><code>$semo</code> <a class="header-anchor" href="#semo" aria-label="Permalink to &quot;\`$semo\`&quot;">​</a></h3><p>这里放的是对工具函数库 <code>Utils</code> 的引用，用这个主要原因是插件有时也想知道和处理内部信息，但是如果是在自己插件内部依赖和导入 <code>@semo/core</code> 由于位置不同，实际上是占用两份内存，而且自己导入这部分由于没有经过初始化，所以缺失必要的信息，通过 <code>argv.$semo.Utils.getInternalCache().get(&#39;argv&#39;)</code> 能够正确取到运行时的数据。</p><h2 id="内置的配置管理相关方法" tabindex="-1">内置的配置管理相关方法 <a class="header-anchor" href="#内置的配置管理相关方法" aria-label="Permalink to &quot;内置的配置管理相关方法&quot;">​</a></h2><h3 id="utils-extendconfig" tabindex="-1"><code>Utils.extendConfig</code> <a class="header-anchor" href="#utils-extendconfig" aria-label="Permalink to &quot;\`Utils.extendConfig\`&quot;">​</a></h3><p>这个方法支持扩展一个新的配置文件，这样可以支持配置文件组，不用把所有的配置都放到 <code>.semorc.yml</code> 里，同时支持环境配置，例如：</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">Utils.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">extendConfig</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;application.yml&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>application.yml</span></span>
<span class="line"><span>application.development.yml</span></span>
<span class="line"><span>application.production.yml</span></span></code></pre></div><h3 id="utils-config" tabindex="-1"><code>Utils.config</code> <a class="header-anchor" href="#utils-config" aria-label="Permalink to &quot;\`Utils.config\`&quot;">​</a></h3><p>这个方法用于取出总配置里的一段，默认取出所有，基于 Lodash 的 <code>_.get</code> 方法。</p><h3 id="utils-pluginconfig" tabindex="-1"><code>Utils.pluginConfig</code> <a class="header-anchor" href="#utils-pluginconfig" aria-label="Permalink to &quot;\`Utils.pluginConfig\`&quot;">​</a></h3><p>这个方法用于取出插件配置，只能在命令 <code>handler</code> 下工作，默认取出还是命令行参数优先，但是如果命令行参数没有指定并且没有默认值，则可以取插件级别的配置。</p><h2 id="环境变量设置-env" tabindex="-1">环境变量设置 <code>.env</code> <a class="header-anchor" href="#环境变量设置-env" aria-label="Permalink to &quot;环境变量设置 \`.env\`&quot;">​</a></h2><p>通过整合 <code>dotenv</code>，我们引入了对 <code>.env</code> 文件的支持，对于命令行工具来说是默认开启的。对于程序来说需要手动开启。</p><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { Utils } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &#39;@semo/core&#39;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">Utils.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">useDotEnv</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">()</span></span></code></pre></div>`,82),n=[e];function p(l,t,o,c,d,h){return s.openBlock(),s.createElementBlock("div",null,n)}const u=a(i,[["render",p]]);export{g as __pageData,u as default};