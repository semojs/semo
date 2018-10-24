#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const co = require('co')
const Utils = require('./src/common/utils')
const plugins = Utils.getAllPluginsMapping()
const config = Utils.getCombinedConfig()
const yargs = require('yargs').config(config)

// Load local commands
yargs.commandDir('src/commands')

// Load plugin commands
if (plugins) {
  Object.keys(plugins).map(function (plugin) {
    if (fs.existsSync(path.resolve(plugins[plugin], 'src/commands'))) {
      yargs.commandDir(path.resolve(plugins[plugin], 'src/commands'))
    }
  })
}

// Load application commands
if (config.commandDir && fs.existsSync(config.commandDir)) {
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
    .argv

  let afterHooks = yield Utils.invokeHook('afterCommand')
  Object.keys(afterHooks).map(function (hook) {
    afterHooks[hook](parsedArgv)
  })
}).catch(function () {})
