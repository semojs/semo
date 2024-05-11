import{_ as a,v as e}from"./chunks/framework.CxMbDBNk.js";import"./chunks/theme.D1tVMxqi.js";const m=JSON.parse('{"title":"项目整合","description":"","frontmatter":{},"headers":[],"relativePath":"usage/integration/index.md","filePath":"usage/integration/index.md"}'),o={name:"usage/integration/index.md"},s=e.createStaticVNode('<h1 id="项目整合" tabindex="-1">项目整合 <a class="header-anchor" href="#项目整合" aria-label="Permalink to &quot;项目整合&quot;">​</a></h1><p>跟现有业务项目整合是 <code>Semo</code> 开发的初衷，如果一个项目已经有了自定义的用着还不错的命令行工具，那么要慎重考虑要不要换成 <code>Semo</code> 风格的，好在 <code>Semo</code> 整合比较简单，如果项目中之前没有命令行的基础设施，那么推荐尝试 <code>Semo</code>。</p><h2 id="为什么要整合" tabindex="-1">为什么要整合 <a class="header-anchor" href="#为什么要整合" aria-label="Permalink to &quot;为什么要整合&quot;">​</a></h2><ul><li>获得命令行基础设施，一个项目总有一些操作不适合或者来不及做到后台里，通过一个命令行工具，可以更简单的和系统和数据进行交互。</li><li>获得脚本基础设施，总有一些脚本需要执行，脚本起什么名字，放什么位置，以及如何跟业务或者数据进行交互都是常见的需求。</li><li>可以使用相关的 <code>Semo</code> 插件，并且通过配置影响和改变插件的行为。</li><li>获得一个业务相关的 <code>REPL</code> 环境，可以任意调用项目中封装的方法，或者跟一些封装的基础设施进行交互。</li></ul><h2 id="项目整合方式" tabindex="-1">项目整合方式 <a class="header-anchor" href="#项目整合方式" aria-label="Permalink to &quot;项目整合方式&quot;">​</a></h2><p>不一定所有的特性都需要，按需使用即可。</p><h3 id="_1-将-semo-添加为项目依赖" tabindex="-1">1. 将 <code>Semo</code> 添加为项目依赖 <a class="header-anchor" href="#_1-将-semo-添加为项目依赖" aria-label="Permalink to &quot;1. 将 `Semo` 添加为项目依赖&quot;">​</a></h3><p>这里以 <code>yarn</code> 为例：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>yarn add @semo/cli</span></span></code></pre></div><h3 id="_2-在项目根目录进行初始化" tabindex="-1">2. 在项目根目录进行初始化 <a class="header-anchor" href="#_2-在项目根目录进行初始化" aria-label="Permalink to &quot;2. 在项目根目录进行初始化&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo init [--typescript]</span></span></code></pre></div><p>这里看项目是否是基于 Typescript 搭建的，如果是就带上 <code>--typescript</code> 参数。初始化过程会在项目根目录新建一个配置文件 <code>.semorc.yml</code>，并且新增了一个 <code>bin/semo</code> 目录，理论上不会和现有的项目有冲突。</p><h3 id="_3-添加一些命令或脚本" tabindex="-1">3. 添加一些命令或脚本 <a class="header-anchor" href="#_3-添加一些命令或脚本" aria-label="Permalink to &quot;3. 添加一些命令或脚本&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo generate command xxx</span></span>\n<span class="line"><span>semo generate script yyy</span></span></code></pre></div><h3 id="_4-定义项目自己的插件" tabindex="-1">4. 定义项目自己的插件 <a class="header-anchor" href="#_4-定义项目自己的插件" aria-label="Permalink to &quot;4. 定义项目自己的插件&quot;">​</a></h3><p>类似于渐进式开发的理念，一个插件如果只是自己的项目中使用，可以将插件作为项目代码的一部分，等优化成熟了，也很容易转成 npm 包的形式与其他项目分享。</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo generate plugin zzz</span></span></code></pre></div><h3 id="_5-将业务代码注入到-repl-环境" tabindex="-1">5. 将业务代码注入到 REPL 环境 <a class="header-anchor" href="#_5-将业务代码注入到-repl-环境" aria-label="Permalink to &quot;5. 将业务代码注入到 REPL 环境&quot;">​</a></h3><p>参见 <code>插件开发-&gt;例子2：实现 hook_repl</code>，可以看到是如何将方法注入到 <code>REPL</code> 的。注意所有的方法都只能注入到 REPL 的 Semo 对象，这是对 REPL 变量空间的保护。如果是业务方法，只要引入，然后按照 <code>hook_repl</code> 的格式要求返回即可。如果要让方法生效，还需要自己去处理方法对环境的依赖，比如连接数据库等。</p>',19),t=[s];function i(n,c,d,l,p,r){return e.openBlock(),e.createElementBlock("div",null,t)}const g=a(o,[["render",i]]);export{m as __pageData,g as default};