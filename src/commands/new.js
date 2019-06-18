const fs = require('fs')
const path = require('path')

const shell = require('shelljs')

const { Utils } = require('..')

exports.command = 'new <name> [repo] [branch]'
exports.aliases = 'n'
exports.desc = 'Create a new project from specific repo'

exports.builder = function (yargs) {
  yargs.option('yarn', {
    default: false,
    describe: 'use yarn command'
  })

  yargs.option('yes', {
    alias: 'y',
    describe: 'run npm/yarn init with --yes'
  })

  yargs.option('force', {
    alias: 'f',
    describe: 'force download, existed folder will be deleted!'
  })

  yargs.option('merge', {
    alias: 'm',
    describe: 'merge config with exist project folder!'
  })

  yargs.option('empty', {
    describe: 'force empty project, ignore repo'
  })

  yargs.option('select', {
    alias: 's',
    describe: 'select from default repos'
  })

  yargs.option('add', {
    default: false,
    describe: 'add npm package to package.json dependencies'
  })

  yargs.option('add-dev', {
    default: false,
    describe: 'add npm package to package.json devDependencies'
  })

  yargs.option('init', {
    alias: 'i',
    describe: 'init new project use Zignis'
  })
}

exports.handler = function (argv) {
  argv.repo = argv.repo || Utils._.get(Utils.getCombinedConfig(), 'commandDefault.new.repo') || ''
  argv.branch = argv.branch || Utils._.get(Utils.getCombinedConfig(), 'commandDefault.new.branch') || 'master'

  Utils.co(function * () {
    if (fs.existsSync(path.resolve(process.cwd(), argv.name))) {
      if (argv.force) {
        shell.rm('-rf', path.resolve(process.cwd(), argv.name))
        Utils.warn(`Existed ${argv.name} is deleted before creating a new one!`)
      } else if (!argv.merge) {
        Utils.error(`Destination existed, command abort!`)
      }
    }

    if (argv.merge) {
      // Nothing happened.
      shell.cd(argv.name)
    } else {
      if (argv.empty || !argv.repo) {
        shell.mkdir('-p', path.resolve(process.cwd(), argv.name))
        shell.cd(argv.name)
        if (argv.yarn) {
          if (argv.yes) {
            Utils.exec('yarn init -y')
          } else {
            Utils.exec('yarn init')
          }
        } else {
          if (argv.yes) {
            Utils.exec('npm init -y')
          } else {
            Utils.exec('npm init')
          }
        }

        Utils.exec(`echo "node_modules" > .gitignore`)
        Utils.exec('git init')
        Utils.success('New .git directory has been created!')
      } else {
        if (argv.select) {
          const defaultRepos = yield Utils.invokeHook('new_repo')
          if (Object.keys(defaultRepos).length === 0) {
            Utils.error('No pre-defined repos available.')
          }
          const select = defaultRepos[argv.select] ? argv.select : Object.keys(defaultRepos).find(key => defaultRepos[key].alias && defaultRepos[key].alias.indexOf(argv.select) > -1)
          if (defaultRepos[select]) {
            argv.repo = defaultRepos[select].repo || Utils.error('Repo not found')
            argv.branch = defaultRepos[select].branch || 'master'
          } else {
            const answers = yield Utils.inquirer
              .prompt([
                {
                  type: 'list',
                  name: 'selected',
                  message: `Please choose a pre-defined repo to continue:`,
                  choices: Object.keys(defaultRepos).map(key => {
                    return { name: `${key} [${defaultRepos[key].alias.join(', ')}]`, value: key }
                  }),
                  validate: function (answers) {
                    if (answers.length < 1) {
                      return 'Please choose at least one.'
                    }
                    return true
                  }
                }
              ])

            argv.repo = defaultRepos[answers.selected].repo || Utils.error('Repo not found')
            argv.branch = defaultRepos[answers.selected].branch || 'master'
          }
        }

        Utils.info(`Downloading from ${argv.repo}`)
        try {
          Utils.exec(`git clone ${argv.repo} ${argv.name} --single-branch --depth=1 --branch ${argv.branch} --progress`)

          Utils.success('Succeeded!')
          shell.cd(argv.name)
          shell.rm('-rf', path.resolve(process.cwd(), `.git`))
          Utils.success('.git directory removed!')
          if (argv.yarn) {
            Utils.exec('yarn')
          } else {
            Utils.exec('npm install')
          }

          Utils.exec('git init')
          Utils.success('New .git directory has been created!')
        } catch (e) {
          Utils.error(e.message)
        }
      }
    }

    // add packages
    const addPackage = Utils.parsePackageNames(argv.add)
    const addPackageDev = Utils.parsePackageNames(argv.addDev)
    if (addPackage.length > 0) {
      if (argv.yarn) {
        Utils.exec(`yarn add ${addPackage.join(' ')}`)
      } else {
        Utils.exec(`npm install ${addPackage.join(' ')}`)
      }
    }

    if (addPackageDev.length > 0) {
      if (argv.yarn) {
        Utils.exec(`yarn add ${addPackageDev.join(' ')} -D`)
      } else {
        Utils.exec(`npm install ${addPackageDev.join(' ')} --save-dev`)
      }
    }

    // init basic zignis structure
    if (argv.init) {
      const initExtra = argv.yarn ? '--yarn' : ''
      if (argv.name.indexOf('zignis-plugin-') === 0) {
        Utils.exec(`zignis init --exec-mode --plugin --force ${initExtra}`)
      } else {
        Utils.exec(`zignis init --exec-mode --force  ${initExtra}`)
      }
      Utils.success('Initial basic zignis structure complete!')
    }
  }).catch(e => Utils.error(e.stack))
}
