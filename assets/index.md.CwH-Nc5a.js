import{_ as i,v as s}from"./chunks/framework.Bz0BBcVk.js";import"./chunks/theme.VFjZSw_2.js";const o=JSON.parse('{"title":"","description":"","frontmatter":{"home":true,"actionText":"快速上手 →","actionLink":"/guide/quickstart/","features":[{"title":"一致","details":"不管Node项目使用何种框架，或者如何抽象分层，都可以使用本框架来实现统一风格的命令行脚本。"},{"title":"可扩展","details":"插件可以扩展，命令可以覆写，配置可以覆盖，使用钩子机制，可以与内置或第三方插件定义的钩子交互。"},{"title":"高效","details":"因为规则简单，所以开发效率高，因为使用频繁，所以工作效率高。"}],"footer":"企业级Node项目命令行体系建设规范"},"headers":[],"relativePath":"index.md","filePath":"index.md"}'),a={name:"index.md"},n=s.createStaticVNode(`<div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 对于本地环境，一般推荐全局安装</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> install</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> -g</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> @semo/cli</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">semo</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> help</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 首次在项目中整合</span></span>
<span class="line"><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">cd</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> YOUR_PROJECT</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> install</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> @semo/cli</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">semo</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> init</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">semo</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> generate</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> command</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> test</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;"># 使用 application 命令行规范</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">npm</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> install</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> semo-plugin-application</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">semo</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> generate</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> command</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> application/test</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> --extend=application</span></span></code></pre></div>`,1),t=[n];function e(l,p,h,k,F,d){return s.openBlock(),s.createElementBlock("div",null,t)}const g=i(a,[["render",e]]);export{o as __pageData,g as default};
