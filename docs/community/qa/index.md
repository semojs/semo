---
sidebar: auto
---

# Frequently Asked Questions

## `Semo` is a bit slow, how can I optimize it?

Compared to some scripts with simpler and more straightforward logic, Semo considers many flexibility settings, including but not limited to multi-layer scanning of plugins, configuration override rules, hook mechanisms, etc. Among these, the biggest impact comes from the I/O burden of plugin scanning. Some optimizations have already shown some effect.

Furthermore, up to now, the focus has been on exploring the various possibilities of `Semo` in business development. Performance issues haven't been a major concern yet, so the priority has been on exploring and accommodating various possibilities.

Speed can be further increased by narrowing the plugin scan scope:

```
semo status --disable-global-plugin --disable-home-plugin
```

If you don't want to type this every time, you can put it in the `.semorc.yml` file:

```yml
--disable-global-plugin: true
--disable-home-plugin: true
```

or

```yml
disableGlobalPlugin: true
disableHomePlugin: true
```

## Can `Semo` directly run `Typescript` commands?

Simply put, no. If it could, wouldn't it become `Deno`? However, under specific conditions, it is possible. Here are the steps:

**1. Your project should have the `typescript` and `tsx` packages**

`ts-node` could also be an option here, but testing showed `tsx` has better compatibility.

```
pnpm add typescript tsx -D
```

**2. Initialize tsconfig.json**

```
npx tsc --init
```

**You can configure it as needed, but the minimum required change is:**

```
"target": "es6",
```

The reason is that the transformed code contains `async/await`.

**3. Configure a scripts command in `package.json`**

```
"scripts": {
    "semo": "tsx ./node_modules/@semo/cli/lib/bin.js"
}
```

**4. Modify `.semorc.yml`**

Add support for typescript:

```
typescript: true
```

**5. Finally, create a TypeScript command-line script**

```
semo g command test
pnpm semo test
```

Lastly, this method is more suitable for defining local commands. Performance is slower than executing compiled code, but the development experience is better. We can even choose not to build the Semo code at all and only execute it locally under tsx.
