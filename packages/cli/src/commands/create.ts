import path from 'path'
import { UtilsType } from '@semo/core'
import shell from 'shelljs'
import inquirer from 'inquirer'

export const plugin = 'semo'
export const command = 'create <name> [repo] [branch]'
export const aliases = 'c'
export const desc = 'Create a new project from specific repo'

export type COMMON_OBJECT<T = any> = {
  [key: string]: T
}

export const builder = function (yargs) {
  yargs.option('yes', {
    default: true,
    boolean: true,
    alias: 'y',
    describe: 'Run dep install with --yes',
  })

  yargs.option('force', {
    boolean: true,
    default: false,
    alias: 'F',
    describe: 'Force download, existed folder will be deleted!',
  })

  yargs.option('merge', {
    alias: 'M',
    describe: 'Merge config with exist project folder!',
  })

  yargs.option('empty', {
    alias: 'E',
    describe: 'Force empty project, ignore repo',
  })

  yargs.option('template', {
    alias: 'T',
    describe: 'Select from registered project template repos',
  })

  yargs.option('template-tag', {
    alias: 'tag',
    describe: 'Registered project template tag, work with --template',
  })

  yargs.option('add', {
    default: false,
    alias: 'A',
    describe: 'Add npm package to package.json dependencies',
  })

  yargs.option('add-dev', {
    default: false,
    alias: 'D',
    describe: 'Add npm package to package.json devDependencies',
  })

  yargs.option('init-semo', {
    alias: 'i',
    describe: 'Init new project',
  })

  yargs.option('init-git', {
    default: true,
    describe: 'Init a git repo',
  })
}

export const handler = async function (argv: any) {
  const Utils: UtilsType = argv.$semo.Utils
  const scriptName = argv.scriptName || 'semo'
  argv.repo = argv.repo || ''
  argv.branch = argv.branch || 'master'
  argv.tag = argv.tag ? Utils._.castArray(argv.tag) : []

  try {
    if (Utils.fileExistsSyncCache(path.resolve(process.cwd(), argv.name))) {
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
      if (argv.template) {
        // Fetch repos from hook
        let repos = await Utils.invokeHook<COMMON_OBJECT<COMMON_OBJECT>>(
          `${scriptName}:create_project_template`,
        )
        // Combine repos with config
        Object.assign(repos, Utils.pluginConfig('create.template', {}))

        if (Object.keys(repos).length === 0) {
          Utils.error('No pre-defined repos available.')
        }

        Object.keys(repos).forEach(key => {
          if (Utils._.isObject(repos[key])) {
            repos[key].tags = repos[key].tags
              ? Utils._.castArray(repos[key].tags)
              : []
            if (!repos[key].name) {
              repos[key].name = key.replace(/_/g, '-')
            }
          } else if (Utils._.isString(repos[key])) {
            repos[key] = {
              repo: repos[key],
              name: key.replace(/_/g, '-'),
              description: '',
              branch: 'master',
              tags: [],
            }
          }
        })

        if (argv.tag && argv.tag.length > 0) {
          repos = Utils._.pickBy(repos, (repo, key) => {
            if (repo.tags) {
              repo.tags = Utils._.castArray(repo.tags)
              return Utils._.intersection(repo.tags, argv.tag).length > 0
            } else {
              return false
            }
          })
        }

        const template = repos[argv.template]
          ? argv.template
          : Object.keys(repos).find(
              key =>
                repos[key].name && repos[key].name.indexOf(argv.template) > -1,
            )
        if (template && repos[template]) {
          argv.repo = repos[template].repo || Utils.error('Repo not found')
          argv.branch = repos[template].branch || 'master'
        } else {
          const answers: any = await inquirer.prompt([
            {
              type: 'list',
              name: 'selected',
              message: `Please choose a pre-defined repo to continue:`,
              choices: Object.keys(repos).map(key => {
                return {
                  name: `${Utils.color.green(
                    Utils.color.underline(repos[key].name),
                  )} ${repos[key].tags
                    .map(tag =>
                      Utils.color.white(Utils.color.bgGreen(` ${tag} `)),
                    )
                    .join(' ')}: ${Utils.color.white(repos[key].repo)}${
                    repos[key].description
                      ? '\n  ' + repos[key].description
                      : ''
                  }`,
                  value: key,
                }
              }),
            },
          ])

          argv.repo =
            repos[answers.selected].repo || Utils.error('Repo not found')
          argv.branch = repos[answers.selected].branch || 'master'
        }
      } else if (argv.empty || !argv.repo) {
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

        if (argv.initGit) {
          Utils.exec('git init')
          Utils.success('New .git directory has been created!')
        }
      }

      if (argv.repo && argv.name) {
        Utils.info(`Downloading from ${argv.repo}`)
        try {
          Utils.exec(
            `git clone ${argv.repo} ${argv.name} --single-branch --depth=1 --branch ${argv.branch} --progress`,
          )

          Utils.success('Succeeded!')
          shell.cd(argv.name)
          const yarnFound = Utils.fileExistsSyncCache('yarn.lock')
          const pnpmFound = Utils.fileExistsSyncCache('pnpm-lock.yaml')
          const npmFound = Utils.fileExistsSyncCache('package-lock.json')
          shell.rm('-rf', path.resolve(process.cwd(), `.git`))
          Utils.success('.git directory removed!')
          if (yarnFound) {
            Utils.exec('yarn')
          } else if (pnpmFound) {
            Utils.exec('pnpm install')
          } else if (npmFound) {
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
    const yarnFound = Utils.fileExistsSyncCache('yarn.lock')
    const pnpmFound = Utils.fileExistsSyncCache('pnpm-lock.yaml')
    const npmFound = Utils.fileExistsSyncCache('package-lock.json')
    if (addPackage.length > 0) {
      if (yarnFound) {
        Utils.exec(`yarn add ${addPackage.join(' ')}`)
      } else if (pnpmFound) {
        Utils.exec(`pnpm install ${addPackage.join(' ')}`)
      } else if (npmFound) {
        Utils.exec(`npm install ${addPackage.join(' ')}`)
      }
    }

    if (addPackageDev.length > 0) {
      if (yarnFound) {
        Utils.exec(`yarn add ${addPackageDev.join(' ')} -D`)
      } else if (pnpmFound) {
        Utils.exec(`pnpm install ${addPackageDev.join(' ')} --save-dev`)
      } else if (npmFound) {
        Utils.exec(`npm install ${addPackageDev.join(' ')} --save-dev`)
      }
    }

    // init basic structure
    if (argv.initSemo) {
      const initExtra = argv.yarn ? '--yarn' : ''
      if (argv.name.indexOf(`${argv.scriptName}-plugin-`) === 0) {
        Utils.exec(
          `${argv.scriptName} init --exec-mode --plugin --force ${initExtra}`,
        )
      } else {
        Utils.exec(`${argv.scriptName} init --exec-mode --force  ${initExtra}`)
      }
      Utils.success('Initial basic structure complete!')
    }

    if (process.platform === 'win32') {
      // TODO: fix this
    } else if (process.platform === 'darwin') {
      // change package.json attributes
      Utils.exec(
        `sed -i '' 's/"name": ".*"/"name": "${argv.name}"/' package.json`,
      )
    } else {
      Utils.exec(`sed -i 's/"name": ".*"/"name": "${argv.name}"/' package.json`)
    }
  } catch (e) {
    Utils.error(e.stack)
  }
}
