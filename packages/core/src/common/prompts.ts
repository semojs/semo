// Lazy re-exports: each function dynamically imports @inquirer/prompts on first call
// This avoids loading @inquirer/prompts at startup (~300ms savings)

import type {
  checkbox as checkboxType,
  confirm as confirmType,
  editor as editorType,
  expand as expandType,
  input as inputType,
  number as numberType,
  password as passwordType,
  rawlist as rawlistType,
  search as searchType,
  select as selectType,
} from '@inquirer/prompts'

let _mod: typeof import('@inquirer/prompts') | null = null

async function getModule() {
  if (!_mod) {
    _mod = await import('@inquirer/prompts')
  }
  return _mod
}

export const checkbox: typeof checkboxType = (async (...args: any[]) => {
  const mod = await getModule()
  return (mod.checkbox as any)(...args)
}) as any

export const confirm: typeof confirmType = (async (...args: any[]) => {
  const mod = await getModule()
  return (mod.confirm as any)(...args)
}) as any

export const editor: typeof editorType = (async (...args: any[]) => {
  const mod = await getModule()
  return (mod.editor as any)(...args)
}) as any

export const expand: typeof expandType = (async (...args: any[]) => {
  const mod = await getModule()
  return (mod.expand as any)(...args)
}) as any

export const input: typeof inputType = (async (...args: any[]) => {
  const mod = await getModule()
  return (mod.input as any)(...args)
}) as any

export const number: typeof numberType = (async (...args: any[]) => {
  const mod = await getModule()
  return (mod.number as any)(...args)
}) as any

export const password: typeof passwordType = (async (...args: any[]) => {
  const mod = await getModule()
  return (mod.password as any)(...args)
}) as any

export const rawlist: typeof rawlistType = (async (...args: any[]) => {
  const mod = await getModule()
  return (mod.rawlist as any)(...args)
}) as any

export const search: typeof searchType = (async (...args: any[]) => {
  const mod = await getModule()
  return (mod.search as any)(...args)
}) as any

export const select: typeof selectType = (async (...args: any[]) => {
  const mod = await getModule()
  return (mod.select as any)(...args)
}) as any
