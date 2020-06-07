import path from 'path'
import { Utils } from '@semo/core'

export const command = 'create <name> [repo] [branch]'
export const aliases = 'c'
export const desc = 'Create a new project from specific repo'

export const builder = function(yargs) {
  yargs.option('yarn', {
    default: false,
    describe: 'Use yarn command'
  })

  yargs.option('yes', {
    default: true,
    alias: 'y',
    describe: 'Run npm/yarn init with --yes'
  })

  yargs.option('force', {
    alias: 'F',
    describe: 'Force download, existed folder will be deleted!'
  })

  yargs.option('merge', {
    alias: 'M',
    describe: 'Merge config with exist project folder!'
  })

  yargs.option('empty', {
    alias: 'E',
    describe: 'Force empty project, ignore repo'
  })

  yargs.option('template', {
    alias: 'T',
    describe: 'Select from registered template repos'
  })

  yargs.option('add', {
    default: false,
    alias: 'A',
    describe: 'Add npm package to package.json dependencies'
  })

  yargs.option('add-dev', {
    default: false,
    alias: 'D',
    describe: 'Add npm package to package.json devDependencies'
  })

  yargs.option('init-semo', {
    alias: 'i',
    describe: 'Init new project'
  })

  yargs.option('init-git', {
    default: true,
    describe: 'Init a git repo'
  })
}

export const handler = async function(argv: any) {
  argv.repo = argv.repo || ''
  argv.branch = argv.branch || 'master'

  try {
    if (Utils.fileExistsSyncCache(path.resolve(process.cwd(), argv.name))) {
      if (argv.force) {
        Utils.shell.rm('-rf', path.resolve(process.cwd(), argv.name))
        Utils.warn(`Existed ${argv.name} is deleted before creating a new one!`)
      } else if (!argv.merge) {
        Utils.error(`Destination existed, command abort!`)
      }
    }

    if (argv.merge) {
      // Nothing happened.
      Utils.shell.cd(argv.name)
    } else {
      if (argv.template) {
        const defaultRepos = await Utils.invokeHook('create_project_template')
        if (Object.keys(defaultRepos).length === 0) {
          Utils.error('No pre-defined repos available.')
        }
        const template = defaultRepos[argv.template]
          ? argv.template
          : Object.keys(defaultRepos).find(
              key => defaultRepos[key].alias && defaultRepos[key].alias.join('|').indexOf(argv.template) > -1
            )
        if (template && defaultRepos[template]) {
          argv.repo = defaultRepos[template].repo || Utils.error('Repo not found')
          argv.branch = defaultRepos[template].branch || 'master'
        } else {
          const answers: any = await Utils.inquirer.prompt([
            {
              type: 'list',
              name: 'selected',
              message: `Please choose a pre-defined repo to continue:`,
              choices: Object.keys(defaultRepos).map(key => {
                return { name: `${defaultRepos[key].alias.join(', ')}`, value: key }
              })
            }
          ])

          argv.repo = defaultRepos[answers.selected].repo || Utils.error('Repo not found')
          argv.branch = defaultRepos[answers.selected].branch || 'master'
        }
      } else if (argv.empty || !argv.repo) {
        Utils.shell.mkdir('-p', path.resolve(process.cwd(), argv.name))
        Utils.shell.cd(argv.name)
        argv.yarn = Utils.fileExistsSyncCache('yarn.lock')
        if (argv.yarn) {
          Utils.info('yarn.lock found, use yarn for package management.')
        }
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

        if (argv.initGit) {
          Utils.exec('git init')
          Utils.success('New .git directory has been created!')
        }
      }

      if (argv.repo && argv.name) {
        Utils.info(`Downloading from ${argv.repo}`)
        try {
          Utils.exec(`git clone ${argv.repo} ${argv.name} --single-branch --depth=1 --branch ${argv.branch} --progress`)
  
          Utils.success('Succeeded!')
          Utils.shell.cd(argv.name)
          argv.yarn = Utils.fileExistsSyncCache('yarn.lock')
          if (argv.yarn) {
            Utils.info('yarn.lock found, use yarn for package management.')
          }
          Utils.shell.rm('-rf', path.resolve(process.cwd(), `.git`))
          Utils.success('.git directory removed!')
          if (argv.yarn) {
            Utils.exec('yarn')
          } else {
            Utils.exec('npm install')
          }
  
          if (argv.initGit) {
            Utils.exec('git init')
            Utils.success('New .git directory has been created!')
          }
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

    // init basic structure
    if (argv.initSemo) {
      const initExtra = argv.yarn ? '--yarn' : ''
      if (argv.name.indexOf(`${argv.scriptName}-plugin-`) === 0) {
        Utils.exec(`${argv.scriptName} init --exec-mode --plugin --force ${initExtra}`)
      } else {
        Utils.exec(`${argv.scriptName} init --exec-mode --force  ${initExtra}`)
      }
      Utils.success('Initial basic structure complete!')
    }
  } catch(e) {
    Utils.error(e.stack)
  }
}
