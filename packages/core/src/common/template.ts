import { readFileSync } from 'node:fs'

let _hbs: typeof import('handlebars') | null = null

async function getHandlebars() {
  if (!_hbs) {
    _hbs = (await import('handlebars')).default
  }
  return _hbs
}

export async function renderTemplate(
  templatePath: string,
  data: Record<string, any>
): Promise<string> {
  const hbs = await getHandlebars()
  const source = readFileSync(templatePath, 'utf8')
  const template = hbs.compile(source)
  return template(data)
}
