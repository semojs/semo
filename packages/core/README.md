# @semo/core

This is the core of Semo, provide core methods for @semo/cli and other Semo plugins.

## Usage

```ts
import { Utils } from "@semo/core";
```

## For now still not support ESM, so some package should not be upgraded.

- chalk
- find-up
- get-stdin
- json-stringify-pretty-compact

The main reason Semo do not use ESM is because yargs.commandDir is not work with ESM. I hope Semo is a dynamic CLI solution, but ESM is mostly static to parse.
