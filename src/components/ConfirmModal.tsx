import React from 'react'

type Props = {
  open: boolean
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmModal: React.FC<Props> = ({ open, title = 'Confirmar', message, onConfirm, onCancel }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.15)]">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white">Cancelar</button>
          <button onClick={onConfirm} className="rounded-2xl bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f8b3f]">Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
