import { Bell, Mail, LayoutGrid, Menu } from 'lucide-react'

interface TopHeaderProps {
  onMenuToggle: () => void
  userName: string
  userAvatar?: string
  onNotify: () => void
  onMessages: () => void
  onDashboard?: () => void
  unreadNotifications?: number
}

export function TopHeader({ onMenuToggle, userName, userAvatar, onNotify, onMessages, onDashboard, unreadNotifications = 0 }: TopHeaderProps) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)

  return (
    <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.4)] backdrop-blur-xl">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <button
              type="button"
              onClick={onMenuToggle}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-950/80 text-slate-200 transition hover:border-emerald-500/60 hover:bg-slate-900 xl:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-300">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              Estado activo
            </span>
            <span className="hidden text-slate-400 sm:inline">sector vehículos 08</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-100">¡{greeting}, {userName}!</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Resumen general del sector vehículos 08
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <button className="inline-flex max-w-[240px] items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-left text-xs font-medium leading-tight text-slate-200 shadow-inner shadow-slate-950/30 transition hover:border-slate-600 hover:bg-slate-900 sm:text-sm">
            <span className="break-words">{formattedDate}</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNotify}
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-950/80 text-slate-200 transition hover:border-emerald-500/60 hover:bg-slate-900"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[10px] font-semibold text-slate-950 shadow-lg shadow-emerald-500/30">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={onMessages}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-950/80 text-slate-200 transition hover:border-sky-500/60 hover:bg-slate-900"
            >
              <Mail className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onDashboard}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-950/80 text-slate-200 transition hover:border-violet-500/60 hover:bg-slate-900"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
