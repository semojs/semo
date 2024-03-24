# Introduction

Semo is a command-line development framework, built on top of the excellent `yargs` package with encapsulation and extension. Semo aims not to solve problems such as parsing command-line options and parameters, defining commands, and triggering commands, but to standardize and specify how to implement them in business scenarios. This ensures a consistent command-line architecture for numerous Node microservice projects within a company, while also providing various extension features.

## Principles

- **Consistency**: Regardless of the framework used in Node projects or how abstraction is layered, this framework can be used to implement command-line scripts with a unified style.
- **Extensibility**: Plugins can be extended, commands can be overridden, configurations can be overwritten, and the hook mechanism can interact with hooks defined by built-in or third-party plugins.
- **Efficiency**: Simple to get started with, high development efficiency, consistent style, high maintenance efficiency, frequent use, and high work efficiency.

## Features

- Few but powerful core concepts, including plugins, commands, scripts, configurations, hooks, etc.
- Plugins, commands, and configurations can be extended or overridden according to conventions.
- Provides an extensible REPL environment and supports `await`.
- Child commands can be added to commands defined by other plugins.
- Provides a simple code generation mechanism; basic plugin, command, and script boilerplate code can be automatically generated, with support for extensions.
- Supports plugins with npm organization package name format.

## Origin of the Name

As is well known, naming is hard. Semo is a concept born out of the spark in my mind, translated from various languages, meaning "seed" in Esperanto, symbolizing a starting point and hope.

## Conventions

- All example code is based on `Typescript`. Although the core of `Semo` is also written in `Typescript`, `Semo` supports projects written purely in `js`, as explained in the configuration management section.
- The documentation assumes that `semo` and `yarn` are globally installed in the environment and does not explicitly mention them in specific chapters.
- The development environment of this project is `Mac`, and the runtime environment is either the local machine or the container environment online. It has not been tested on `Windows` and may have compatibility issues.