import { Truck, Droplet, Cog, CheckCircle } from 'lucide-react'

const iconMap: Record<string, JSX.Element> = {
  Truck: <Truck className="h-5 w-5" />,
  Droplet: <Droplet className="h-5 w-5" />,
  Cog: <Cog className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
}

interface DailyMetricsPanelProps {
  metrics: Array<{
    label: string
    value: number
    icon: string
  }>
}

export function DailyMetricsPanel({ metrics }: DailyMetricsPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm shadow-slate-950/20">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Indicadores del día</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-100">Avance de operaciones</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-800 text-slate-200">
              {iconMap[metric.icon as keyof typeof iconMap]}
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-100">{metric.value}</p>
              <p className="text-sm text-slate-500">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
