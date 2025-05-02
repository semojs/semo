# Project Integration

Integrating with existing business projects was the original intention behind `Semo` development. If a project already has a custom and functional command-line tool, it should be carefully considered whether to switch to the `Semo` style. Fortunately, integrating with `Semo` is relatively simple. If the project lacks command-line infrastructure, it's recommended to give `Semo` a try.

## Why Integrate

- **Access to Command-line Infrastructure:** Every project has operations that are not suitable or feasible to perform in the backend. Through a command-line tool, interactions with the system and data become simpler.
- **Access to Scripting Infrastructure:** Some scripts need to be executed, and common requirements include naming, location, and how to interact with business or data.
- **Ability to Use Related Semo Plugins:** Configure and influence plugin behavior.
- **Access to a Business-related REPL Environment:** Invoke methods encapsulated in the project or interact with encapsulated infrastructure.

## Project Integration Methods

Not all features are necessarily needed; use them as needed.

### 1. Add `Semo` as a Project Dependency

Using `yarn` as an example:

```
yarn add @semo/cli
```

### 2. Initialize in the Project Root Directory

```
semo init [--typescript]
```

Determine whether the project is based on TypeScript. If so, include the `--typescript` parameter. The initialization process creates a configuration file `.semorc.yml` in the project's root directory and adds a `bin/semo` directory. In theory, this should not conflict with existing projects.

### 3. Add Some Commands or Scripts

```
semo generate command xxx
semo generate script yyy
```

### 4. Define Project-specific Plugins

Following the progressive development concept, if a plugin is only intended for use within the project, it can be considered part of the project code. Once it matures, it can easily be converted into an npm package for sharing with other projects.

```
semo generate plugin zzz
```

### 5. Inject Business Code into the REPL Environment

Refer to "Plugin Development->Example 2: Implement hook_repl" to see how methods are injected into the REPL. Note that all methods can only be injected into the Semo object in the REPL variable space, which protects the REPL variable space. For business methods, import them and return them according to the format requirements of `hook_repl`. To make the methods effective, you need to handle the dependencies of the methods on the environment, such as database connections.
