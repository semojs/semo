import{_ as i,v as e}from"./chunks/framework.CxMbDBNk.js";import"./chunks/theme.D1tVMxqi.js";const u=JSON.parse('{"title":"Configuration Management","description":"","frontmatter":{},"headers":[],"relativePath":"en/guide/config/index.md","filePath":"en/guide/config/index.md"}'),a={name:"en/guide/config/index.md"},s=e.createStaticVNode(`<h1 id="configuration-management" tabindex="-1">Configuration Management <a class="header-anchor" href="#configuration-management" aria-label="Permalink to &quot;Configuration Management&quot;">​</a></h1><p>A core concept of <code>Semo</code> is configuration. We can intervene in the configuration of <code>Semo</code> in multiple ways to influence the behavior of both the core and plugins.</p><h2 id="global-configuration" tabindex="-1">Global Configuration <a class="header-anchor" href="#global-configuration" aria-label="Permalink to &quot;Global Configuration&quot;">​</a></h2><p>There is a global <code>Semo</code> directory in the home directory, containing a configuration file that will take effect globally under the current account, located at <code>~/.semo/.semorc.yml</code>.</p><p>This global configuration can adjust default values for some commands, allowing options to be omitted when using commands each time, for example:</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">$plugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">  semo</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">    create</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">      repo</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">REPO_URL</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">      branch</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">master</span></span></code></pre></div><p>This means that the <code>semo create</code> command, which initializes a project based on a template project, would originally be written as follows:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo create PROJECT_NAME PROJECT_REPO_URL master -f</span></span></code></pre></div><p>However, with default configuration, we can omit two parameters and write:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo create PROJECT_NAME -f</span></span></code></pre></div><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>You can see that the configuration is placed under the <code>commandDefault</code> key. This is because if it&#39;s configured at the top level, it will affect all commands. If this is desired behavior, it can be placed at the top level. Otherwise, it can be placed under <code>commandDefault</code> to only affect a single command.</p></div><p>We often use global configuration, especially for some functional commands. If we find ourselves needing to pass certain parameters every time, we can fix them through global configuration. For example:</p><p>When executing the <code>semo repl</code> command, there is a <code>--hook</code> parameter. If passed, it will call <code>hook_repl</code> to inject some business logic. However, the default for the core is <code>--hook=false</code>, which starts a bit faster, but later it was found that in the business scenario, <code>--hook=true</code> was needed every time. In this case, we can add this configuration to the global configuration.</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">commandDefault</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">  repl</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">    hook</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>Now, when executing the <code>repl</code> command, business logic will be injected by default.</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo repl</span></span></code></pre></div><h2 id="plugin-configuration" tabindex="-1">Plugin Configuration <a class="header-anchor" href="#plugin-configuration" aria-label="Permalink to &quot;Plugin Configuration&quot;">​</a></h2><p>There is also a <code>.semorc.yml</code> file under the plugin directory, with similar configuration file names and principles, but with fewer configurations that actually take effect. By default, only three are generated:</p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">commandDir: src/commands</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">extendDir: src/extends</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">hookDir: src/hooks</span></span></code></pre></div><p>As the project evolves, more configurations that can take effect here may be added. Currently, these three control the command directory, plugin extension command directory, and hook directory during plugin development.</p><p>In addition to the commonly used plugin configurations mentioned above, plugins sometimes expose some configuration options externally. These configuration lines generally agree to be retrieved from both the root and the namespace of the plugin name.</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">semo-plugin-xxx</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">  foo</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bar</span></span></code></pre></div><p>The effectiveness of this configuration depends on the plugin&#39;s own implementation trying to retrieve it actively.</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> foo</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> Utils._.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">get</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(argv, </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;semo-plugin-xxx.foo&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, argv.foo)</span></span></code></pre></div><p>This provides an opportunity for plugins to flexibly agree on exclusive parameters internally. If a plugin uses too many top-level configuration parameters internally, it is likely to conflict with parameters from other plugins. This style of configuration agreement is a supplement to configurations like <code>commandDefault</code>. The focus of plugin configuration is configuration, while <code>commandDefault</code> is the override order from the perspective of command parameters. The former is actively obtained, while the latter can be automatically recognized. The specific plugin should clearly indicate which method it uses.</p><h2 id="project-configuration" tabindex="-1">Project Configuration <a class="header-anchor" href="#project-configuration" aria-label="Permalink to &quot;Project Configuration&quot;">​</a></h2><p>When we integrate <code>Semo</code> into a project, the project also has command directories, plugin extension command directories, and hook directories, but there are more, such as plugin directories and script directories:</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">commandDir</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bin/semo/commands</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">pluginDir</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bin/semo/plugins</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">extendDir</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bin/semo/extends</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">scriptDir</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bin/semo/scripts</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">hookDir</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">bin/semo/hooks</span></span></code></pre></div><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>The reason there is no plugin directory in the plugin is because we do not support the nested declaration of plugins in plugins, but we support defining plugins in projects.</p></div><p>In addition to configuring some directories, we can also configure some options to override commands, such as the <code>repl</code> command option override mentioned above:</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">hook</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>For example, the <code>semo init</code> command has an <code>--typescript</code> option. If this option is added to initialize the directory structure, there will also be a corresponding override configuration in the project configuration. This way, when executing the <code>semo generate</code> command, many code generation commands that support both <code>js</code> and <code>ts</code> versions will be automatically generated as <code>typescript</code> style.</p><div class="language-json vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">json</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">typescript: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>Options configured in the project configuration only take effect in the current project directory. This is just a demonstration of usage. In fact, we can provide multiple options when developing plugins, and limit behaviors when using plugins in projects to support flexibility and personalization.</p><h2 id="hidden-configuration" tabindex="-1">Hidden Configuration <a class="header-anchor" href="#hidden-configuration" aria-label="Permalink to &quot;Hidden Configuration&quot;">​</a></h2><p><code>Semo</code> has some hidden options that are rarely used in ordinary times, which can be viewed by <code>semo help --show-hidden</code>:</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>Options:</span></span>
<span class="line"><span>  --script-name                                       Rename script name.                    [string] [default: &quot;semo&quot;]</span></span>
<span class="line"><span>  --plugin-prefix                                     Set plugin prefix.                              [default: &quot;semo&quot;]</span></span>
<span class="line"><span>  --disable-core-command, --disable-core              Disable core commands.</span></span>
<span class="line"><span>  --disable-completion-command, --disable-completion  Disable completion command.</span></span>
<span class="line"><span>  --hide-completion-command, --hide-completion        Hide completion command.</span></span>
<span class="line"><span>  --disable-global-plugin, --disable-global-plugins   Disable global plugins.</span></span>
<span class="line"><span>  --disable-home-plugin, --disable-home-plugins       Disable home plugins.</span></span>
<span class="line"><span>  --hide-epilog                                       Hide epilog.</span></span>
<span class="line"><span>  --set-epilog                                        Set epilog.                                        [default: false]</span></span>
<span class="line"><span>  --set-version                                       Set version.</span></span>
<span class="line"><span>  --node-env-key, --node-env                          Set node env key                              [default: &quot;NODE_ENV&quot;]</span></span></code></pre></div><p>As seen, by passing these options, we can change some core behaviors, and even change our own command names and versions. Here, two of them are emphasized:</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">--disable-global-plugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">--disable-home-plugin</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">true</span></span></code></pre></div><p>We generally add these two configurations in project configuration, so that when scanning plugins and hooks, only the current project directory is scanned, which can slightly improve command performance.</p><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>In the Semo configuration environment, the following configurations are completely equivalent --foo-bar --foo--bar --fooBar foo-bar fooBar</p></div><h2 id="modifying-configuration-via-command-line" tabindex="-1">Modifying Configuration via Command Line <a class="header-anchor" href="#modifying-configuration-via-command-line" aria-label="Permalink to &quot;Modifying Configuration via Command Line&quot;">​</a></h2><p>Of course, we can modify the configuration by editing the configuration file, but Semo also provides a command line tool to edit the configuration. With this command line tool, we can customize certain configurations through scripts.</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>semo config set a.b.c d &#39;some comment&#39; -g</span></span>
<span class="line"><span>semo config get a.b.c</span></span>
<span class="line"><span>semo config del a.b.c</span></span>
<span class="line"><span>semo config list</span></span>
<span class="line"><span>semo config list --watch</span></span></code></pre></div><h2 id="application-environment-configuration" tabindex="-1">Application Environment Configuration <a class="header-anchor" href="#application-environment-configuration" aria-label="Permalink to &quot;Application Environment Configuration&quot;">​</a></h2><blockquote><p>This feature was introduced in <code>v0.8.0</code></p></blockquote><p>In the application directory (usually the current directory where the semo command is run), we organize our project code using Semo&#39;s mechanism, such as command line tools, scheduled tasks, hook extensions, command extensions, scripts, etc. Previously, the system could only recognize the <code>.semorc.yml</code> configuration file, but the latest version can continue to load an environment configuration. For example, if the current <code>NODE_ENV=development</code> (default value), then <code>.semorc.development.yml</code> will also be recognized and loaded, and will override configurations with the same name in the main configuration (using Lodash&#39;s <code>_.merge</code>).</p><h2 id="special-configuration-items" tabindex="-1">Special Configuration Items <a class="header-anchor" href="#special-configuration-items" aria-label="Permalink to &quot;Special Configuration Items&quot;">​</a></h2><blockquote><p>This feature was introduced in <code>v0.9.0</code></p></blockquote><p>Semo&#39;s configuration and command line <code>argv</code> are closely coupled. The original intention of <code>argv</code> was only to store command line parameters. Semo further expands its capabilities, hoping it can take on the responsibility of project configuration management. Here, several configurations starting with <code>$</code> have special meanings:</p><h3 id="plugin" tabindex="-1"><code>$plugin</code> <a class="header-anchor" href="#plugin" aria-label="Permalink to &quot;\`$plugin\`&quot;">​</a></h3><p>This configuration defines plugin-level configuration items. Previously, commands could only agree on configurations through parameters, but there are some complex configurations that do not need to be declared as parameters. Therefore, this configuration item was designed:</p><p>Taking <code>$plugin.ssh.key = 1</code> as an example, it means that each command under the <code>semo-plugin-ssh</code> plugin is provided with a configuration <code>key=1</code>. Where does this configuration go? Semo has already helped assemble it into <code>argv.$config</code>, so you can retrieve <code>argv.$config</code> under the command of the ssh plugin, and all configurations obtained are under <code>$plugin.ssh</code>.</p><p>To achieve this, each command adds a declaration like <code>export const plugin = &#39;ssh&#39;</code> when declared.</p><h3 id="plugins" tabindex="-1"><code>$plugins</code> <a class="header-anchor" href="#plugins" aria-label="Permalink to &quot;\`$plugins\`&quot;">​</a></h3><p>The <code>$plugin</code> mentioned above adds configurations for each specific plugin, while this one determines the effective plugins for the entire environment, supporting three configurations:</p><ul><li><code>$plugins.register</code> determines whether to enable the active registration mechanism. If enabled, the automatic scanning mechanism is disabled. Refer to <a href="./../plugin/README.html">Active Registration Mechanism for Plugins</a>.</li><li><code>$plugins.include</code> performs secondary filtering on registered plugins. This is a whitelist and is an array that supports shorthand notation for plugin names.</li><li><code>$plugins.exclude</code> performs secondary filtering on registered plugins. This is a blacklist and is an array that supports shorthand notation for plugin names.</li></ul><h3 id="config" tabindex="-1"><code>$config</code> <a class="header-anchor" href="#config" aria-label="Permalink to &quot;\`$config\`&quot;">​</a></h3><p>Automatically parsed plugin configurations. Generally, this is only needed during plugin development. If it is an application, it is recommended to use <code>$app</code> to manage configurations.</p><h3 id="app-or-application" tabindex="-1"><code>$app</code> or <code>$application</code> <a class="header-anchor" href="#app-or-application" aria-label="Permalink to &quot;\`$app\` or \`$application\`&quot;">​</a></h3><p>There is no special function here. It is only suggested that the application&#39;s own configuration be grouped together to prevent confusion with command line options. For example:</p><div class="language-yml vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">yml</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">$app</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">:</span></span>
<span class="line"><span style="--shiki-light:#22863A;--shiki-dark:#85E89D;">  port</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">1234</span></span></code></pre></div><h3 id="input" tabindex="-1"><code>$input</code> <a class="header-anchor" href="#input" aria-label="Permalink to &quot;\`$input\`&quot;">​</a></h3><p>The purpose of this is when implementing commands that support piping, <code>$input</code> can automatically receive the output of previous commands, regardless of whether it is the output of Semo plugins, but the format of the output is uncertain and needs to be verified and constrained by the current command itself.</p><h3 id="_0" tabindex="-1"><code>$0</code> <a class="header-anchor" href="#_0" aria-label="Permalink to &quot;\`$0\`&quot;">​</a></h3><p>This is built into <code>yargs</code>, indicating the name of the current script being run.</p><h3 id="command" tabindex="-1"><code>$command</code> <a class="header-anchor" href="#command" aria-label="Permalink to &quot;\`$command\`&quot;">​</a></h3><p>This contains information about the current command. Generally, its usefulness is not very significant.</p><h3 id="semo" tabindex="-1"><code>$semo</code> <a class="header-anchor" href="#semo" aria-label="Permalink to &quot;\`$semo\`&quot;">​</a></h3><p>This contains a reference to the utility function library <code>Utils</code>. The main reason for using this is that sometimes plugins also want to know and process internal information. However, if a plugin depends on and imports <code>@semo/core</code> internally, due to different positions, it actually occupies two separate memories, and the imported part is missing necessary information due to lack of initialization. By using <code>argv.$semo.Utils.getInternalCache().get(&#39;argv&#39;)</code>, you can correctly obtain the runtime data.</p><h2 id="built-in-configuration-management-methods" tabindex="-1">Built-in Configuration Management Methods <a class="header-anchor" href="#built-in-configuration-management-methods" aria-label="Permalink to &quot;Built-in Configuration Management Methods&quot;">​</a></h2><h3 id="utils-extendconfig" tabindex="-1"><code>Utils.extendConfig</code> <a class="header-anchor" href="#utils-extendconfig" aria-label="Permalink to &quot;\`Utils.extendConfig\`&quot;">​</a></h3><p>This method supports extending a new configuration file, which allows for configuration file groups without putting all configurations in <code>.semorc.yml</code>, while also supporting environment configurations. For example:</p><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">Utils.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">extendConfig</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;application.yml&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">)</span></span></code></pre></div><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span>application.yml</span></span>
<span class="line"><span>application.development.yml</span></span>
<span class="line"><span>application.production.yml</span></span></code></pre></div><h3 id="utils-config" tabindex="-1"><code>Utils.config</code> <a class="header-anchor" href="#utils-config" aria-label="Permalink to &quot;\`Utils.config\`&quot;">​</a></h3><p>This method is used to extract a section of the total configuration, with all sections extracted by default, based on Lodash&#39;s <code>_.get</code> method.</p><h3 id="utils-pluginconfig" tabindex="-1"><code>Utils.pluginConfig</code> <a class="header-anchor" href="#utils-pluginconfig" aria-label="Permalink to &quot;\`Utils.pluginConfig\`&quot;">​</a></h3><p>This method is used to extract plugin configurations and only works in the <code>handler</code> of commands. By default, it still takes precedence over command line parameters, but if the command line parameters are not specified and there is no default value, plugin-level configurations can be obtained.</p><h2 id="setting-environment-variables-env" tabindex="-1">Setting Environment Variables <code>.env</code> <a class="header-anchor" href="#setting-environment-variables-env" aria-label="Permalink to &quot;Setting Environment Variables \`.env\`&quot;">​</a></h2><p>By integrating <code>dotenv</code>, we have introduced support for the <code>.env</code> file, which is enabled by default for command line tools. For programs, you need to enable it manually.</p><div class="language-typescript vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">typescript</span><pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">import</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> { Utils } </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">from</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &#39;@semo/core&#39;</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">Utils.</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">useDotEnv</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">()</span></span></code></pre></div>`,82),n=[s];function t(o,l,p,c,r,d){return e.openBlock(),e.createElementBlock("div",null,n)}const m=i(a,[["render",t]]);export{u as __pageData,m as default};