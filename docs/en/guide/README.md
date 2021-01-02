# Introduction

Semo is a CLI framework, based on excellent `yargs`. Semo do not want to do CLI parsing jobs, defining commands, but giving rules about how to use `yargs`, so it's easy to used in your Node.js projects, provide consitent CLI style and flexibility. 

## Principles

- **Consistency**: No matter what framework used and how structured, you can use this package to implement consistent command line scripts.
- **Flexibility**: You can extend by plugins, you can override commands, config, and you can hook with core or other plugins.
- **Efficiency**: The command rule is simple, so it easy to use, if you use it frequently, it can dramatically improve you performant.

## Features

- Core concepts are less, just plugin, command, script, config, and hook.
- Plugin, command, config all can be extended or overriden.
- Provide a useful REPL environment, support `await`.
- Add sub commands for other plugins's commands.
- Provide a simple code generator rule, support plugin, command generator.
- Plugin is by name convention.

## Name story

Semo is from World language, the meaning is like `tinder` in English.

## About this doc

- Semo support `Typescript` and `Javascript`, but demo code in this doc mostly use `Typescript` style.
- By default, suppose `semo` and `yarn` are installed already.
- This is a personal project, only tested on `Mac` and `Linux`, but not `Windows`.