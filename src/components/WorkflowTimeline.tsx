import { ArrowRight, Box, Search, Wrench, Hammer, ShieldCheck, CheckCircle2, PackageSearch } from 'lucide-react'

const iconMap: Record<string, JSX.Element> = {
  ingresado: <Box className="h-5 w-5" />,
  en_inspeccion: <Search className="h-5 w-5" />,
  pedido_repuestos: <PackageSearch className="h-5 w-5" />,
  en_reparacion: <Wrench className="h-5 w-5" />,
  preparacion: <Hammer className="h-5 w-5" />,
  control_calidad: <ShieldCheck className="h-5 w-5" />,
  finalizado: <CheckCircle2 className="h-5 w-5" />,
}

function StepIcon({ stepId }: { stepId: string }) {
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-slate-200">
      {iconMap[stepId] || <Box className="h-5 w-5" />}
    </span>
  )
}

interface WorkflowTimelineProps {
  steps: Array<{ id: string; label: string; count: number }>
}

export function WorkflowTimeline({ steps }: WorkflowTimelineProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm shadow-slate-950/20">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Flujo de estados</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">Proceso principal del vehículo</h2>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex min-w-[220px] flex-col rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <StepIcon stepId={step.id} />
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {step.count}
              </span>
            </div>
            <p className="mt-5 text-sm text-slate-400">{step.label}</p>
            {index < steps.length - 1 && (
              <div className="mt-5 flex items-center gap-2 text-slate-500">
                <ArrowRight className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.18em]">Siguiente</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
