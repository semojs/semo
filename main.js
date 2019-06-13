#!/usr/bin/env node

const { Utils } = require('.')
const debug = Utils.debug('zignis-core')
debug('zignis started')
const fs = require('fs')
const path = require('path')

const co = require('co')
const updateNotifier = require('update-notifier')
const pkg = require('./package.json')
updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 * 7 }).notify({ defer: false, isGlobal: true })
debug('zignis update notifier')
const parsedArgv = require('yargs-parser')(process.argv.slice(2))
const cache = Utils.getInternalCache()
cache.set('argv', parsedArgv)
debug('zignis set cache argv')

const config = Utils.getCombinedConfig()
const yargs = require('yargs').config(config)
const packageConfig = Utils.loadPackageInfo()
const plugins = Utils.getAllPluginsMapping()
debug('zignis get plugins')

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

debug('zignis set commands')

co(function * () {
  debug('zignis before command hook')
  let beforeHooks = yield Utils.invokeHook('beforeCommand')
  Object.keys(beforeHooks).map(function (hook) {
    beforeHooks[hook](parsedArgv, yargs)
  })

  // eslint-disable-next-line
  yargs
    .help()
    .alias('h', 'help')
    .exitProcess(false)
    .recommendCommands()
    .epilog('Find more information at https://zignis.js.org')
    .wrap(Math.min(120, yargs.terminalWidth())).argv

  let afterHooks = yield Utils.invokeHook('afterCommand')
  Object.keys(afterHooks).map(function (hook) {
    afterHooks[hook](parsedArgv, yargs)
  })
  debug('zignis after command hook')
}).catch(e => {
  if (!e.name || e.name !== 'YError') {
    Utils.error(e.stack)
  }
})
