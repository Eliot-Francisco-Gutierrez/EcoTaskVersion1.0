import { Circle, Droplet, Camera, Package, ArrowRight } from 'lucide-react'

const icons: Record<string, JSX.Element> = {
  pedido_08: <Package className="h-5 w-5" />,
  lavado: <Droplet className="h-5 w-5" />,
  fotografia: <Camera className="h-5 w-5" />,
}

interface SubprocessTrackerProps {
  steps: Array<{ id: string; label: string; count: number }>
}

export function SubprocessTracker({ steps }: SubprocessTrackerProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm shadow-slate-950/20">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Subproceso 08</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">Gestión de venta y alistamiento</h2>
        </div>
      </div>

      <div className="-mx-6 overflow-x-auto px-6 pb-4">
        <div className="flex min-w-full gap-4">
          {steps.map((step, index) => (
            <div key={step.id} className="min-w-[260px] rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-800 text-slate-200">
                  {icons[step.id]}
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {step.count}
                </span>
              </div>
              <p className="mt-4 text-base font-semibold text-slate-100">{step.label}</p>
              {index < steps.length - 1 && (
                <div className="mt-4 flex items-center gap-2 text-slate-500">
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-[0.18em]">Siguiente</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
