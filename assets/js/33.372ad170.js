(window.webpackJsonp=window.webpackJsonp||[]).push([[33],{314:function(e,t,a){"use strict";a.r(t);var s=a(14),n=Object(s.a)({},(function(){var e=this,t=e._self._c;return t("ContentSlotsDistributor",{attrs:{"slot-key":e.$parent.slotKey}},[t("h1",{attrs:{id:"plugin-development"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#plugin-development"}},[e._v("#")]),e._v(" Plugin Development")]),e._v(" "),t("h2",{attrs:{id:"quick-start"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#quick-start"}},[e._v("#")]),e._v(" Quick Start")]),e._v(" "),t("p",[e._v("A "),t("code",[e._v("Semo")]),e._v(" plugin is essentially a standard "),t("code",[e._v("Node")]),e._v(" module, albeit with some conventions regarding directory and file structure. These conventions can be challenging to remember, so we provide various auxiliary tools for plugin developers or tool users, such as code generation. Here, we describe the recommended plugin development process. However, once you're familiar with the development process, you can also manually build a plugin from an empty directory.")]),e._v(" "),t("h3",{attrs:{id:"step-1-create-plugin-directory-based-on-template"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#step-1-create-plugin-directory-based-on-template"}},[e._v("#")]),e._v(" Step 1: Create Plugin Directory Based on Template")]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[e._v("semo create semo-plugin-xyz "),t("span",{pre:!0,attrs:{class:"token parameter variable"}},[e._v("--template")]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v("plugin\n")])])]),t("p",[e._v("Here, we use the built-in plugin template. As mentioned earlier in configuration management, you can override the "),t("code",[e._v("repo")]),e._v(" and "),t("code",[e._v("branch")]),e._v(" options or the "),t("code",[e._v("--template")]),e._v(" option to avoid passing default parameters each time.")]),e._v(" "),t("h3",{attrs:{id:"step-2-enter-plugin-directory-and-execute-default-command-to-confirm-everything-is-fine"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#step-2-enter-plugin-directory-and-execute-default-command-to-confirm-everything-is-fine"}},[e._v("#")]),e._v(" Step 2: Enter Plugin Directory and Execute Default Command to Confirm Everything is Fine")]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[t("span",{pre:!0,attrs:{class:"token builtin class-name"}},[e._v("cd")]),e._v(" semo-plugin-xyz\nsemo hi\n")])])]),t("p",[e._v("This is a command built into the plugin template. After initialization, you can execute it by entering the directory, confirming the initial interaction with the plugin command. If you see it respond with "),t("code",[e._v("Hey you!")]),e._v(", everything is ready, and you can proceed to write scripts that will truly change the world.")]),e._v(" "),t("h2",{attrs:{id:"adding-commands"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#adding-commands"}},[e._v("#")]),e._v(" Adding Commands")]),e._v(" "),t("p",[e._v("It's worth noting that this plugin template is based on "),t("code",[e._v("Typescript")]),e._v(", so you need some "),t("code",[e._v("Typescript")]),e._v(" basics. We recommend keeping the "),t("code",[e._v("yarn watch")]),e._v(" command running during development to compile in real-time while developing and testing simultaneously.")]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[e._v("semo generate "),t("span",{pre:!0,attrs:{class:"token builtin class-name"}},[e._v("command")]),e._v(" xyz\n")])])]),t("p",[e._v("Typically, there's a correlation between the plugin name and the commands it encapsulates. Here, we add an "),t("code",[e._v("xyz")]),e._v(" command, but you can also modify the existing "),t("code",[e._v("hi")]),e._v(" command. Once you've mastered plugin development, it's advisable to remove the default "),t("code",[e._v("hi")]),e._v(" command.")]),e._v(" "),t("h2",{attrs:{id:"implementing-hooks"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#implementing-hooks"}},[e._v("#")]),e._v(" Implementing Hooks")]),e._v(" "),t("p",[e._v("Implementing hooks is another purpose of plugin development. Hooks are often defined by other plugins or business projects, and implementing hooks can influence and change the behavior of other plugins.")]),e._v(" "),t("p",[e._v("Use the following command to query which hooks are supported in the current environment:")]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[e._v("semo hook list\n")])])]),t("h3",{attrs:{id:"example-1-implementing-hook-create-project-template"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#example-1-implementing-hook-create-project-template"}},[e._v("#")]),e._v(" Example 1: Implementing "),t("code",[e._v("hook_create_project_template")])]),e._v(" "),t("div",{staticClass:"language-typescript extra-class"},[t("pre",{pre:!0,attrs:{class:"language-typescript"}},[t("code",[t("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// src/hooks/index.ts")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("export")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" semo__hook_create_project_template "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n  demo_repo"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n    repo"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token string"}},[e._v("'demo_repo.git'")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n    branch"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token string"}},[e._v("'master'")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n    alias"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("[")]),t("span",{pre:!0,attrs:{class:"token string"}},[e._v("'demo'")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("]")]),e._v("\n  "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n")])])]),t("p",[e._v("With this hook, we can select a custom project template when executing the "),t("code",[e._v("semo create [PROJECT] --template")]),e._v(" command, just by remembering the alias, without needing to remember the address. Another advantage is that you don't need to manage how each engineer sets the global "),t("code",[e._v("--repo")]),e._v(" option on their personal computer. As long as the specified plugin is installed, everyone can initialize projects with the same project alias.")]),e._v(" "),t("h3",{attrs:{id:"example-2-implementing-hook-repl"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#example-2-implementing-hook-repl"}},[e._v("#")]),e._v(" Example 2: Implementing "),t("code",[e._v("hook_repl")])]),e._v(" "),t("div",{staticClass:"language-typescript extra-class"},[t("pre",{pre:!0,attrs:{class:"language-typescript"}},[t("code",[t("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// src/hooks/index.ts")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("export")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token function-variable function"}},[e._v("semo__hook_repl")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=>")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n  "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("return")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n    "),t("span",{pre:!0,attrs:{class:"token function-variable function"}},[e._v("add")]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("async")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),e._v("a"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v(" b"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=>")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n      "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("return")]),e._v(" a "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("+")]),e._v(" b\n    "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v("\n    "),t("span",{pre:!0,attrs:{class:"token function-variable function"}},[e._v("multiple")]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("async")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),e._v("a"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(",")]),e._v(" b"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=>")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n      "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("return")]),e._v(" a "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("*")]),e._v(" b\n    "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n  "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n")])])]),t("p",[e._v("Then, in the REPL environment, you can use these:")]),e._v(" "),t("div",{staticClass:"custom-block tip"},[t("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),t("p",[e._v("Information returned by "),t("code",[e._v("hook_repl")]),e._v(" is injected into the Semo object in the REPL.")])]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[e._v("semo repl\n"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(">>")]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(">")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token function"}},[e._v("add")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("[")]),e._v("Function: add"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("]")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(">>")]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(">")]),e._v(" await Semo.add"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),t("span",{pre:!0,attrs:{class:"token number"}},[e._v("1")]),e._v(", "),t("span",{pre:!0,attrs:{class:"token number"}},[e._v("2")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token number"}},[e._v("3")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(">>")]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(">")]),e._v(" multiple\n"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("[")]),e._v("Function: multiple"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("]")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(">>")]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(">")]),e._v(" await Semo.multiple"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),t("span",{pre:!0,attrs:{class:"token number"}},[e._v("3")]),e._v(", "),t("span",{pre:!0,attrs:{class:"token number"}},[e._v("4")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token number"}},[e._v("12")]),e._v("\n")])])]),t("p",[e._v("The motivations behind implementing this hook differ between plugins and business projects. Business projects generally inject specific business logic, while plugins typically inject common methods with some degree of reusability, such as injecting instance methods of underlying services, commonly used libraries, etc. For example, the "),t("code",[e._v("Utils")]),e._v(" core injection contains the "),t("code",[e._v("lodash")]),e._v(" library.")]),e._v(" "),t("h2",{attrs:{id:"exposing-methods"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#exposing-methods"}},[e._v("#")]),e._v(" Exposing Methods")]),e._v(" "),t("p",[e._v("Another primary purpose of implementing plugins is to expose instances, methods, or libraries externally. In this case, we can define modules in a standard way, for example:")]),e._v(" "),t("div",{staticClass:"custom-block warning"},[t("p",{staticClass:"custom-block-title"},[e._v("WARNING")]),e._v(" "),t("p",[e._v("Since "),t("code",[e._v("Semo")]),e._v(" later introduced the "),t("code",[e._v("run")]),e._v(" command, which depends on the entry file for locating, it requires plugins of "),t("code",[e._v("Semo")]),e._v(" to declare an entry, regardless of whether this entry exposes methods.")])]),e._v(" "),t("div",{staticClass:"language-json extra-class"},[t("pre",{pre:!0,attrs:{class:"language-json"}},[t("code",[t("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// package.json")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n  "),t("span",{pre:!0,attrs:{class:"token property"}},[e._v('"main"')]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token string"}},[e._v('"lib/index.js"')]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n")])])]),t("div",{staticClass:"language-typescript extra-class"},[t("pre",{pre:!0,attrs:{class:"language-typescript"}},[t("code",[t("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// index.js")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("export")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token function-variable function"}},[e._v("func")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=>")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n")])])]),t("p",[e._v("This approach is fine, but typically, modules defined in this way don't need to adhere to "),t("code",[e._v("Semo")]),e._v("'s conventions. As long as they comply with "),t("code",[e._v("node")]),e._v(" and "),t("code",[e._v("npm")]),e._v(" standards, they are acceptable. Here, "),t("code",[e._v("Semo")]),e._v(" defines another way to expose methods based on the hook mechanism.")]),e._v(" "),t("div",{staticClass:"language-typescript extra-class"},[t("pre",{pre:!0,attrs:{class:"language-typescript"}},[t("code",[t("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// src/hooks/index.ts")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("export")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" semo__hook_component "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("async")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n  "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("return")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n    a"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token string"}},[e._v("'b'")]),e._v("\n  "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n")])])]),t("p",[e._v("Usage:")]),e._v(" "),t("div",{staticClass:"language-typescript extra-class"},[t("pre",{pre:!0,attrs:{class:"language-typescript"}},[t("code",[t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("import")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v(" Utils "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("from")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token string"}},[e._v("'@semo/core'")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("const")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v(" a "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token keyword"}},[e._v("await")]),e._v(" Utils"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(".")]),t("span",{pre:!0,attrs:{class:"token function"}},[e._v("invokeHook")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),t("span",{pre:!0,attrs:{class:"token string"}},[e._v("'semo:component'")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token builtin"}},[e._v("console")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(".")]),t("span",{pre:!0,attrs:{class:"token function"}},[e._v("log")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("(")]),e._v("a"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(")")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// -> 'b'")]),e._v("\n")])])]),t("p",[e._v("With this approach, we can encapsulate some common methods of business projects for cross-project use. These common methods typically lean towards the lower level, such as various middlewares or underlying services.")]),e._v(" "),t("h2",{attrs:{id:"publishing-plugins"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#publishing-plugins"}},[e._v("#")]),e._v(" Publishing Plugins")]),e._v(" "),t("p",[e._v("After using commands, hooks, or")]),e._v(" "),t("p",[e._v("library extensions, we've developed a "),t("code",[e._v("Semo")]),e._v(" plugin. If you want to share your plugin with others, you need to do some preparation work.")]),e._v(" "),t("h3",{attrs:{id:"_1-upload-code-to-a-git-repository"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#_1-upload-code-to-a-git-repository"}},[e._v("#")]),e._v(" 1. Upload Code to a Git Repository")]),e._v(" "),t("p",[e._v("If it's open-source, you can choose "),t("code",[e._v("Github")]),e._v(". If it's an internal plugin, upload it to an internal repository, which could be a private "),t("code",[e._v("Github")]),e._v(" repository or a company "),t("code",[e._v("Gitlab")]),e._v(" repository.")]),e._v(" "),t("h3",{attrs:{id:"_2-modify-package-json"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#_2-modify-package-json"}},[e._v("#")]),e._v(" 2. Modify "),t("code",[e._v("package.json")])]),e._v(" "),t("p",[e._v("Mainly modify the package name, version, license, repository address, homepage address, etc.")]),e._v(" "),t("p",[e._v("If it's an internal plugin, you can modify the "),t("code",[e._v("registry")]),e._v(" address in the "),t("code",[e._v(".npmrc")]),e._v(" file.")]),e._v(" "),t("h3",{attrs:{id:"_3-obtain-an-account-for-the-npm-registry-and-log-in"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#_3-obtain-an-account-for-the-npm-registry-and-log-in"}},[e._v("#")]),e._v(" 3. Obtain an Account for the npm Registry and Log In")]),e._v(" "),t("p",[e._v("For open-source plugins, you can register at "),t("code",[e._v("https://npmjs.org")]),e._v(". For privately deployed npm repositories, you can get an account from your operations team.")]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[t("span",{pre:!0,attrs:{class:"token function"}},[e._v("npm")]),e._v(" login "),t("span",{pre:!0,attrs:{class:"token parameter variable"}},[e._v("--registry")]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("[")]),e._v("YOUR_REGISTRY"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("]")]),e._v("\n")])])]),t("h3",{attrs:{id:"_4-test-the-plugin-package"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#_4-test-the-plugin-package"}},[e._v("#")]),e._v(" 4. Test the Plugin Package")]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[t("span",{pre:!0,attrs:{class:"token function"}},[e._v("npm")]),e._v(" pack --dry-run\n")])])]),t("p",[e._v("Through packaging testing, check whether the package contains any unnecessary files, and adjust the configuration of the "),t("code",[e._v(".npmignore")]),e._v(" file accordingly.")]),e._v(" "),t("h3",{attrs:{id:"_5-publish-your-plugin"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#_5-publish-your-plugin"}},[e._v("#")]),e._v(" 5. Publish Your Plugin")]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[t("span",{pre:!0,attrs:{class:"token function"}},[e._v("npm")]),e._v(" version "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("[")]),e._v("patch"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("|")]),e._v("minor"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("|")]),e._v("major"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("]")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token function"}},[e._v("npm")]),e._v(" publish\n")])])]),t("h3",{attrs:{id:"_6-promote-your-plugin-and-share-development-insights"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#_6-promote-your-plugin-and-share-development-insights"}},[e._v("#")]),e._v(" 6. Promote Your Plugin and Share Development Insights")]),e._v(" "),t("p",[e._v("Good documentation is crucial, as well as actively promoting and encouraging others to use and provide feedback on your plugin.")]),e._v(" "),t("h3",{attrs:{id:"_7-actively-maintain"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#_7-actively-maintain"}},[e._v("#")]),e._v(" 7. Actively Maintain")]),e._v(" "),t("p",[e._v("Any npm package can gradually become outdated or have security risks, so it's essential to actively maintain your plugin to ensure it functions as intended.")]),e._v(" "),t("h2",{attrs:{id:"plugin-hierarchy"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#plugin-hierarchy"}},[e._v("#")]),e._v(" Plugin Hierarchy")]),e._v(" "),t("p",[e._v("The "),t("code",[e._v("Semo")]),e._v(" plugin system scans multiple locations to increase flexibility, with each level serving different purposes and restrictions.")]),e._v(" "),t("ul",[t("li",[e._v("Installed globally via "),t("code",[e._v("npm install -g semo-plugin-xxx")]),e._v(", so commands from installed plugins are globally available. This is the default global installation method for npm packages.")]),e._v(" "),t("li",[e._v("Installed in the home directory's "),t("code",[e._v(".semo/home-plugin-cache")]),e._v(" directory via "),t("code",[e._v("semo plugin install semo-plugin-xxx")]),e._v(", and the plugin commands are also globally available. In certain cases where the current user lacks permission to install globally via npm, this method can be used.")]),e._v(" "),t("li",[e._v("Installed in the current project directory via "),t("code",[e._v("npm install semo-plugin-xxx")]),e._v(". Plugin commands installed this way are only effective within the current project.")])]),e._v(" "),t("p",[e._v("Why would some plugins need to be installed globally? Because plugins can not only fulfill our project's business requirements but also serve as part of our development toolchain or even implement some non-business functionalities. With some imagination, any terminal functionality can be implemented, either completely handwritten or encapsulated and integrated with other excellent projects. Here, excellent projects are not limited to specific languages or language extension package repositories.")]),e._v(" "),t("h2",{attrs:{id:"running-remote-plugins-directly"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#running-remote-plugins-directly"}},[e._v("#")]),e._v(" Running Remote Plugins Directly")]),e._v(" "),t("p",[e._v("This is just an illusion; it still needs to be downloaded locally, but the download directory is different, avoiding interference with your implementation. You can freely test plugins you're interested in.")]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[e._v("semo run semo-plugin-serve\n")])])]),t("p",[e._v("This plugin provides a simple HTTP service. The first time you run it, it will download, and subsequently, it will reuse the previously downloaded plugin. Use "),t("code",[e._v("--force")]),e._v(" to force an update.")]),e._v(" "),t("div",{staticClass:"custom-block tip"},[t("p",{staticClass:"custom-block-title"},[e._v("TIP")]),e._v(" "),t("p",[e._v("Subsequent development will include a feature to clean plugin caches.")])]),e._v(" "),t("h2",{attrs:{id:"special-home-directory-plugins"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#special-home-directory-plugins"}},[e._v("#")]),e._v(" Special Home Directory Plugins")]),e._v(" "),t("blockquote",[t("p",[e._v("This feature was introduced in "),t("code",[e._v("v0.8.0")])])]),e._v(" "),t("p",[e._v("To add global configurations to "),t("code",[e._v("Semo")]),e._v(", you need to add a "),t("code",[e._v(".semorc.yml")]),e._v(" configuration file in the "),t("code",[e._v("~/.semo")]),e._v(" directory. Once this configuration file is established, the "),t("code",[e._v(".semo")]),e._v(" directory is automatically recognized as a global plugin (other global plugins are in the "),t("code",[e._v(".semo/home-plugin-cache")]),e._v(" directory). Here, you can define your own commands, extend other plugins' commands, or extend other plugins' hooks, etc. This special plugin is globally recognizable. Also, because it's present by default, if you have some locally common logic and don't want to publish it as an npm package, you can quickly start here. However, be aware of its global availability, as errors here can affect the local global state.")]),e._v(" "),t("p",[e._v("We don't prescribe a specific implementation approach for this special plugin. You can use "),t("code",[e._v("js")]),e._v(" or "),t("code",[e._v("typescript")]),e._v(" to write it. You can initialize the basic directory structure using "),t("code",[e._v("semo init")]),e._v(", or regenerate a "),t("code",[e._v(".semo")]),e._v(" directory with the template using "),t("code",[e._v("semo create .semo --template=pluging")]),e._v(" (backup the "),t("code",[e._v(".semo")]),e._v(" directory in advance, then merge the contents back).")]),e._v(" "),t("h2",{attrs:{id:"recognizing-plugins-in-any-directory"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#recognizing-plugins-in-any-directory"}},[e._v("#")]),e._v(" Recognizing Plugins in Any Directory")]),e._v(" "),t("p",[e._v("We can see the "),t("code",[e._v("pluginDir")]),e._v(" configuration in the configuration file. If you manually specify this parameter on the command line, you can achieve any specific directory purpose, and it also supports multiple directories:")]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[e._v("semo "),t("span",{pre:!0,attrs:{class:"token builtin class-name"}},[e._v("help")]),e._v(" --plugin-dir"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v("dir1 --plugin-dir"),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v("dir2\n")])])]),t("p",[e._v("Additionally, it supports specifying via constants:")]),e._v(" "),t("div",{staticClass:"language-bash extra-class"},[t("pre",{pre:!0,attrs:{class:"language-bash"}},[t("code",[t("span",{pre:!0,attrs:{class:"token assign-left variable"}},[e._v("SEMO_PLUGIN_DIR")]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v("=")]),e._v("dir3 semo "),t("span",{pre:!0,attrs:{class:"token builtin class-name"}},[e._v("help")]),e._v("\n")])])]),t("h2",{attrs:{id:"issue-with-internal-plugins-defined-in-applications-in-typescript-mode"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#issue-with-internal-plugins-defined-in-applications-in-typescript-mode"}},[e._v("#")]),e._v(" Issue with Internal Plugins Defined in Applications in Typescript Mode")]),e._v(" "),t("p",[e._v("This is because "),t("code",[e._v("tsc")]),e._v(" can only recognize "),t("code",[e._v("ts")]),e._v(" and "),t("code",[e._v("js")]),e._v(" related files during compilation and cannot recognize our "),t("code",[e._v("yml")]),e._v(" format. Moreover, the official doesn't intend to support copying files other than "),t("code",[e._v("ts")]),e._v(". As "),t("code",[e._v("ts")]),e._v(" is not a complete build tool, we need to manually copy the required files. This can be achieved using "),t("code",[e._v("cpy-cli")]),e._v(" or "),t("code",[e._v("copyfiles")]),e._v(". Taking "),t("code",[e._v("copyfiles")]),e._v(" as an example:")]),e._v(" "),t("div",{staticClass:"language-json extra-class"},[t("pre",{pre:!0,attrs:{class:"language-json"}},[t("code",[t("span",{pre:!0,attrs:{class:"token comment"}},[e._v("// package.json")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n  "),t("span",{pre:!0,attrs:{class:"token property"}},[e._v('"scripts"')]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("{")]),e._v("\n    "),t("span",{pre:!0,attrs:{class:"token property"}},[e._v('"copyfiles"')]),t("span",{pre:!0,attrs:{class:"token operator"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token string"}},[e._v('"copyfiles -u 1 -a src/**/*.yml dist -E"')]),e._v("\n  "),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n"),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v("}")]),e._v("\n")])])]),t("h2",{attrs:{id:"plugin-s-active-registration-mechanism"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#plugin-s-active-registration-mechanism"}},[e._v("#")]),e._v(" Plugin's Active Registration Mechanism")]),e._v(" "),t("blockquote",[t("p",[e._v("Introduced in "),t("code",[e._v("v1.3.0")])])]),e._v(" "),t("p",[e._v("In the early days, "),t("code",[e._v("Semo")]),e._v(" only supported the automatic registration mechanism for plugins. To increase flexibility, it could traverse multiple locations, albeit with some IO performance loss. Therefore, the active registration mechanism was introduced. Once the active registration mechanism is used, the automatic registration mechanism becomes ineffective.")]),e._v(" "),t("h3",{attrs:{id:"activation-method"}},[t("a",{staticClass:"header-anchor",attrs:{href:"#activation-method"}},[e._v("#")]),e._v(" Activation Method")]),e._v(" "),t("p",[e._v("Write plugin key-value pairs in the "),t("code",[e._v("$plugins")]),e._v(" section of "),t("code",[e._v(".semorc.yml")])]),e._v(" "),t("div",{staticClass:"language-yml extra-class"},[t("pre",{pre:!0,attrs:{class:"language-yml"}},[t("code",[t("span",{pre:!0,attrs:{class:"token key atrule"}},[e._v("$plugins")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(":")]),e._v("\n  "),t("span",{pre:!0,attrs:{class:"token key atrule"}},[e._v("register")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(":")]),e._v("\n    "),t("span",{pre:!0,attrs:{class:"token key atrule"}},[e._v("plugin-a")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(":")]),e._v(" /absolute/path\n    "),t("span",{pre:!0,attrs:{class:"token key atrule"}},[e._v("plugin-b")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(":")]),e._v(" ./relative/path\n    "),t("span",{pre:!0,attrs:{class:"token key atrule"}},[e._v("plugin-c")]),t("span",{pre:!0,attrs:{class:"token punctuation"}},[e._v(":")]),e._v(" "),t("span",{pre:!0,attrs:{class:"token boolean important"}},[e._v("true")]),e._v("\n")])])]),t("p",[e._v("Three styles are supported: absolute paths, relative paths, and using Node.js module loading mechanisms for declaration. Here, the "),t("code",[e._v("semo-plugin-")]),e._v(" prefix can be omitted for plugin names used as keys. Additionally, the shorthand "),t("code",[e._v("~")]),e._v(" for the home directory is supported.")])])}),[],!1,null,null,null);t.default=n.exports}}]);