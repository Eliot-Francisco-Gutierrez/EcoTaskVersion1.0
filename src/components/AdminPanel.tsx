import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Users } from 'lucide-react'
import { User } from '../data/mockData'

interface AdminPanelProps {
  user: User
  users: User[]
  onUpdatePermissions: (userId: string, permissions: string[]) => void
}

const permissionCatalog = [
  'all',
  'ingresar',
  'editar',
  'ver',
  'pedido',
  'completar',
  'confirmar',
  'exportar',
  'agregar',
  'administrar',
  'actualizar',
  'filtrar',
  'subir',
  'generar',
  'preparar',
  'enviar',
]

export function AdminPanel({ user, users, onUpdatePermissions }: AdminPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? '')
  const selectedUser = useMemo(() => users.find((item) => item.id === selectedUserId) ?? users[0] ?? user, [selectedUserId, users, user])
  const [draftPermissions, setDraftPermissions] = useState<string[]>(selectedUser.permissions)

  useEffect(() => {
    setDraftPermissions(selectedUser.permissions ?? [])
  }, [selectedUser.permissions, selectedUserId])

  const updateDraftPermissions = (nextPermissions: string[]) => {
    setDraftPermissions(Array.from(new Set(nextPermissions.map((permission) => permission.trim().toLowerCase()).filter(Boolean))))
  }

  const togglePermission = (permission: string) => {
    setDraftPermissions((current) => {
      if (current.includes(permission)) return current.filter((item) => item !== permission)
      return [...current, permission]
    })
  }

  const handleAddPermission = () => {
    const nextPermission = permissionCatalog.find((permission) => !draftPermissions.includes(permission))
    if (!nextPermission) return
    updateDraftPermissions([...draftPermissions, nextPermission])
  }

  const handleRemovePermission = () => {
    if (draftPermissions.length === 0) return
    updateDraftPermissions(draftPermissions.slice(0, -1))
  }

  const handleSavePermissions = () => {
    onUpdatePermissions(selectedUser.id, draftPermissions)
  }

  const hasPermission = (permission: string) => draftPermissions.includes(permission)

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm shadow-slate-950/20">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Panel de administración</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">Administrar permisos de usuario</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Gestiona el acceso a funciones del taller para cada usuario.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-3">
          <Users className="h-6 w-6 text-emerald-300" />
          <div>
            <p className="text-sm text-slate-400">Usuario activo</p>
            <p className="font-semibold text-slate-100">{user.fullName}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.5fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <h3 className="text-lg font-semibold text-slate-100">Usuarios</h3>
          <div className="mt-4 space-y-3">
            {users.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedUserId(item.id)}
                className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                  selectedUserId === item.id
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <p className="font-semibold">{item.fullName}</p>
                <p className="text-sm text-slate-500">{item.role}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{selectedUser.fullName}</h3>
              <p className="mt-1 text-sm text-slate-500">{selectedUser.role}</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-300" />
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">Permisos asignados</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {draftPermissions.length === 0 ? (
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Sin permisos
                  </span>
                ) : (
                  draftPermissions.map((permission) => (
                    <span key={permission} className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                      {permission}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">Editar permisos</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {permissionCatalog.map((permission) => (
                  <button
                    key={permission}
                    type="button"
                    onClick={() => togglePermission(permission)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                      hasPermission(permission)
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {permission}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">Acciones rápidas</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleAddPermission}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
                >
                  Añadir permiso
                </button>
                <button
                  type="button"
                  onClick={handleRemovePermission}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
                >
                  Quitar permiso
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 transition hover:border-emerald-500/60 hover:bg-emerald-500/15"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
