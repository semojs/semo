# Project Integration

Integrating with existing business projects was the original intention of `Semo`'s development. If a project already has a custom command-line tool that works well, careful consideration should be given to whether switching to the `Semo` style is necessary. Fortunately, `Semo` integration is relatively simple. If the project previously lacked command-line infrastructure, trying `Semo` is recommended.

## Why Integrate

- Gain command-line infrastructure. A project always has some operations that are unsuitable for or haven't been implemented in the backend. A command-line tool allows for simpler interaction with the system and data.
- Gain script infrastructure. There are always scripts that need execution. Common requirements include determining script names, locations, and how they interact with business logic or data.
- Utilize relevant `Semo` plugins and influence/change their behavior through configuration.
- Obtain a business-related `REPL` environment, allowing arbitrary calls to encapsulated methods within the project or interaction with encapsulated infrastructure.

## Project Integration Methods

Not all features may be necessary; use them as needed.

### 1. Add `Semo` as a project dependency

Here's an example using `pnpm`:

```
pnpm add -g @semo/cli
```

### 2. Initialize in the project root directory

```
semo init [--typescript]
```

Check if the project is built using Typescript. If so, include the `--typescript` parameter. The initialization process creates a configuration file `.semorc.yml` in the project root directory and adds a `bin/semo` directory. Theoretically, this should not conflict with the existing project.

### 3. Add some commands or scripts

```
semo generate command xxx
semo generate script yyy // Requires installing the semo-plugin-script plugin
```

### 4. Define project-specific plugins

Similar to the concept of progressive development, if a plugin is only used within its own project, it can be part of the project code. Once optimized and mature, it can easily be converted into an npm package format for sharing with other projects.

```
semo generate plugin zzz
```

### 5. Inject business code into the REPL environment

Refer to `Plugin Development -> Example 2: Implement hook_repl` to see how methods are injected into the `REPL`. Note that all methods can only be injected into the REPL's Semo object; this protects the REPL's variable namespace. For business methods, simply import them and return according to the format requirements of `hook_repl`. To make the methods effective, you also need to handle their environmental dependencies yourself, such as database connections, etc.
