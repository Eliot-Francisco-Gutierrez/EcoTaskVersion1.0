import { Car, Wrench, Package, ClipboardList, Droplet, Camera } from 'lucide-react'

const iconMap = {
  Car: Car,
  Wrench: Wrench,
  Package: Package,
  ClipboardList: ClipboardList,
  Droplet: Droplet,
  Camera: Camera,
}

interface KpiCardsProps {
  metrics: Array<{
    id: string
    label: string
    value: number | null
    accent: string
    icon: string
  }>
}

export function KpiCards({ metrics }: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = iconMap[metric.icon as keyof typeof iconMap]
        return (
          <div
            key={metric.id}
            className="group rounded-[24px] border border-slate-800 bg-slate-900/80 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">
                  {metric.value === null ? '-' : metric.value}
                </p>
              </div>
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/5 ${metric.accent}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
