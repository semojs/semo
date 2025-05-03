import {
  ArgvExtraOptions,
  colorize,
  error,
  info,
  parsePackageNames,
  success,
  warn,
} from '@semo/core'
import path from 'path'
import shell from 'shelljs'
import { Argv } from 'yargs'
import _ from 'lodash'
import { existsSync } from 'node:fs'

export const plugin = 'semo'
export const command = 'create <name> [repo] [branch]'
export const aliases = 'c'
export const desc = 'Create a new project from specific repo'

export const builder = function (yargs: Argv) {
  yargs.positional('name', {
    type: 'string',
    describe: 'Project name',
    demandOption: true,
  })
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

export const handler = async function (
  argv: ArgvExtraOptions & { [key: string]: any }
) {
  const scriptName = argv.scriptName || 'semo'
  argv.repo = argv.repo || ''
  argv.branch = argv.branch || 'main'
  argv.tag = argv.tag ? _.castArray(argv.tag) : []

  try {
    if (existsSync(path.resolve(process.cwd(), argv.name))) {
      if (argv.force) {
        shell.rm('-rf', path.resolve(process.cwd(), argv.name))
        warn(`Existed ${argv.name} is deleted before creating a new one!`)
      } else if (!argv.merge) {
        error(`Destination existed, command abort!`)
      }
    }

    if (argv.merge) {
      // Nothing happened.
      shell.cd(argv.name)
    } else {
      if (argv.template) {
        // Fetch repos from hook
        let repos: any = await argv.$core.invokeHook(
          `${scriptName}:create_project_template`
        )
        // Combine repos with config
        Object.assign(repos, argv.$core.getPluginConfig('create.template', {}))

        if (Object.keys(repos).length === 0) {
          error('No pre-defined repos available.')
        }

        Object.keys(repos).forEach((key) => {
          if (_.isObject(repos[key] as any)) {
            repos[key].tags = repos[key].tags
              ? _.castArray(repos[key].tags)
              : []
            if (!repos[key].name) {
              repos[key].name = key.replace(/_/g, '-')
            }
          } else if (_.isString(repos[key])) {
            repos[key] = {
              repo: repos[key],
              name: key.replace(/_/g, '-'),
              description: '',
              branch: 'main',
              tags: [],
            }
          }
        })

        if (argv.tag && argv.tag.length > 0) {
          repos = _.pickBy(repos, (repo) => {
            if (repo.tags) {
              repo.tags = _.castArray(repo.tags)
              return _.intersection(repo.tags, argv.tag).length > 0
            } else {
              return false
            }
          })
        }

        const template = repos[argv.template]
          ? argv.template
          : Object.keys(repos).find(
              (key) =>
                repos[key].name && repos[key].name.indexOf(argv.template) > -1
            )
        if (template && repos[template]) {
          argv.repo = repos[template].repo || error('Repo not found')
          argv.branch = repos[template].branch || 'main'
        } else {
          const answer: any = await argv.$prompt.select({
            message: `Please choose a pre-defined repo to continue:`,
            choices: Object.keys(repos).map((key) => {
              return {
                name: `${colorize('green', repos[key].name)} ${repos[key].tags
                  .map((tag) => colorize('white.bgGreen', ` ${tag} `))
                  .join(' ')}: ${colorize('white', repos[key].repo)}${
                  repos[key].description ? '\n  ' + repos[key].description : ''
                }`,
                value: key,
              }
            }),
          })

          argv.repo = repos[answer].repo || error('Repo not found')
          argv.branch = repos[answer].branch || 'main'
        }
      } else if (argv.empty || !argv.repo) {
        shell.mkdir('-p', path.resolve(process.cwd(), argv.name))
        shell.cd(argv.name)

        if (argv.yarn) {
          if (argv.yes) {
            shell.exec('yarn init -y')
          } else {
            shell.exec('yarn init')
          }
        } else {
          if (argv.yes) {
            shell.exec('npm init -y')
          } else {
            shell.exec('npm init')
          }
        }

        shell.exec(`echo "node_modules" > .gitignore`)

        if (argv.initGit) {
          shell.exec('git init')
          success('New .git directory has been created!')
        }
      }

      if (argv.repo && argv.name) {
        info(`Downloading from ${argv.repo}`)
        try {
          shell.exec(
            `git clone ${argv.repo} ${argv.name} --single-branch --depth=1 --branch ${argv.branch} --progress`
          )

          success('Succeeded!')
          shell.cd(argv.name)
          const packageFound = existsSync('package.json')
          const yarnFound = existsSync('yarn.lock')
          const pnpmFound = existsSync('pnpm-lock.yaml')
          const npmFound = existsSync('package-lock.json')
          shell.rm('-rf', path.resolve(process.cwd(), `.git`))
          success('.git directory removed!')

          if (packageFound) {
            if (yarnFound) {
              if (shell.which('yarn')) {
                shell.exec('yarn')
              } else {
                warn('yarn not found, use npm instead')
                shell.exec('npm install')
              }
            } else if (pnpmFound) {
              if (shell.which('pnpm')) {
                shell.exec('pnpm install')
              } else {
                warn('pnpm not found, use npm instead')
                shell.exec('npm install')
              }
            } else if (npmFound) {
              shell.exec('npm install')
            } else {
              shell.exec('npm install')
            }
          }

          if (argv.initGit) {
            shell.exec('git init')
            success('New .git directory has been created!')
          }
        } catch (e) {
          if (argv.verbose) {
            error(e)
          } else {
            error(e.message)
          }
        }
      }
    }

    // add packages
    const addPackage = parsePackageNames(argv.add)
    const addPackageDev = parsePackageNames(argv.addDev)
    const yarnFound = existsSync('yarn.lock')
    const pnpmFound = existsSync('pnpm-lock.yaml')
    const npmFound = existsSync('package-lock.json')
    if (addPackage.length > 0) {
      if (yarnFound) {
        shell.exec(`yarn add ${addPackage.join(' ')}`)
      } else if (pnpmFound) {
        shell.exec(`pnpm install ${addPackage.join(' ')}`)
      } else if (npmFound) {
        shell.exec(`npm install ${addPackage.join(' ')}`)
      }
    }

    if (addPackageDev.length > 0) {
      if (yarnFound) {
        shell.exec(`yarn add ${addPackageDev.join(' ')} -D`)
      } else if (pnpmFound) {
        shell.exec(`pnpm install ${addPackageDev.join(' ')} --save-dev`)
      } else if (npmFound) {
        shell.exec(`npm install ${addPackageDev.join(' ')} --save-dev`)
      }
    }

    // init basic structure
    if (argv.initSemo) {
      let initExtra: string = ''
      if (yarnFound) {
        initExtra = '--pm yarn'
      } else if (pnpmFound) {
        initExtra = '--pm pnpm'
      } else if (npmFound) {
        initExtra = '--pm npm'
      }
      if (argv.name.indexOf(`${argv.scriptName}-plugin-`) === 0) {
        shell.exec(`${argv.scriptName} init --plugin --force ${initExtra}`)
      } else {
        shell.exec(`${argv.scriptName} init --force  ${initExtra}`)
      }
      success('Initial basic structure complete!')
    }

    if (process.platform === 'win32') {
      // TODO: fix this
    } else if (process.platform === 'darwin') {
      // change package.json attributes
      shell.exec(
        `sed -i '' 's/"name": ".*"/"name": "${argv.name}"/' package.json`
      )
    } else {
      shell.exec(`sed -i 's/"name": ".*"/"name": "${argv.name}"/' package.json`)
    }
  } catch (e) {
    if (argv.verbose) {
      error(e)
    } else {
      error(e.message)
    }
  }
}
