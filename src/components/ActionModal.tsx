import { X } from 'lucide-react'

export interface ActionField {
  id: string
  label: string
  placeholder?: string
  value: string | File | null
  multiline?: boolean
  type?: 'text' | 'textarea' | 'select' | 'file'
  options?: string[]
  accept?: string
}

interface ActionModalProps {
  open: boolean
  title: string
  description: string
  content?: string
  fields: ActionField[]
  onFieldChange: (id: string, value: string | File | null) => void
  onSubmit: () => void
  onClose: () => void
  submitLabel: string
}

export function ActionModal({
  open,
  title,
  description,
  content,
  fields,
  onFieldChange,
  onSubmit,
  onClose,
  submitLabel,
}: ActionModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#f7faf8] px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 px-6 py-6">
          {fields.length > 0 ? (
            fields.map((field) => (
              <div key={field.id}>
                <label className="mb-2 block text-sm font-medium text-slate-700">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={(field.value as string) ?? ''}
                    onChange={(event) => onFieldChange(field.id, event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#16a34a] focus:bg-white"
                  >
                    {field.options?.map((option) => (
                      <option key={option} value={option} className="bg-white text-slate-900">
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.multiline ? (
                  <textarea
                    value={field.value as string}
                    onChange={(event) => onFieldChange(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#16a34a] focus:bg-white"
                  />
                ) : field.type === 'file' ? (
                  <input
                    type="file"
                    accept={field.accept}
                    onChange={(event) => onFieldChange(field.id, event.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#16a34a] file:px-4 file:text-white focus:border-[#16a34a]"
                  />
                ) : (
                  <input
                    value={field.value as string}
                    onChange={(event) => onFieldChange(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-[#16a34a] focus:bg-white"
                  />
                )}
              </div>
            ))
          ) : (
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-5 text-slate-700">
              <p>{content ?? 'No hay campos para esta acción.'}</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-[#f7faf8] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-xs font-medium leading-tight text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="min-h-[44px] rounded-2xl bg-[#16a34a] px-4 py-2 text-center text-xs font-semibold leading-tight text-white transition hover:bg-[#0f8b3f] sm:text-sm"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
