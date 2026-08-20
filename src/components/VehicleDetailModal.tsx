import React from 'react'
import { Vehicle, RequestItem } from '../data/mockData'

type Props = {
  open: boolean
  onClose: () => void
  vehicle: Vehicle | null
  requests?: RequestItem[]
}

const VehicleDetailModal: React.FC<Props> = ({ open, onClose, vehicle, requests = [] }) => {
  if (!open || !vehicle) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#f7faf8] px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Detalle: {vehicle.code}</h2>
            <p className="mt-1 text-sm text-slate-600">{vehicle.model}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>
        <div className="space-y-5 px-6 py-6">
          <div className="flex items-center gap-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
            <img src={vehicle.photos?.[0] || vehicle.image} alt="veh" className="h-20 w-28 rounded-xl object-cover" />
            <div>
              <div className="font-semibold text-slate-900">{vehicle.model}</div>
              <div className="text-sm text-slate-600">Dominio: {vehicle.dominio}</div>
              <div className="text-sm text-slate-600">Dueño: {vehicle.owner}</div>
            </div>
          </div>

          <div>
            <div className="font-medium text-slate-800">Solicitudes / Pedidos</div>
            <ul className="mt-2 space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="font-semibold text-slate-900">{r.title}</div>
                  <div className="text-sm text-slate-600">{r.description}</div>
                </li>
              ))}
              {requests.length === 0 && <li className="text-sm text-slate-500">No hay solicitudes para este vehículo.</li>}
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-[#f7faf8] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default VehicleDetailModal
