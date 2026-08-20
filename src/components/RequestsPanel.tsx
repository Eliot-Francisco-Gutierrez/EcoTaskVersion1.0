import { RequestItem } from '../data/mockData'

interface RequestsPanelProps {
  requests: RequestItem[]
  onCompleteRequest?: (id: string) => void
  onExportHistory?: () => void
  highlightedRequestId?: string | null
}

export function RequestsPanel({ requests, onCompleteRequest, onExportHistory, highlightedRequestId = null }: RequestsPanelProps) {
  return (
    <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.25)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Solicitudes recientes</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">Actividad reciente</h2>
        </div>
        {onExportHistory ? (
          <button
            type="button"
            onClick={onExportHistory}
            className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
          >
            Exportar historial
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-[24px] border border-slate-800 bg-slate-950/70 px-4 py-8 text-center text-slate-500">
            No hay solicitudes recientes. Envía un pedido desde cualquier módulo para verlo aquí.
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className={`rounded-[24px] border px-4 py-4 transition ${highlightedRequestId === request.id ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10' : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950/80'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-100">{request.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{request.description}</p>
                  {(request.requestType || request.requestedBy || request.assignedTo) ? (
                    <p className="mt-2 text-xs text-slate-400">
                      Tipo: {request.requestType ?? 'Solicitud'} · Solicitó: {request.requestedBy ?? request.operator ?? '—'} · Delegado a: {request.assignedTo ?? '—'}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-2xl px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${request.badgeColor}`}>
                    {request.timeAgo}
                  </span>
                  {onCompleteRequest ? (
                    <button
                      type="button"
                      onClick={() => onCompleteRequest(request.id)}
                      className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 transition hover:border-emerald-500/50 hover:bg-slate-800"
                    >
                      Finalizar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
