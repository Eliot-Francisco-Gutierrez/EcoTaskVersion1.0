import { Home, ClipboardList, Settings2, Sparkles, User, ListChecks, PackageSearch, Truck, Camera, Tag, Bell, ShieldCheck, X } from 'lucide-react'
import { ChangeEvent, useRef } from 'react'
import { sidebarItems, User as AppUser } from '../data/mockData'

const iconMapping: Record<string, JSX.Element> = {
  Inicio: <Home className="h-4 w-4" />,
  Notificaciones: <Bell className="h-4 w-4" />,
  'Vehículos 08': <Truck className="h-4 w-4" />,
  Tareas: <ListChecks className="h-4 w-4" />,
  Solicitudes: <PackageSearch className="h-4 w-4" />,
  Repuestos: <ClipboardList className="h-4 w-4" />,
  Lavado: <Sparkles className="h-4 w-4" />,
  Fotografía: <Camera className="h-4 w-4" />,
  Despacho: <Tag className="h-4 w-4" />,
  Indicadores: <ShieldCheck className="h-4 w-4" />,
  Historial: <Bell className="h-4 w-4" />,
  Usuarios: <User className="h-4 w-4" />,
  Configuración: <Settings2 className="h-4 w-4" />,
}

interface SidebarProps {
  open: boolean
  selectedSection: string
  onSectionChange: (section: string) => void
  onClose: () => void
  user: AppUser
  onLogout: () => void
  onUploadPhoto: (file: File) => void
}

export function Sidebar({ open, selectedSection, onSectionChange, onClose, user, onLogout, onUploadPhoto }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onUploadPhoto(file)
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] transform flex-col border-r border-[#dfe7eb] bg-[#f3f6f7] px-5 py-6 shadow-[12px_0_30px_rgba(15,23,42,0.04)] transition duration-300 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-8 flex items-center justify-between gap-3 lg:mb-10">
          <div>
            <div className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#16a34a] text-[9px] font-bold text-white shadow-md shadow-green-200">ECO</span>
              <span>Autoparts</span>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">Piezas recicladas del automóvil</p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const isActive = item === selectedSection
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onSectionChange(item)
                    if (open) onClose()
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? 'border-[#9fe3b8] bg-[#dff9e8] text-[#0f8b3f] shadow-sm'
                      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-[#0f8b3f]' : 'text-slate-500'}>{iconMapping[item]}</span>
                  <span>{item}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="mt-6 rounded-[26px] border border-[#dfe7eb] bg-white px-4 py-4 shadow-[0_16px_35px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-3xl bg-[#eefbf3] ring-1 ring-[#dff6e6]">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#dff9e8] text-[#0f8b3f]">
                  <User className="h-6 w-6" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
              <p className="text-xs text-slate-500">{user.role} · Taller</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleFileClick}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              Cargar foto de perfil
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
            >
              Cerrar sesión
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </aside>
    </>
  )
}
