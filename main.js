#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const co = require('co')
const { Utils } = require('.')
const plugins = Utils.getAllPluginsMapping()
const config = Utils.getCombinedConfig()
const yargs = require('yargs').config(config)
const packageConfig = Utils.loadPackageInfo()

const updateNotifier = require('update-notifier')
const pkg = require('./package.json')
updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 * 7 }).notify({ defer: false, isGlobal: true })

// Load local commands
if (packageConfig.name !== 'zignis') {
  yargs.commandDir('src/commands')
} else if (config.commandDir && fs.existsSync(path.resolve(process.cwd(), config.commandDir))) {
  yargs.commandDir(path.resolve(process.cwd(), config.commandDir))
}

// Load plugin commands
if (plugins) {
  Object.keys(plugins).map(function (plugin) {
    if (fs.existsSync(path.resolve(plugins[plugin], 'src/commands'))) {
      yargs.commandDir(path.resolve(plugins[plugin], 'src/commands'))
    }
  })
}

// Load application commands
if (
  packageConfig.name !== 'zignis' &&
  config.commandDir &&
  fs.existsSync(path.resolve(process.cwd(), config.commandDir))
) {
  yargs.commandDir(path.resolve(process.cwd(), config.commandDir))
}

const parsedArgv = require('yargs-parser')(process.argv.slice(2))
co(function * () {
  let beforeHooks = yield Utils.invokeHook('beforeCommand')
  Object.keys(beforeHooks).map(function (hook) {
    beforeHooks[hook](parsedArgv)
  })

  // eslint-disable-next-line
  yargs
    .help()
    .alias('h', 'help')
    .default('disable-ten-temporarily', false)
    .exitProcess(false)
    .recommendCommands()
    .epilog('Find more information at https://zignis.js.org')
    .wrap(Math.min(120, yargs.terminalWidth())).argv

  let afterHooks = yield Utils.invokeHook('afterCommand')
  Object.keys(afterHooks).map(function (hook) {
    afterHooks[hook](parsedArgv)
  })
}).catch(e => {
  if (!e.name || e.name !== 'YError') {
    Utils.error(e.stack)
  }
})
