import {
  ArgvExtraOptions,
  colorize,
  error,
  info,
  parsePackageNames,
  success,
  warn,
} from '@semo/core'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'path'
import { Argv } from 'yargs'

export const plugin = 'semo'
export const command = 'create <name> [repo] [branch]'
export const aliases = 'c'
export const desc = 'Create a new project from specific repo'

function commandExists(cmd: string): boolean {
  return spawnSync('which', [cmd], { stdio: 'ignore' }).status === 0
}

function detectPackageManager(cwd: string): 'yarn' | 'pnpm' | 'npm' {
  if (existsSync(path.resolve(cwd, 'yarn.lock'))) return 'yarn'
  if (existsSync(path.resolve(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  return 'npm'
}

function runInstall(pm: string, cwd: string): void {
  if (pm !== 'npm' && !commandExists(pm)) {
    warn(`${pm} not found, use npm instead`)
    pm = 'npm'
  }
  spawnSync(pm, ['install'], { stdio: 'inherit', cwd })
}

function addPackages(
  pm: string,
  packages: string[],
  dev: boolean,
  cwd: string
): void {
  if (packages.length === 0) return
  if (pm !== 'npm' && !commandExists(pm)) {
    warn(`${pm} not found, use npm instead`)
    pm = 'npm'
  }
  if (pm === 'yarn') {
    spawnSync('yarn', dev ? ['add', ...packages, '-D'] : ['add', ...packages], {
      stdio: 'inherit',
      cwd,
    })
  } else {
    spawnSync(
      pm,
      dev ? ['install', ...packages, '--save-dev'] : ['install', ...packages],
      { stdio: 'inherit', cwd }
    )
  }
}

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
  argv.tag = argv.tag ? (Array.isArray(argv.tag) ? argv.tag : [argv.tag]) : []

  try {
    const projectDir = path.resolve(process.cwd(), argv.name)

    if (existsSync(projectDir)) {
      if (argv.force) {
        rmSync(projectDir, { recursive: true, force: true })
        warn(`Existed ${argv.name} is deleted before creating a new one!`)
      } else if (!argv.merge) {
        error('Destination existed, command abort!')
        return
      }
    }

    if (argv.merge) {
      process.chdir(projectDir)
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
          return
        }

        for (const [key, value] of Object.entries(repos)) {
          if (typeof value === 'object' && value !== null) {
            const repo = value as any
            repo.tags = repo.tags
              ? Array.isArray(repo.tags)
                ? repo.tags
                : [repo.tags]
              : []
            if (!repo.name) {
              repo.name = key.replace(/_/g, '-')
            }
          } else if (typeof value === 'string') {
            repos[key] = {
              repo: value,
              name: key.replace(/_/g, '-'),
              description: '',
              branch: 'main',
              tags: [],
            }
          }
        }

        if (argv.tag.length > 0) {
          repos = Object.fromEntries(
            Object.entries(repos).filter(([, repo]: [string, any]) => {
              return repo.tags?.some((tag: string) => argv.tag.includes(tag))
            })
          )
        }

        const template = repos[argv.template]
          ? argv.template
          : Object.keys(repos).find((key) =>
              repos[key].name?.includes(argv.template)
            )

        if (template && repos[template]) {
          if (!repos[template].repo) {
            error('Repo not found')
            return
          }
          argv.repo = repos[template].repo
          argv.branch = repos[template].branch || 'main'
        } else {
          const answer: any = await argv.$prompt.select({
            message: 'Please choose a pre-defined repo to continue:',
            choices: Object.keys(repos).map((key) => {
              return {
                name: `${colorize('green', repos[key].name)} ${repos[key].tags
                  .map((tag: string) => colorize('white.bgGreen', ` ${tag} `))
                  .join(' ')}: ${colorize('white', repos[key].repo)}${
                  repos[key].description ? '\n  ' + repos[key].description : ''
                }`,
                value: key,
              }
            }),
          })

          if (!repos[answer].repo) {
            error('Repo not found')
            return
          }
          argv.repo = repos[answer].repo
          argv.branch = repos[answer].branch || 'main'
        }
      } else if (argv.empty || !argv.repo) {
        mkdirSync(projectDir, { recursive: true })

        const initArgs = argv.yes ? ['init', '-y'] : ['init']
        spawnSync('npm', initArgs, { stdio: 'inherit', cwd: projectDir })
        writeFileSync(path.resolve(projectDir, '.gitignore'), 'node_modules\n')

        if (argv.initGit) {
          spawnSync('git', ['init'], { stdio: 'inherit', cwd: projectDir })
          success('New .git directory has been created!')
        }

        process.chdir(projectDir)
      }

      if (argv.repo && argv.name) {
        info(`Downloading from ${argv.repo}`)

        const cloneResult = spawnSync(
          'git',
          [
            'clone',
            argv.repo,
            argv.name,
            '--single-branch',
            '--depth=1',
            '--branch',
            argv.branch,
            '--progress',
          ],
          { stdio: 'inherit' }
        )

        if (cloneResult.status !== 0) {
          error('Git clone failed!')
          return
        }

        success('Succeeded!')
        process.chdir(projectDir)

        const hasPackageJson = existsSync('package.json')
        rmSync(path.resolve(projectDir, '.git'), {
          recursive: true,
          force: true,
        })
        success('.git directory removed!')

        if (hasPackageJson) {
          const pm = detectPackageManager(projectDir)
          runInstall(pm, projectDir)
        }

        if (argv.initGit) {
          spawnSync('git', ['init'], { stdio: 'inherit', cwd: projectDir })
          success('New .git directory has been created!')
        }
      }
    }

    // Add packages
    const pm = detectPackageManager(process.cwd())
    addPackages(pm, parsePackageNames(argv.add), false, process.cwd())
    addPackages(pm, parsePackageNames(argv.addDev), true, process.cwd())

    // Init semo structure
    if (argv.initSemo) {
      const isPlugin = argv.name.startsWith(`${scriptName}-plugin-`)
      spawnSync(
        scriptName,
        ['init', '--force', ...(isPlugin ? ['--plugin'] : []), '--pm', pm],
        { stdio: 'inherit' }
      )
      success('Initial basic structure complete!')
    }

    // Update package name in package.json
    const pkgPath = path.resolve(process.cwd(), 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      pkg.name = argv.name
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (argv.verbose) {
      error(e)
    } else {
      error(msg)
    }
  }
}
