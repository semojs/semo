Use terminal to cd in this directory, then:

```
zignis repl
>>> argv
```

You can see:

```
{
  ...
  config1Style1: 'a1',
  config1Style2: 'a2',
  config1Style3: 'a3',
  config1Style4: 'a4',
  config2Style1: 'b1',
  config2Style2: 'b2',
  config2Style3: 'b3',
  config2Style4: 'b4',
  config3Style1: 'c1',
  config3Style2: 'c2',
  config3Style3: 'c3',
  config3Style4: 'c4',
  ...
}
```

That means you can use this way to control code behaviours when you write your own custom commands.

If you see different from above results, maybe you have global configs at `~/.zignis/.zignisrc.json`.

