#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const Utils = require('./src/common/utils')
const plugins = Utils.getAllPluginsMapping()
const config = Utils.getCombinedConfig()
const yargs = require('yargs').config(config)
console.log(config)
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
if (config.commandDir) {
  yargs.commandDir(path.resolve(process.cwd(), config.commandDir))
}

// eslint-disable-next-line
yargs
  .demandCommand(1, 'You need at least one command before moving on')
  .help('help')
  .alias('h', 'help')
  .argv
