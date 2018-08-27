#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const co = require('co')
const Utils = require('./src/common/utils')
const plugins = Utils.getAllPluginsMapping()
const config = Utils.getCombinedConfig()
const argv = require('yargs').argv
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

co(function * () {
  let beforeHooks = yield Utils.invokeHook('beforeCommand')
  Object.keys(beforeHooks).map(function (hook) {
    beforeHooks[hook](argv)
  })

  // eslint-disable-next-line
  yargs
    .help('help')
    .alias('h', 'help')
    .exitProcess(false)
    .argv

  let afterHooks = yield Utils.invokeHook('afterCommand')
  Object.keys(afterHooks).map(function (hook) {
    afterHooks[hook](argv)
  })
}).catch(function (err) {
  console.error(err)
})
