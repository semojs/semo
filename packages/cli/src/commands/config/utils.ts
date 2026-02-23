import path from 'path'

export function resolveConfigPath(
  scriptName: string,
  global?: boolean
): string {
  if (global) {
    return process.env.HOME
      ? path.resolve(
          process.env.HOME,
          '.' + scriptName,
          '.' + scriptName + 'rc.yml'
        )
      : ''
  }
  return path.resolve(process.cwd(), '.' + scriptName + 'rc.yml')
}
