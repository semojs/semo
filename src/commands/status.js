
const Utils = require('../common/utils')

exports.command = 'status [key]'
exports.aliases = 'st'
exports.desc = 'Show Zignis status'

exports.builder = function (yargs) {
}

exports.handler = function (argv) {
  const plugins = Utils.getAllPluginsMapping()
  const columns = []

  switch (argv.key) {
    case 'plugins':
      Object.keys(plugins).map((plugin) => columns.push([plugin, plugins[plugin]]))
      break
    default:
      if (argv.key) {

      } else {
        columns.push(['platform', process.platform])
        columns.push(['node', process.version])
        columns.push(['plugins', Object.keys(plugins).join(', ')])
      }
      break
  }

  Utils.outputTable(columns)
}
