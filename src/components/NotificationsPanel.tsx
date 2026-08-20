import { useMemo, useState } from 'react'
import { NotificationItem } from '../data/mockData'

interface NotificationsPanelProps {
  notifications: NotificationItem[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onOpenRequest: (requestId: string) => void
}

export function NotificationsPanel({ notifications, onMarkRead, onMarkAllRead, onOpenRequest }: NotificationsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const unreadCount = notifications.filter((n) => !n.read).length
  const visibleNotifications = useMemo(
    () => (filter === 'unread' ? notifications.filter((n) => !n.read) : notifications),
    [filter, notifications],
  )

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm shadow-slate-950/20">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Notificaciones</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">Bandeja del usuario</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-2xl border px-3 py-2 text-xs transition ${filter === 'all' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-200'}`}
          >
            Todas ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-2xl border px-3 py-2 text-xs transition ${filter === 'unread' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-200'}`}
          >
            No leidas ({unreadCount})
          </button>
          <button
            type="button"
            onClick={onMarkAllRead}
            className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
          >
            Marcar todas leidas
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {visibleNotifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-6 text-sm text-slate-500">
            No tienes notificaciones por ahora.
          </div>
        ) : (
          visibleNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border px-4 py-3 ${notification.read ? 'border-slate-800 bg-slate-950/50' : 'border-emerald-500/40 bg-emerald-500/10'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-100">{notification.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(notification.createdAt).toLocaleString()} · De: {notification.fromUser ?? 'Sistema'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {notification.requestId ? (
                    <button
                      type="button"
                      onClick={() => onOpenRequest(notification.requestId as string)}
                      className="rounded-xl border border-sky-600/40 bg-sky-500/10 px-3 py-1 text-xs text-sky-200"
                    >
                      Ir al pedido
                    </button>
                  ) : null}
                  {!notification.read ? (
                    <button
                      type="button"
                      onClick={() => onMarkRead(notification.id)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200"
                    >
                      Leida
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">Leida</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
