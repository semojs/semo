---
sidebar: auto
---
# Frequently Asked Questions

## Why is `Semo` so slow and how can it be optimized?

Compared to some scripts with relatively simple and pure logic, Semo considers many flexible settings, including but not limited to multi-layer scanning of plugins, configuration override rules, hook mechanisms, and so on. Among them, the most significant impact comes from the IO burden of plugin scanning. Currently, some optimizations have been made (such as introducing internal caching), which have had some effects. If the scanning results of plugins are thoroughly persisted, further performance improvements can be achieved, but this is a double-edged sword and requires consideration of update mechanisms. Continuous optimization will be carried out in the future.

Furthermore, up to now, various possibilities of `Semo` in business development are being explored, and the temporary performance issues have not had a significant impact. Therefore, more emphasis is placed on exploring and compatibility with various possibilities.

Speed can be further improved by narrowing down the scope of plugin scanning:

```bash
semo status --disable-global-plugin --disable-home-plugin
```

If you don't want to enter it every time, you can put it in the `.semorc.yml` file:

```yaml
--disable-global-plugin: true
--disable-home-plugin: true
```

or

```yaml
disableGlobalPlugin: true
disableHomePlugin: true
```

## Can `Semo` directly run `Typescript` commands?

Simply put, no, if it could, wouldn't it be `Deno`? However, it is possible under special conditions. Here are the steps:

**1. There should be `typescript` and `ts-node` packages in the project**

```bash
yarn add typescript ts-node -D
```

**2. Initialize tsconfig.json**

```bash
npx tsc --init
```

**Configuration should be modified according to needs. The minimum required configuration here is:**

```json
"target": "es6"
```

The reason is that the converted code contains `async/await`.

**3. Configure a scripts command in package.json**

```json
"scripts": {
    "semo": "node --require ts-node/register ./node_modules/@semo/cli/lib/bin.js"
}
```

**4. Modify `.semorc.yml`**

Add support for Typescript

```yaml
typescript: true
```

**5. Finally, create a TypeScript command line script**

```bash
semo g command test
yarn semo test
```

This approach is more suitable for defining local commands. The performance is slower than executing compiled code, but the development experience is better. Generally, the most commonly used method is to let Semo execute the compiled commands.

