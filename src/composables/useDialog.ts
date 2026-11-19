// App-wide confirm / alert dialogs in FitAccess style, replacing the browser's
// native confirm() and alert(). Rendered once by <AppDialog /> in App.vue.
//
//   if (!(await confirmDialog({ title: 'Delete role?', message: '…', danger: true }))) return
//   await alertDialog('Saved.')
import { reactive } from 'vue'

export type DialogTone = 'default' | 'danger' | 'success' | 'error'

export interface DialogOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  /** Red confirm button for destructive actions */
  danger?: boolean
  tone?: DialogTone
}

interface DialogState {
  open: boolean
  kind: 'confirm' | 'alert'
  title: string
  message: string
  confirmText: string
  cancelText: string
  tone: DialogTone
}

export const dialogState = reactive<DialogState>({
  open: false,
  kind: 'confirm',
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: 'Cancel',
  tone: 'default',
})

let resolver: ((ok: boolean) => void) | null = null

function show(kind: 'confirm' | 'alert', opts: DialogOptions): Promise<boolean> {
  // A dialog already open is answered "no" so its caller never hangs
  resolver?.(false)
  Object.assign(dialogState, {
    open: true,
    kind,
    title: opts.title ?? (kind === 'confirm' ? 'Are you sure?' : ''),
    message: opts.message,
    confirmText: opts.confirmText ?? (kind === 'confirm' ? 'Confirm' : 'OK'),
    cancelText: opts.cancelText ?? 'Cancel',
    tone: opts.tone ?? (opts.danger ? 'danger' : 'default'),
  })
  return new Promise<boolean>((resolve) => {
    resolver = resolve
  })
}

export function answerDialog(ok: boolean) {
  dialogState.open = false
  const r = resolver
  resolver = null
  r?.(ok)
}

export function confirmDialog(opts: DialogOptions | string): Promise<boolean> {
  return show('confirm', typeof opts === 'string' ? { message: opts } : opts)
}

export async function alertDialog(opts: DialogOptions | string): Promise<void> {
  await show('alert', typeof opts === 'string' ? { message: opts } : opts)
}
