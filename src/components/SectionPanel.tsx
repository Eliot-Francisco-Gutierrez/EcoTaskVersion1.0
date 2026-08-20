import { useMemo, useState } from 'react'
import { ArrowRight, Clipboard, Edit, Plus, ShoppingCart, Sparkles, Truck, Camera, Users, Settings2, ClipboardList, CheckCircle2 } from 'lucide-react'

interface SectionPanelProps {
  selectedSection: string
  userPermissions: string[]
  onAction: (action: string) => void
}

const sectionActions: Record<string, Array<{ title: string; description: string; button: string; icon: JSX.Element }>> = {
  Inicio: [
    { title: 'Revisar panel de control', description: 'Ver resumen completo de operaciones.', button: 'Ingresar', icon: <Clipboard className="h-5 w-5" /> },
    { title: 'Abrir alertas', description: 'Monitorear notificaciones y flujo del taller.', button: 'Ver alertas', icon: <ArrowRight className="h-5 w-5" /> },
    { title: 'Solicitar soporte', description: 'Generar un pedido de ayuda o recursos.', button: 'Solicitar', icon: <ShoppingCart className="h-5 w-5" /> },
  ],
  Notificaciones: [
    { title: 'Abrir bandeja', description: 'Revisar pedidos delegados y avisos.', button: 'Ingresar', icon: <ClipboardList className="h-5 w-5" /> },
    { title: 'Marcar leidas', description: 'Actualizar estado de notificaciones.', button: 'Ver', icon: <CheckCircle2 className="h-5 w-5" /> },
    { title: 'Historial de avisos', description: 'Consultar notificaciones anteriores.', button: 'Ver historial', icon: <ArrowRight className="h-5 w-5" /> },
  ],
  'Vehículos 08': [
    { title: 'Ingresar vehículo nuevo', description: 'Registrar unidad y asignar mecánico.', button: 'Ingresar', icon: <Truck className="h-5 w-5" /> },
    { title: 'Cambiar estado', description: 'Actualizar fase del vehículo en el taller.', button: 'Editar', icon: <Edit className="h-5 w-5" /> },
    { title: 'Solicitar repuestos', description: 'Crear un pedido de piezas para la unidad.', button: 'Pedido', icon: <ShoppingCart className="h-5 w-5" /> },
  ],
  Tareas: [
    { title: 'Crear tarea nueva', description: 'Asignar prioridad y responsable.', button: 'Crear', icon: <Plus className="h-5 w-5" /> },
    { title: 'Editar tareas activas', description: 'Modificar detalles y plazos.', button: 'Editar', icon: <Edit className="h-5 w-5" /> },
    { title: 'Marcar completada', description: 'Cerrar tareas finalizadas en el taller.', button: 'Completar', icon: <CheckCircle2 className="h-5 w-5" /> },
  ],
  Solicitudes: [
    { title: 'Abrir solicitudes', description: 'Ver pedidos pendientes y en curso.', button: 'Ingresar', icon: <ClipboardList className="h-5 w-5" /> },
    { title: 'Crear nueva solicitud', description: 'Enviar un nuevo pedido de repuesto.', button: 'Solicitar', icon: <ShoppingCart className="h-5 w-5" /> },
    { title: 'Revisar historial', description: 'Ver estado de solicitudes anteriores.', button: 'Ver historial', icon: <ArrowRight className="h-5 w-5" /> },
  ],
  Repuestos: [
    { title: 'Consultar stock', description: 'Ver inventario y disponibilidad.', button: 'Ingresar', icon: <Clipboard className="h-5 w-5" /> },
    { title: 'Generar pedido', description: 'Solicitar repuestos para el taller.', button: 'Pedido', icon: <ShoppingCart className="h-5 w-5" /> },
    { title: 'Actualizar precios', description: 'Modificar datos del inventario.', button: 'Editar', icon: <Edit className="h-5 w-5" /> },
  ],
  Lavado: [
    { title: 'Programar lavado', description: 'Agendar unidad para limpieza.', button: 'Programar', icon: <Sparkles className="h-5 w-5" /> },
    { title: 'Revisar estado', description: 'Ver vehículos listos para lavado.', button: 'Ver', icon: <ArrowRight className="h-5 w-5" /> },
    { title: 'Registrar lavado', description: 'Confirmar lavado completado.', button: 'Confirmar', icon: <CheckCircle2 className="h-5 w-5" /> },
  ],
  Fotografía: [
    { title: 'Abrir módulo de foto', description: 'Capturar imágenes de vehículos listos.', button: 'Abrir', icon: <Camera className="h-5 w-5" /> },
    { title: 'Subir imágenes', description: 'Cargar reportes fotográficos.', button: 'Subir', icon: <Plus className="h-5 w-5" /> },
    { title: 'Solicitar revisión', description: 'Enviar fotos para aprobación.', button: 'Enviar', icon: <ArrowRight className="h-5 w-5" /> },
  ],
  Despacho: [
    { title: 'Preparar despacho', description: 'Organizar vehículos listos para salida.', button: 'Preparar', icon: <Truck className="h-5 w-5" /> },
    { title: 'Generar guía', description: 'Crear documentación de envío.', button: 'Generar', icon: <Clipboard className="h-5 w-5" /> },
    { title: 'Confirmar salida', description: 'Cerrar entrega del vehículo.', button: 'Confirmar', icon: <CheckCircle2 className="h-5 w-5" /> },
  ],
  Indicadores: [
    { title: 'Revisar métricas', description: 'Ver el rendimiento diario y semanal.', button: 'Ver', icon: <Clipboard className="h-5 w-5" /> },
    { title: 'Ajustar objetivos', description: 'Modificar metas del sector.', button: 'Editar', icon: <Edit className="h-5 w-5" /> },
    { title: 'Descargar reporte', description: 'Exportar resumen de indicadores.', button: 'Exportar', icon: <ArrowRight className="h-5 w-5" /> },
  ],
  Historial: [
    { title: 'Ver historial', description: 'Consultar movimientos anteriores.', button: 'Consultar', icon: <ArrowRight className="h-5 w-5" /> },
    { title: 'Filtrar registros', description: 'Buscar por fecha, estado o vehículo.', button: 'Filtrar', icon: <Edit className="h-5 w-5" /> },
    { title: 'Exportar entradas', description: 'Descargar registro histórico.', button: 'Exportar', icon: <Clipboard className="h-5 w-5" /> },
  ],
  Usuarios: [
    { title: 'Agregar usuario', description: 'Registrar nuevo operario o administrador.', button: 'Agregar', icon: <Users className="h-5 w-5" /> },
    { title: 'Editar permisos', description: 'Modificar roles y accesos.', button: 'Editar', icon: <Edit className="h-5 w-5" /> },
    { title: 'Ver equipo', description: 'Consultar lista de usuarios activos.', button: 'Ver', icon: <ArrowRight className="h-5 w-5" /> },
  ],
  Configuración: [
    { title: 'Ajustar sistema', description: 'Configurar parámetros del dashboard.', button: 'Ajustar', icon: <Settings2 className="h-5 w-5" /> },
    { title: 'Administrar permisos', description: 'Revisar roles y accesos.', button: 'Administrar', icon: <Users className="h-5 w-5" /> },
    { title: 'Actualizar perfil', description: 'Modificar datos del taller.', button: 'Actualizar', icon: <Edit className="h-5 w-5" /> },
  ],
}

