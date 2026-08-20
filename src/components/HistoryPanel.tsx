import React from 'react'
import { RecordItem, Vehicle } from '../data/mockData'

type Props = {
  history: RecordItem[]
  archivedVehicles: (Vehicle & { archivedAt?: string })[]
  onExportJSON: () => void
  searchQuery: string
  onSearchChange: (value: string) => void
  dateRange: { from: string; to: string }
  onDateRangeChange: (range: { from: string; to: string }) => void
}

const HistoryPanel: React.FC<Props> = ({ history, archivedVehicles, onExportJSON, searchQuery, onSearchChange, dateRange, onDateRangeChange }) => {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Historial completo</h2>
        <div className="flex gap-2">
          <button onClick={onExportJSON} className="rounded-2xl bg-[#16a34a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0f8b3f]">Exportar JSON</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1.2fr_0.7fr_0.7fr]">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por título, vehículo o operador"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#16a34a]"
        />
        <input
          type="date"
          value={dateRange.from}
          onChange={(event) => onDateRangeChange({ ...dateRange, from: event.target.value })}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#16a34a]"
        />
        <input
          type="date"
          value={dateRange.to}
          onChange={(event) => onDateRangeChange({ ...dateRange, to: event.target.value })}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#16a34a]"
        />
      </div>
      <div className="mt-4 space-y-3">
        {history.map((h) => (
          <div key={h.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{h.title}</div>
                <div className="text-sm text-slate-600">{h.description}</div>
              </div>
              <div className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleString()}</div>
            </div>
            <div className="mt-2 text-sm text-slate-700">Vehículo: {h.vehicle ?? '—'} · Realizado por: {h.operator ?? '—'}</div>
            {(h.requestedBy || h.assignedTo || h.actionBy) ? (
              <div className="mt-1 text-xs text-slate-500">
                Solicitado por: {h.requestedBy ?? h.actionBy ?? h.operator ?? '—'} · Delegado a: {h.assignedTo ?? '—'}
              </div>
            ) : null}
            <div className="mt-1 text-xs text-slate-500">Estado registro: {h.status}</div>
          </div>
        ))}
        {history.length === 0 && <div className="text-sm text-slate-500">No hay registros aún.</div>}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900">Vehículos archivados</h3>
        <div className="mt-2 space-y-2">
          {archivedVehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 p-3">
              <div>
                <div className="font-medium text-slate-900">{v.code} · {v.model}</div>
                <div className="text-sm text-slate-600">Dueño: {v.owner}</div>
              </div>
              <div className="text-sm text-slate-500">Archivado: {v.archivedAt ? new Date(v.archivedAt).toLocaleString() : '—'}</div>
            </div>
          ))}
          {archivedVehicles.length === 0 && <div className="text-sm text-slate-500">No hay vehículos archivados.</div>}
        </div>
      </div>
    </section>
  )
}

export default HistoryPanel
