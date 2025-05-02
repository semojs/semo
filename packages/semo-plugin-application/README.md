## semo-plugin-application

This is a convention plugin for application commands, this plugin suggest developers to put application level commands under `semo application` command, and keep `semo help` clean.

It means you agree with the convension if you install this plugin .

## Usage

Suppose you have already init the project using `Semo`, you can use this command in this steps.

```
yarn add semo-plugin-application
semo generate command application/test --extend=application
semo generate command application/build --extend=application
semo generate command application/deploy --extend=application
semo generate command application/other --extend=application
```

To use these commands:

```
semo application|app test
semo application|app build
semo application|app deploy
semo application|app other
```

you can even add more levels of commands in your project.

```
semo generate command application/level1/level2/command --extend=application
```

## License

MIT
