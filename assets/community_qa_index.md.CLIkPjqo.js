import{_ as e,v as s}from"./chunks/framework.BO--qlR8.js";import"./chunks/theme.C7eXMWNj.js";const r=JSON.parse('{"title":"常见问题","description":"","frontmatter":{"sidebar":"auto"},"headers":[],"relativePath":"community/qa/index.md","filePath":"community/qa/index.md"}'),t={name:"community/qa/index.md"};function i(n,a,p,o,l,d){return s.openBlock(),s.createElementBlock("div",null,a[0]||(a[0]=[s.createStaticVNode('<h1 id="常见问题" tabindex="-1">常见问题 <a class="header-anchor" href="#常见问题" aria-label="Permalink to &quot;常见问题&quot;">​</a></h1><h2 id="semo-怎么这么慢-怎么优化" tabindex="-1"><code>Semo</code> 怎么这么慢，怎么优化？ <a class="header-anchor" href="#semo-怎么这么慢-怎么优化" aria-label="Permalink to &quot;`Semo` 怎么这么慢，怎么优化？&quot;">​</a></h2><p>相对于一些逻辑比较简单纯粹的脚本，Semo 考虑了很多灵活性的设置，包括但不限于插件的多层扫描，配置的覆盖规则，钩子机制等等，其中影响最大的是插件扫描的 IO负担，目前经过一些优化（引入内部缓存）已经有一些效果，后面如果把插件扫描结果彻底持久化，是可以进一步提升性能的，但是是双刃剑，还需要考虑更新机制，后面会持续优化。</p><p>另外，到目前为止，都在探索 <code>Semo</code> 在业务开发中的各种可能性，暂时性能问题影响并没有那么大，所以更倾向于投入在探索和兼容各种可能性上。</p><p>通过缩小插件扫描范围可以进一步提速：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>semo status --disable-global-plugin --disable-home-plugin</span></span></code></pre></div><p>如果不想每次都输入，可以放到 <code>.semorc.yml</code> 文件当中：</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">--disable-global-plugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">true,</span></span>\n<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">--disable-home-plugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>或</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">disableGlobalPlugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">true,</span></span>\n<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">disableHomePlugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><h2 id="semo-可以直接运行-typescript-命令么" tabindex="-1"><code>Semo</code> 可以直接运行 <code>Typescript</code> 命令么？ <a class="header-anchor" href="#semo-可以直接运行-typescript-命令么" aria-label="Permalink to &quot;`Semo` 可以直接运行 `Typescript` 命令么？&quot;">​</a></h2><p>简单来说，不可以，如果可以的话，岂不是就成 <code>Deno</code> 啦，但是，在特殊的条件下是可以的，以下是步骤：</p><p><strong>1、项目中应该有 <code>typescript</code> 和 <code>ts-node</code> 两个包</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>yarn add typescript ts-node -D</span></span></code></pre></div><p><strong>2、初始化 tsconfig.json</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>npx tsc --init</span></span></code></pre></div><p><strong>可以根据需要进行配置，这里最少要修改的配置如下:</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>&quot;target&quot;: &quot;es6&quot;,</span></span></code></pre></div><p>原因是，转换的代码里有 <code>async/await</code></p><p><strong>3、package.json 里配置一个 scripts 命令</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>&quot;scripts&quot;: {</span></span>\n<span class="line"><span>    &quot;semo&quot;: &quot;node --require ts-node/register ./node_modules/@semo/cli/lib/bin.js&quot;,</span></span>\n<span class="line"><span>}</span></span></code></pre></div><p><strong>4、修改 <code>.semorc.yml</code></strong></p><p>添加对 typescript 的支持</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>typescript: true</span></span></code></pre></div><p><strong>5、最后创建一个ts的命令行脚本吧</strong></p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>semo g command test</span></span>\n<span class="line"><span>yarn semo test</span></span></code></pre></div><p>最后，这种方式比较适合于定义本地命令，性能要比执行编译之后的代码要慢一些，但是开发体验较好，一般常用的方式还是让 Semo 去执行编译之后的命令。</p>',27)]))}const g=e(t,[["render",i]]);export{r as __pageData,g as default};
