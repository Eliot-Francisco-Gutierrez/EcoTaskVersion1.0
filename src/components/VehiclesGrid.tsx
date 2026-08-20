import { Vehicle, User } from '../data/mockData'

interface VehiclesGridProps {
  vehicles: Vehicle[]
  user: User
  onEdit: (vehicleId: string) => void
  onViewDetail?: (vehicleId: string) => void
}

const statusStyles: Record<string, string> = {
  Ingresado: 'bg-[#eafaf0] text-[#0f8b3f]',
  'En inspeccion': 'bg-[#ebf4ff] text-[#1d4ed8]',
  'Pedido repuestos': 'bg-[#fff4d6] text-[#b45309]',
  'En reparacion': 'bg-[#fff1eb] text-[#c2410c]',
  Preparacion: 'bg-[#f3e8ff] text-[#7c3aed]',
  'Control calidad': 'bg-[#ecfeff] text-[#0f766e]',
  Finalizado: 'bg-[#eef2f3] text-[#475569]',
  'Pedido 08': 'bg-[#eafaf0] text-[#0f8b3f]',
  Lavado: 'bg-[#e0f2fe] text-[#0369a1]',
  Fotografia: 'bg-[#fdf2f8] text-[#be185d]',
}

const statusLabel: Record<string, string> = {
  Ingresado: 'Ingresado',
  'En inspeccion': 'En inspección',
  'Pedido repuestos': 'Pedido de repuestos',
  'En reparacion': 'En reparación',
  Preparacion: 'Preparación',
  'Control calidad': 'Control de calidad',
  Finalizado: 'Finalizado',
  'Pedido 08': 'Pedido de 08',
  Lavado: 'Lavado',
  Fotografia: 'Fotografía',
}

export function VehiclesGrid({ vehicles, user, onEdit, onViewDetail }: VehiclesGridProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Vehículos en proceso</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Seguimiento en tiempo real</h2>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {vehicles.map((vehicle) => {
          const isOwner = vehicle.owner === user.username || user.category === 'Administrador' || user.permissions.includes('all')
          const thumbnail = vehicle.photos && vehicle.photos.length ? vehicle.photos[0] : vehicle.image
          return (
            <article key={vehicle.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#f9fafb] shadow-[0_12px_25px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_35px_rgba(15,23,42,0.08)]">
              <img src={thumbnail} alt={vehicle.model} className="h-52 w-full object-cover" />
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{vehicle.code}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{vehicle.model}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusStyles[vehicle.status]}`}>
                    {statusLabel[vehicle.status]}
                  </span>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Mecánico asignado</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{vehicle.mechanic}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => onEdit(vehicle.id)}
                    disabled={!isOwner}
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${isOwner ? 'bg-slate-900 text-white hover:bg-slate-700' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}
                  >
                    Editar
                  </button>
                  <div className={`rounded-2xl px-3 py-2 text-xs font-semibold ${isOwner ? 'bg-[#eafaf0] text-[#0f8b3f]' : 'bg-slate-200 text-slate-500'}`}>
                    {statusLabel[vehicle.status]}
                  </div>
                  <button
                    onClick={() => onViewDetail && onViewDetail(vehicle.id)}
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${isOwner ? 'bg-[#ebf4ff] text-[#1d4ed8] hover:bg-[#dfeeff]' : 'bg-slate-200 text-slate-500'}`}
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