export function SectionPanel({ selectedSection, userPermissions, onAction }: SectionPanelProps) {
  const [selectedAction, setSelectedAction] = useState(sectionActions[selectedSection]?.[0]?.button ?? 'Ingresar')

  const actions = useMemo(
    () =>
      sectionActions[selectedSection] ?? [
        { title: `Gestionar ${selectedSection}`, description: 'Abrir y editar este módulo.', button: 'Abrir', icon: <Edit className="h-5 w-5" /> },
        { title: 'Realizar pedido', description: 'Generar un pedido o actualizar datos.', button: 'Pedido', icon: <ShoppingCart className="h-5 w-5" /> },
        { title: 'Revisar histórico', description: 'Consultar cambios recientes.', button: 'Historial', icon: <ArrowRight className="h-5 w-5" /> },
      ],
    [selectedSection],
  )

  const permissionMap: Record<string, string> = {
    Ingresar: 'ingresar',
    Editar: 'editar',
    Pedido: 'pedido',
    Solicitar: 'pedido',
    Ver: 'ver',
    'Ver alertas': 'ver',
    Consultar: 'ver',
    'Ver historial': 'ver',
    Exportar: 'exportar',
    Completar: 'completar',
    Confirmar: 'confirmar',
    Generar: 'generar',
    Subir: 'subir',
    Enviar: 'enviar',
    Preparar: 'preparar',
    Administrar: 'administrar',
    Actualizar: 'actualizar',
    Agregar: 'agregar',
    Abrir: 'ver',
    Filtrar: 'filtrar',
    Crear: 'agregar',
  }

  const normalizedUserPermissions = userPermissions.map((permission) => permission.toLowerCase())
  const getPermissionKey = (button: string) => permissionMap[button] ?? button.toLowerCase().replace(/\s+/g, '')
  const currentAction = actions.find((action) => action.button === selectedAction) ?? actions[0]
  const canPerform = (actionKey: string) => {
    const required = getPermissionKey(actionKey)
    return normalizedUserPermissions.includes('all') || normalizedUserPermissions.includes(required)
  }

  const sectionActionButtons: Record<string, { primary: string; secondary: string; tertiary: string }> = {
    Inicio: { primary: 'Ingresar', secondary: 'Ver alertas', tertiary: 'Solicitar' },
    Notificaciones: { primary: 'Ingresar', secondary: 'Ver', tertiary: 'Ver historial' },
    'Vehículos 08': { primary: 'Ingresar', secondary: 'Editar', tertiary: 'Pedido' },
    Tareas: { primary: 'Crear', secondary: 'Editar', tertiary: 'Completar' },
    Solicitudes: { primary: 'Ingresar', secondary: 'Solicitar', tertiary: 'Ver historial' },
    Repuestos: { primary: 'Ingresar', secondary: 'Pedido', tertiary: 'Editar' },
    Lavado: { primary: 'Programar', secondary: 'Ver', tertiary: 'Confirmar' },
    Fotografía: { primary: 'Abrir', secondary: 'Subir', tertiary: 'Enviar' },
    Despacho: { primary: 'Preparar', secondary: 'Generar', tertiary: 'Confirmar' },
    Indicadores: { primary: 'Ver', secondary: 'Editar', tertiary: 'Exportar' },
    Historial: { primary: 'Consultar', secondary: 'Filtrar', tertiary: 'Exportar' },
    Usuarios: { primary: 'Agregar', secondary: 'Editar', tertiary: 'Ver' },
    Configuración: { primary: 'Ajustar', secondary: 'Administrar', tertiary: 'Actualizar' },
  }

  const actionButtons = sectionActionButtons[selectedSection] ?? {
    primary: 'Abrir',
    secondary: 'Editar',
    tertiary: 'Ver',
  }

  return (
    <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.25)]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Módulo activo</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">{selectedSection}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Ingresa al módulo para revisar datos, generar pedidos y actualizar los procesos del taller.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onAction(`${actionButtons.primary} - ${selectedSection}`)}
            className="min-h-[48px] rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold leading-tight text-emerald-300 transition hover:border-emerald-400/60 hover:bg-emerald-500/15 sm:text-sm"
          >
            {actionButtons.primary}
          </button>
          <button
            type="button"
            onClick={() => onAction(`${actionButtons.secondary} - ${selectedSection}`)}
            className="min-h-[48px] rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-center text-xs font-semibold leading-tight text-slate-200 transition hover:border-slate-600 hover:bg-slate-900 sm:text-sm"
          >
            {actionButtons.secondary}
          </button>
          <button
            type="button"
            onClick={() => onAction(`${actionButtons.tertiary} - ${selectedSection}`)}
            className="min-h-[48px] rounded-2xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-center text-xs font-semibold leading-tight text-slate-200 transition hover:border-slate-600 hover:bg-slate-900 sm:text-sm"
          >
            {actionButtons.tertiary}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {actions.map((action) => (
          <div key={action.title} className="rounded-[24px] border border-slate-800 bg-slate-950/70 p-5 transition duration-200 hover:border-slate-700 hover:bg-slate-950/80">
            <div className="flex items-center justify-between gap-3 text-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{action.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{action.description}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-slate-200 ring-1 ring-inset ring-slate-700/70">
                {action.icon}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedAction(action.button)
                onAction(`${action.button} - ${selectedSection}`)
              }}
              disabled={!canPerform(action.button)}
              className={`mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl px-3 py-2 text-center text-xs font-semibold leading-tight transition sm:text-sm ${
                !canPerform(action.button)
                  ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                  : selectedAction === action.button
                  ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-300'
                  : 'bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {action.button}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-slate-800 bg-gradient-to-r from-slate-950/90 to-slate-900/80 p-6 text-slate-100">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Acción activa</p>
        <h3 className="mt-3 text-xl font-semibold text-slate-100">{currentAction.title}</h3>
        <p className="mt-2 text-sm text-slate-400">{currentAction.description}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onAction(`Ejecutar ${currentAction.button} - ${selectedSection}`)}
            disabled={!canPerform(currentAction.button)}
            className={`min-h-[44px] rounded-2xl px-3 py-2 text-center text-xs font-semibold leading-tight transition sm:text-sm ${
              !canPerform(currentAction.button)
                ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
            }`}
          >
            Ejecutar {currentAction.button}
          </button>
          <button
            type="button"
            onClick={() => onAction(`Ver detalles de ${currentAction.button} - ${selectedSection}`)}
            className="min-h-[44px] rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-center text-xs leading-tight text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 sm:text-sm"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </section>
  )
}
