semo-plugin-application
------------------------

This is a convention plugin for application commands, this plugin suggest developers to put application level commands under `semo application` command, and keep `semo help` clean.

It means you agree with the convension if you install this plugin .

## Usage

Suppose you have already init the project using `Semo`, you can use this command in this steps.

```
yarn add semo-plugin-application
semo create command application/test --extend=application
semo create command application/build --extend=application
semo create command application/deploy --extend=application
semo create command application/other --extend=application
```

There are builtin commands, `test`, `build`, `deploy`, if you don't like there commands, you can set `disabled=true` in your extended commands to hide these commands.

To use these commands:

```
semo application|app test
semo application|app build
semo application|app deploy
semo application|app other
```

you can even add more levels of commands in your project.

```
semo create command application/level1/level2/command --extend=application
```

## License

MIT