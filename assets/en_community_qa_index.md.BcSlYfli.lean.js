import{_ as i,v as s}from"./chunks/framework.Bz0BBcVk.js";import"./chunks/theme.VFjZSw_2.js";const g=JSON.parse('{"title":"Frequently Asked Questions","description":"","frontmatter":{"sidebar":"auto"},"headers":[],"relativePath":"en/community/qa/index.md","filePath":"en/community/qa/index.md"}'),e={name:"en/community/qa/index.md"},a=s.createStaticVNode('<h1 id="frequently-asked-questions" tabindex="-1">Frequently Asked Questions <a class="header-anchor" href="#frequently-asked-questions" aria-label="Permalink to &quot;Frequently Asked Questions&quot;">​</a></h1><h2 id="why-is-semo-so-slow-and-how-can-it-be-optimized" tabindex="-1">Why is <code>Semo</code> so slow and how can it be optimized? <a class="header-anchor" href="#why-is-semo-so-slow-and-how-can-it-be-optimized" aria-label="Permalink to &quot;Why is `Semo` so slow and how can it be optimized?&quot;">​</a></h2><p>Compared to some scripts with relatively simple and pure logic, Semo considers many flexible settings, including but not limited to multi-layer scanning of plugins, configuration override rules, hook mechanisms, and so on. Among them, the most significant impact comes from the IO burden of plugin scanning. Currently, some optimizations have been made (such as introducing internal caching), which have had some effects. If the scanning results of plugins are thoroughly persisted, further performance improvements can be achieved, but this is a double-edged sword and requires consideration of update mechanisms. Continuous optimization will be carried out in the future.</p><p>Furthermore, up to now, various possibilities of <code>Semo</code> in business development are being explored, and the temporary performance issues have not had a significant impact. Therefore, more emphasis is placed on exploring and compatibility with various possibilities.</p><p>Speed can be further improved by narrowing down the scope of plugin scanning:</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">semo</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> status</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --disable-global-plugin</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --disable-home-plugin</span></span></code></pre></div><p>If you don&#39;t want to enter it every time, you can put it in the <code>.semorc.yml</code> file:</p><div class="language-yaml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yaml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">--disable-global-plugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span>\n<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">--disable-home-plugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>or</p><div class="language-yaml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yaml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">disableGlobalPlugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span>\n<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">disableHomePlugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><h2 id="can-semo-directly-run-typescript-commands" tabindex="-1">Can <code>Semo</code> directly run <code>Typescript</code> commands? <a class="header-anchor" href="#can-semo-directly-run-typescript-commands" aria-label="Permalink to &quot;Can `Semo` directly run `Typescript` commands?&quot;">​</a></h2><p>Simply put, no, if it could, wouldn&#39;t it be <code>Deno</code>? However, it is possible under special conditions. Here are the steps:</p><p><strong>1. There should be <code>typescript</code> and <code>ts-node</code> packages in the project</strong></p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">yarn</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> add</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> typescript</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ts-node</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -D</span></span></code></pre></div><p><strong>2. Initialize tsconfig.json</strong></p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npx</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> tsc</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --init</span></span></code></pre></div><p><strong>Configuration should be modified according to needs. The minimum required configuration here is:</strong></p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;target&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;es6&quot;</span></span></code></pre></div><p>The reason is that the converted code contains <code>async/await</code>.</p><p><strong>3. Configure a scripts command in package.json</strong></p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;scripts&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: {</span></span>\n<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">    &quot;semo&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;node --require ts-node/register ./node_modules/@semo/cli/lib/bin.js&quot;</span></span>\n<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p><strong>4. Modify <code>.semorc.yml</code></strong></p><p>Add support for Typescript</p><div class="language-yaml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yaml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">typescript</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p><strong>5. Finally, create a TypeScript command line script</strong></p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">semo</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> g</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> command</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> test</span></span>\n<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">yarn</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> semo</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> test</span></span></code></pre></div><p>This approach is more suitable for defining local commands. The performance is slower than executing compiled code, but the development experience is better. Generally, the most commonly used method is to let Semo execute the compiled commands.</p>',27),t=[a];function n(o,p,l,h,d,r){return s.openBlock(),s.createElementBlock("div",null,t)}const u=i(e,[["render",n]]);export{g as __pageData,u as default};
