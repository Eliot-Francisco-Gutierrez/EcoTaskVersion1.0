const priorityStyles: Record<string, string> = {
  Alta: 'bg-rose-500/15 text-rose-300',
  Media: 'bg-amber-500/15 text-amber-300',
  Baja: 'bg-slate-500/15 text-slate-400',
}

interface TasksPanelProps {
  tasks: {
    id: string
    title: string
    priority: 'Alta' | 'Media' | 'Baja'
    assignedTo: string
    dueDate: string
  }[]
  showAll?: boolean
  onToggleShowAll?: () => void
}

export function TasksPanel({ tasks, showAll = false, onToggleShowAll }: TasksPanelProps) {
  const visibleTasks = showAll ? tasks : tasks.slice(0, 3)

  return (
    <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.25)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Tareas pendientes</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">Prioridad del día</h2>
        </div>
        <button
          type="button"
          onClick={onToggleShowAll}
          className="rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:bg-slate-900"
        >
          {showAll ? 'Ver menos' : 'Ver todas'}
        </button>
      </div>

      <div className="space-y-4">
        {visibleTasks.length === 0 ? (
          <div className="rounded-[24px] border border-slate-800 bg-slate-950/70 px-4 py-8 text-center text-slate-500">
            No hay tareas recientes. Crea una tarea desde el módulo de Tareas.
          </div>
        ) : (
          visibleTasks.map((task) => (
            <div key={task.id} className="rounded-[24px] border border-slate-800 bg-slate-950/70 p-4 transition duration-200 hover:border-slate-700 hover:bg-slate-950/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-100">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500">Asignado a {task.assignedTo}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${priorityStyles[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-400">
                <span>Fecha límite</span>
                <span className="font-medium text-slate-300">{task.dueDate}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
