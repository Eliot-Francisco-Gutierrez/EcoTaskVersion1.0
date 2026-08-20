import { useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopHeader } from './components/TopHeader'
import { SectionPanel } from './components/SectionPanel'
import { AdminPanel } from './components/AdminPanel'
import { KpiCards } from './components/KpiCards'
import { Login } from './components/Login'
import { WorkflowTimeline } from './components/WorkflowTimeline'
import { SubprocessTracker } from './components/SubprocessTracker'
import { VehiclesGrid } from './components/VehiclesGrid'
import ToastProvider from './components/ToastProvider'
import VehicleDetailModal from './components/VehicleDetailModal'
import ConfirmModal from './components/ConfirmModal'
import HistoryPanel from './components/HistoryPanel'
import { NotificationsPanel } from './components/NotificationsPanel'
import { TasksPanel } from './components/TasksPanel'
import { RequestsPanel } from './components/RequestsPanel'
import { DailyMetricsPanel } from './components/DailyMetricsPanel'
import { ActionModal, ActionField } from './components/ActionModal'
import { User, Task, RequestItem, RecordItem, Vehicle, NotificationItem, DailyMetric, subprocessSteps, workflowSteps } from './data/mockData'

const normalizePermissionList = (permissions: string[] = []) => Array.from(new Set((permissions ?? []).map((permission) => String(permission).trim().toLowerCase()).filter(Boolean)))

const menuItems = [
  'Inicio',
  'Notificaciones',
  'Vehículos 08',
  'Tareas',
  'Solicitudes',
  'Repuestos',
  'Lavado',
  'Fotografía',
  'Despacho',
  'Indicadores',
  'Historial',
  'Usuarios',
  'Configuración',
]

export default function App() {
  const storageKey = 'ecotaskState'
  const emptyUser: User = {
    id: '',
    username: '',
    password: '',
    fullName: '',
    role: 'Operario',
    category: 'Operario',
    permissions: [],
    avatar: '',
  }

  const getDefaultState = () => ({
    isAuthenticated: false,
    user: emptyUser,
    users: [] as User[],
    vehicles: [] as Vehicle[],
    tasks: [] as Task[],
    requests: [] as RequestItem[],
    historyRecords: [] as RecordItem[],
    archivedVehicles: [] as (Vehicle & { archivedAt?: string })[],
    notifications: [] as NotificationItem[],
  })

  const savedState = (() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return {
        ...getDefaultState(),
        ...parsed,
        user: parsed?.user ?? getDefaultState().user,
        users: getDefaultState().users,
        vehicles: getDefaultState().vehicles,
        tasks: getDefaultState().tasks,
        requests: getDefaultState().requests,
        historyRecords: getDefaultState().historyRecords,
        archivedVehicles: getDefaultState().archivedVehicles,
        notifications: getDefaultState().notifications,
      }
    } catch {
      return null
    }
  })()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState(menuItems[0])
  const [user, setUser] = useState<User>(savedState?.user ?? emptyUser)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(savedState?.isAuthenticated ?? false)
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem('ecotask-auth-token')
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    title: string
    description: string
    content?: string
    fields: ActionField[]
    submitLabel: string
  }>({ title: '', description: '', fields: [], submitLabel: 'Guardar' })
  const [modalAction, setModalAction] = useState<{ action: string; section: string } | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>(savedState?.vehicles ?? [])
  const [users, setUsers] = useState<User[]>(savedState?.users ?? [])
  const [tasks, setTasks] = useState<Task[]>(savedState?.tasks ?? [])
  const [requests, setRequests] = useState<RequestItem[]>(savedState?.requests ?? [])
  const [historyRecords, setHistoryRecords] = useState<RecordItem[]>(savedState?.historyRecords ?? [])
  const [archivedVehicles, setArchivedVehicles] = useState<(Vehicle & { archivedAt?: string })[]>(savedState?.archivedVehicles ?? [])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingFinalization, setPendingFinalization] = useState<{ code: string; notes?: string } | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string | File | null>>({})
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>(savedState?.notifications ?? [])
  const [focusedRequestId, setFocusedRequestId] = useState<string | null>(null)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyRange, setHistoryRange] = useState({ from: '', to: '' })
  const [systemSettings, setSystemSettings] = useState({
    title: 'EcoTask Autoparts',
    schedule: '08:00 - 18:00',
    dailyTarget: '20',
  })
  const suppressNextBroadcastRef = useRef(false)
  const backendReadyRef = useRef(false)
  const apiBaseUrl = (() => {
    if (typeof window === 'undefined') return 'http://localhost:3001'

    const { hostname } = window.location
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
    const isLanHost = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname)

    if (import.meta.env.DEV && isLocalHost) {
      return 'http://localhost:3001'
    }

    if (import.meta.env.DEV && isLanHost) {
      return `http://${hostname}:3001`
    }

    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace(/\/$/, '')
    }

    return 'http://localhost:3001'
  })()

  const apiFetch = async (path: string, method: string = 'GET', body?: Record<string, unknown>) => {
    if (!authToken || !isAuthenticated) {
      return null
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(errorBody?.error || 'Error en la operación')
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return response.json()
    }

    return null
  }

  const persistStateToBackend = async (nextState: Partial<typeof getDefaultState> & { isAuthenticated?: boolean; user?: User; systemSettings?: typeof systemSettings }) => {
    if (!authToken || !isAuthenticated) return
    try {
      await fetch(`${apiBaseUrl}/api/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(nextState),
      })
    } catch {
      // no-op: sync failures should not block the UI
    }
  }

  useEffect(() => {
    const hydrateFromApi = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/state`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        })
        if (!response.ok) throw new Error('backend unavailable')
        const backendState = await response.json()
        if (!backendState) return

        setUser(backendState.user ?? emptyUser)
        setIsAuthenticated(Boolean(backendState.isAuthenticated))
        setUsers(Array.isArray(backendState.users) ? backendState.users : [])
        setVehicles(Array.isArray(backendState.vehicles) ? backendState.vehicles : [])
        setTasks(Array.isArray(backendState.tasks) ? backendState.tasks : [])
        setRequests(Array.isArray(backendState.requests) ? backendState.requests : [])
        setHistoryRecords(Array.isArray(backendState.historyRecords) ? backendState.historyRecords : [])
        setArchivedVehicles(Array.isArray(backendState.archivedVehicles) ? backendState.archivedVehicles : [])
        setNotifications(Array.isArray(backendState.notifications) ? backendState.notifications : [])
        if (backendState.systemSettings) {
          setSystemSettings({
            title: backendState.systemSettings.title || 'EcoTask Autoparts',
            schedule: backendState.systemSettings.schedule || '08:00 - 18:00',
            dailyTarget: backendState.systemSettings.dailyTarget || '20',
          })
        }
      } catch {
        setUser(savedState?.user ?? emptyUser)
        setIsAuthenticated(Boolean(savedState?.isAuthenticated))
        setUsers(savedState?.users ?? [])
        setVehicles(savedState?.vehicles ?? [])
        setTasks(savedState?.tasks ?? [])
        setRequests(savedState?.requests ?? [])
        setHistoryRecords(savedState?.historyRecords ?? [])
        setArchivedVehicles(savedState?.archivedVehicles ?? [])
        setNotifications(savedState?.notifications ?? [])
      } finally {
        backendReadyRef.current = true
      }
    }

    hydrateFromApi()
  }, [authToken])

  const userPermissions = useMemo(() => normalizePermissionList(user.permissions), [user.permissions])
  const isAdmin = useMemo(
    () => user.category === 'Administrador' || userPermissions.includes('all'),
    [user.category, userPermissions],
  )

  const getPermissionForAction = (section: string, action: string) => {
    const normalizedAction = action.trim()
    const actionMap: Record<string, string> = {
      Ingresar: 'ingresar',
      'Ver alertas': 'ver',
      Solicitar: 'pedido',
      Ver: 'ver',
      'Ver historial': 'ver',
      Editar: 'editar',
      Crear: 'agregar',
      Completar: 'completar',
      Pedido: 'pedido',
      Programar: 'preparar',
      Confirmar: 'confirmar',
      Abrir: 'ver',
      Subir: 'subir',
      Enviar: 'enviar',
      Preparar: 'preparar',
      Generar: 'generar',
      Exportar: 'exportar',
      Consultar: 'ver',
      Filtrar: 'filtrar',
      Agregar: 'agregar',
      Ajustar: 'actualizar',
      Administrar: 'administrar',
      Actualizar: 'actualizar',
      Ejecutar: 'ver',
    }

    if (normalizedAction.startsWith('Ver detalles de ')) return 'ver'
    if (normalizedAction.startsWith('Ejecutar ')) return actionMap[normalizedAction.replace(/^Ejecutar\s+/, '')] ?? 'ver'
    return actionMap[normalizedAction] ?? 'ver'
  }

  const canUserPerformAction = (section: string, action: string) => {
    if (isAdmin || userPermissions.includes('all')) return true
    const requiredPermission = getPermissionForAction(section, action)
    return userPermissions.includes(requiredPermission)
  }

  const requireActionPermission = (section: string, action: string) => {
    if (canUserPerformAction(section, action)) return true
    const requiredPermission = getPermissionForAction(section, action)
    setFeedbackMessage(`No tenés permiso para "${action}" en ${section}. Se requiere: ${requiredPermission}.`)
    return false
  }

  const handleNotify = () => {
    setModalOpen(false)
    setSelectedSection('Notificaciones')
  }

  const currentUserCanUploadPhotos = useMemo(
    () => user.username === 'encargadoGeneral08' || user.role.includes('Operario 08') || user.role.includes('Encargado'),
    [user],
  )

  // BroadcastChannel for real-time sync between tabs/users
  const broadcast = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      // @ts-ignore
      return 'BroadcastChannel' in window ? new BroadcastChannel('ecotask-channel') : null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!broadcast) return
    const handle = (ev: MessageEvent) => {
      if (!ev.data) return
      const type = ev.data.type
      if (type === 'state-update') {
        const incoming = ev.data.state
        suppressNextBroadcastRef.current = true
        if (incoming.users) setUsers(incoming.users)
        if (incoming.vehicles) setVehicles(incoming.vehicles)
        if (incoming.tasks) setTasks(incoming.tasks)
        if (incoming.requests) setRequests(incoming.requests)
        if (incoming.historyRecords) setHistoryRecords(incoming.historyRecords)
        if (incoming.archivedVehicles) setArchivedVehicles(incoming.archivedVehicles)
        if (incoming.notifications) setNotifications(incoming.notifications)
        if (typeof incoming.isAuthenticated === 'boolean' && incoming.user) setUser(incoming.user)
        return
      }
      if (type === 'notification') {
        const message = ev.data.message as string | undefined
        const targetUser = ev.data.targetUser as string | undefined
        const requestId = ev.data.requestId as string | undefined
        const isForCurrentUser = !targetUser || targetUser === user.fullName || targetUser === user.username
        if (message && isForCurrentUser) {
          setFeedbackMessage(message)
          setNotifications((current) => [
            {
              id: `n-${Date.now()}`,
              message,
              createdAt: new Date().toISOString(),
              read: false,
              fromUser: ev.data.fromUser as string | undefined,
              toUser: targetUser,
              requestId,
            },
            ...current,
          ])
        }
        const incoming = ev.data.state
        if (!incoming) return
        if (incoming.users) setUsers((cur) => [...incoming.users, ...cur])
        if (incoming.vehicles) setVehicles((cur) => [...incoming.vehicles, ...cur])
        if (incoming.tasks) setTasks((cur) => [...incoming.tasks, ...cur])
        if (incoming.requests) setRequests((cur) => [...incoming.requests, ...cur])
        if (incoming.historyRecords) setHistoryRecords((cur) => [...incoming.historyRecords, ...cur])
        if (incoming.archivedVehicles) setArchivedVehicles((cur) => [...incoming.archivedVehicles, ...cur])
        if (incoming.notifications) setNotifications((cur) => [...incoming.notifications, ...cur])
        return
      }
    }
    // @ts-ignore
    broadcast.onmessage = handle
    return () => {
      try {
        // @ts-ignore
        broadcast.onmessage = null
      } catch {}
    }
  }, [broadcast, user.fullName, user.username])

  const handleMessages = () => {
    setModalOpen(false)
    setSelectedSection('Notificaciones')
    setFeedbackMessage('Mensajes: tienes 2 mensajes nuevos de operaciones.')
  }

  const handleDashboardFocus = () => {
    setModalOpen(false)
    setSelectedSection('Inicio')
    setFeedbackMessage('Volviste al panel principal del taller.')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(emptyUser)
    setUsers([])
    setVehicles([])
    setTasks([])
    setRequests([])
    setHistoryRecords([])
    setArchivedVehicles([])
    setNotifications([])
    setAuthToken(null)
    window.localStorage.removeItem(storageKey)
    window.localStorage.removeItem('ecotask-auth-token')
  }

  useEffect(() => {
    if (!backendReadyRef.current) return

    const state = {
      isAuthenticated,
      user,
      users,
      vehicles,
      tasks,
      requests,
      historyRecords,
      archivedVehicles,
      notifications,
      systemSettings,
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
      if (authToken) {
        window.localStorage.setItem('ecotask-auth-token', authToken)
      }
      if (suppressNextBroadcastRef.current) {
        suppressNextBroadcastRef.current = false
      } else if (broadcast) {
        try {
          // @ts-ignore
          broadcast.postMessage({ type: 'state-update', state })
        } catch {}
      }
    } catch {
      // ignore storage write errors
    }

    fetch(`${apiBaseUrl}/api/state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(state),
    }).catch(() => {
      // backend not available at the moment; localStorage remains as fallback
    })
  }, [isAuthenticated, user, users, vehicles, tasks, requests, historyRecords, archivedVehicles, notifications, broadcast, systemSettings, authToken])

  // Compute KPIs dynamically from current state; show null until any events exist
  const kpiMetricsComputed = useMemo(() => {
    const counts = {
      pending: vehicles.filter((v) => v.status !== 'Finalizado').length,
      preparation: vehicles.filter((v) => v.status === 'Preparacion').length,
      waiting: vehicles.filter((v) => v.status === 'Pedido repuestos').length,
      pending08: vehicles.filter((v) => v.status === 'Pedido 08').length,
      washReady: vehicles.filter((v) => v.status === 'Lavado').length,
      photoReady: vehicles.filter((v) => v.status === 'Fotografia').length,
    }
    const total = Object.values(counts).reduce((s, n) => s + n, 0)
    const make = (id: string, label: string, value: number | null, accent: string, icon: string) => ({ id, label, value, accent, icon })
    if (total === 0) {
      return [
        make('pending', 'Vehículos pendientes', null, 'bg-amber-500/20 text-amber-300', 'Car'),
        make('preparation', 'En preparación', null, 'bg-sky-500/20 text-sky-300', 'Wrench'),
        make('waiting', 'Esperando repuestos', null, 'bg-violet-500/20 text-violet-300', 'Package'),
        make('pending08', 'Pendientes de 08', null, 'bg-emerald-500/20 text-emerald-300', 'ClipboardList'),
        make('washReady', 'Listos para lavado', null, 'bg-cyan-500/20 text-cyan-300', 'Droplet'),
        make('photoReady', 'Fotografía / Listos para venta', null, 'bg-fuchsia-500/20 text-fuchsia-300', 'Camera'),
      ]
    }
    return [
      make('pending', 'Vehículos pendientes', counts.pending, 'bg-amber-500/20 text-amber-300', 'Car'),
      make('preparation', 'En preparación', counts.preparation, 'bg-sky-500/20 text-sky-300', 'Wrench'),
      make('waiting', 'Esperando repuestos', counts.waiting, 'bg-violet-500/20 text-violet-300', 'Package'),
      make('pending08', 'Pendientes de 08', counts.pending08, 'bg-emerald-500/20 text-emerald-300', 'ClipboardList'),
      make('washReady', 'Listos para lavado', counts.washReady, 'bg-cyan-500/20 text-cyan-300', 'Droplet'),
      make('photoReady', 'Fotografía / Listos para venta', counts.photoReady, 'bg-fuchsia-500/20 text-fuchsia-300', 'Camera'),
    ]
  }, [vehicles])

  const dailyMetricsComputed = useMemo(() => {
    const lavados = historyRecords.filter((r) => /lavad/i.test(`${r.title} ${r.description}`)).length
    const tareasFinalizadas = historyRecords.filter((r) => r.type === 'Tarea' && r.status === 'Completada').length
    const autopartes = historyRecords.filter((r) => /repuesto|repuestos|autoparte/i.test(`${r.title} ${r.description}`)).length
    const descargados = historyRecords.filter((r) => /descarg/i.test(`${r.title} ${r.description}`)).length
    const total = lavados + tareasFinalizadas + autopartes + descargados
    if (total === 0) return []
    return [
      { label: 'Vehículos descargados', value: descargados, icon: 'Truck' },
      { label: 'Vehículos lavados', value: lavados, icon: 'Droplet' },
      { label: 'Autopartes realizadas', value: autopartes, icon: 'Cog' },
      { label: 'Tareas finalizadas', value: tareasFinalizadas, icon: 'CheckCircle' },
    ]
  }, [historyRecords])

  const handleProfilePhotoUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const avatarUrl = reader.result as string
      setUser((current) => ({ ...current, avatar: avatarUrl }))
      setFeedbackMessage('Foto de perfil actualizada correctamente.')
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiFetch(`/api/users/${userId}`, 'DELETE')
      setUsers((current) => current.filter((item) => item.id !== userId))
      setFeedbackMessage('Usuario eliminado correctamente.')
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : 'No se pudo eliminar el usuario.')
    }
  }

  const buildModalConfig = (rawAction: string, section: string, currentUser: User) => {
    const action = rawAction.trim()

    if (action.startsWith('Ver detalles de ')) {
      const target = action.replace(/^Ver detalles de\s+/i, '')
      const detailSections = {
        Inicio: `Resumen activo del taller.\n• Vehículos pendientes: ${vehicles.filter((vehicle) => vehicle.status !== 'Finalizado').length}\n• Tareas abiertas: ${tasks.length}\n• Solicitudes activas: ${requests.length}`,
        Notificaciones: `Bandeja del usuario.\n• Total: ${notifications.length}\n• No leídas: ${notifications.filter((notification) => !notification.read).length}\n• Enlace activo: ${focusedRequestId ?? 'ninguno'}`,
        'Vehículos 08': `Estado actual del sector.\n• Total activos: ${vehicles.length}\n• En inspección: ${vehicles.filter((vehicle) => vehicle.status === 'En inspeccion').length}\n• En preparación: ${vehicles.filter((vehicle) => vehicle.status === 'Preparacion').length}\n• Finalizados: ${vehicles.filter((vehicle) => vehicle.status === 'Finalizado').length}`,
        Tareas: `Tareas en curso.\n• Totales: ${tasks.length}\n• Alta: ${tasks.filter((task) => task.priority === 'Alta').length}\n• Media: ${tasks.filter((task) => task.priority === 'Media').length}\n• Baja: ${tasks.filter((task) => task.priority === 'Baja').length}`,
        Solicitudes: `Solicitudes del taller.\n• Activas: ${requests.length}\n• Pendientes de atención: ${requests.filter((request) => request.requestType).length}\n• Asignadas: ${requests.filter((request) => request.assignedTo).length}`,
        Repuestos: `Stock y pedidos.\n• Vehículos con pedidos: ${vehicles.filter((vehicle) => vehicle.status === 'Pedido repuestos').length}\n• Solicitudes actuales: ${requests.filter((request) => request.requestType?.toLowerCase().includes('pieza') || request.requestType?.toLowerCase().includes('repuesto')).length}`,
        Lavado: `Módulo de lavado.\n• Vehículos en lavado: ${vehicles.filter((vehicle) => vehicle.status === 'Lavado').length}\n• Listos para lavado: ${vehicles.filter((vehicle) => vehicle.status === 'Lavado').length || 'sin registros'}`,
        Fotografía: `Módulo de fotos.\n• Vehículos por foto: ${vehicles.filter((vehicle) => vehicle.status === 'Fotografia').length}\n• Imágenes cargadas en total: ${vehicles.reduce((sum, vehicle) => sum + (vehicle.photos?.length ?? 0), 0)}`,
        Despacho: `Tránsito de salida.\n• Vehículos en preparación: ${vehicles.filter((vehicle) => vehicle.status === 'Preparacion').length}\n• Confirmados para salida: ${vehicles.filter((vehicle) => vehicle.status === 'Finalizado').length}`,
        Indicadores: `Indicadores del taller.\n• Meta diaria: ${systemSettings.dailyTarget}\n• Horario de operación: ${systemSettings.schedule}\n• Taller: ${systemSettings.title}`,
        Historial: `Historial operativo.\n• Registros totales: ${historyRecords.length}\n• Archivados: ${archivedVehicles.length}\n• Filtro: ${historySearch || 'sin búsqueda'}`,
        Usuarios: `Equipo activo.\n• Usuarios registrados: ${users.length}\n• Administradores: ${users.filter((item) => item.category === 'Administrador').length}\n• Operarios: ${users.filter((item) => item.category === 'Operario').length}`,
        Configuración: `Configuración del sistema.\n• Nombre: ${systemSettings.title}\n• Horario: ${systemSettings.schedule}\n• Meta diaria: ${systemSettings.dailyTarget}`,
      }[section] ?? `Detalle del módulo ${section}.\nAcción activa: ${target}`

      return {
        title: `Detalles de ${section}`,
        description: `Revisión rápida de ${target || 'la acción'}.`,
        content: detailSections,
        fields: [],
        submitLabel: 'Cerrar',
      }
    }

    const commonTextField = (id: string, label: string, placeholder = '') => ({
      id,
      label,
      placeholder,
      value: '',
      multiline: false,
    })

    const commonSelectField = (id: string, label: string, options: string[]) => ({
      id,
      label,
      placeholder: '',
      value: options[0] ?? '',
      multiline: false,
      type: 'select' as const,
      options,
    })

    switch (section) {
      case 'Inicio':
        if (action === 'Ingresar') {
          return {
            title: 'Resumen general',
            description: 'Revisa el estado actual del taller y accede a métricas rápidas.',
            content: 'Aquí puedes ver los indicadores clave del taller, los vehículos en curso y los mensajes recientes.',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        if (action === 'Ver alertas') {
          return {
            title: 'Alertas del taller',
            description: 'Revisa las últimas alertas de producción y servicio.',
            content: '• 2 vehículos pendientes de inspección\n• 1 pedido de repuestos retrasado\n• 1 vehículo listo para despacho',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        if (action === 'Solicitar') {
          return {
            title: 'Solicitar soporte',
            description: 'Envía una solicitud de ayuda o recursos al equipo.',
            fields: [
              commonTextField('requestTitle', 'Asunto', 'Ej. Pedido de repuestos'),
              { id: 'notes', label: 'Descripción', placeholder: 'Describe tu solicitud', value: '', multiline: true },
            ],
            submitLabel: 'Enviar solicitud',
          }
        }
        break
      case 'Notificaciones':
        if (action === 'Ingresar') {
          return {
            title: 'Bandeja de notificaciones',
            description: 'Revisa el feed de avisos del taller y responde a alertas operativas.',
            content: `No leídas: ${notifications.filter((notification) => !notification.read).length}\nTotal: ${notifications.length}\nSolicitudes vinculadas: ${notifications.filter((notification) => notification.requestId).length}`,
            fields: [],
            submitLabel: 'Abrir bandeja',
          }
        }
        if (action === 'Ver') {
          return {
            title: 'Marcar notificaciones como leídas',
            description: 'Actualiza el estado de lectura de todas las alertas activas.',
            content: 'Se registrará la revisión del equipo y se cerrará la denuncia operativa pendiente.',
            fields: [],
            submitLabel: 'Marcar como leídas',
          }
        }
        if (action === 'Ver historial') {
          return {
            title: 'Historial de avisos',
            description: 'Consulta el historial de avisos, pedidos y eventos del taller.',
            content: `Registros vigentes: ${notifications.length}\nÚltimo aviso: ${notifications[0]?.message ?? 'Sin mensajes'}`,
            fields: [],
            submitLabel: 'Abrir historial',
          }
        }
        break
      case 'Vehículos 08':
        if (action === 'Ingresar') {
          return {
            title: 'Ingresar vehículo nuevo',
            description: 'Registra una unidad con todos sus datos y asigna un responsable.',
            fields: [
              commonTextField('code', 'Código del vehículo', 'Ej. V.15299'),
              commonTextField('dominio', 'Dominio', 'Ej. ABC123'),
              commonTextField('motorNumber', 'Nro Motor', 'Ej. 9BWZZZ377VT004251'),
              commonTextField('chassisNumber', 'Nro Chasis', 'Ej. 1HGCM82633A004352'),
              commonTextField('bajaTag', 'Baja', 'Ej. V.14322'),
              commonTextField('model', 'Modelo', 'Ej. Toyota Corolla'),
              commonTextField('mechanic', 'Mecánico asignado', 'Ej. Poloni Diego Sebastian'),
              commonTextField('status', 'Estado inicial', 'Ej. ingresado'),
            ],
            submitLabel: 'Registrar vehículo',
          }
        }
        if (action === 'Editar') {
          return {
            title: 'Editar vehículo',
            description: 'Actualiza el estado, mecánico o notas del vehículo.',
            fields: [
              commonSelectField('vehicle', 'Vehículo', vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`)),
                  commonSelectField('status', 'Estado', ['Ingresado','En inspeccion','Pedido repuestos','En reparacion','Preparacion','Control calidad','Finalizado','Pedido 08','Lavado','Fotografia']),
              commonSelectField('mechanic', 'Mecánico asignado', users.map((u) => u.fullName)),
              { id: 'notes', label: 'Notas', placeholder: 'Describe la modificación', value: '', multiline: true },
            ],
            submitLabel: 'Guardar cambios',
          }
        }
        if (action === 'Pedido') {
          return {
            title: 'Solicitar repuestos',
            description: 'Crea un pedido de piezas para el vehículo en taller.',
            fields: [
              commonSelectField(
                'vehicle',
                'Vehículo',
                vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`),
              ),
              commonTextField('part', 'Repuesto', 'Ej. Amortiguador delantero'),
              commonTextField('quantity', 'Cantidad', 'Ej. 2'),
              { id: 'notes', label: 'Comentarios', placeholder: 'Información adicional', value: '', multiline: true },
            ],
            submitLabel: 'Enviar pedido',
          }
        }
        break
      case 'Tareas':
        if (action === 'Crear') {
          return {
            title: 'Crear tarea nueva',
            description: 'Genera una nueva tarea operativa para el equipo.',
            fields: [
              commonTextField('title', 'Título', 'Ej. Revisión de frenos traseros'),
              commonTextField('priority', 'Prioridad', 'Alta / Media / Baja'),
              commonSelectField('assignedTo', 'Operario', users
                .filter((item) => item.category === 'Operario')
                .map((item) => item.fullName)),
              commonSelectField(
                'vehicle',
                'Vehículo',
                vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`),
              ),
              commonTextField('dueDate', 'Fecha de entrega', 'Ej. Hoy 16:00'),
            ],
            submitLabel: 'Crear tarea',
          }
        }
        if (action === 'Editar') {
          return {
            title: 'Editar tarea',
            description: 'Actualiza una tarea existente con nuevas instrucciones.',
            fields: [
              commonTextField('taskId', 'ID de tarea', 'Ej. t1'),
              { id: 'notes', label: 'Notas de edición', placeholder: 'Describe la actualización', value: '', multiline: true },
            ],
            submitLabel: 'Actualizar tarea',
          }
        }
        if (action === 'Completar') {
          return {
            title: 'Marcar tarea completada',
            description: 'Cierra la tarea y registra observaciones finales.',
            fields: [
              commonTextField('taskId', 'ID de tarea', 'Ej. t1'),
              { id: 'notes', label: 'Comentario final', placeholder: 'Descripción del cierre', value: '', multiline: true },
            ],
            submitLabel: 'Marcar completada',
          }
        }
        break
      case 'Solicitudes':
        if (action === 'Ingresar') {
          return {
            title: 'Solicitudes abiertas',
            description: 'Revisa las solicitudes actuales del taller.',
            content: 'Lista activa:\n• Lavado solicitado para V.15221\n• Repuesto solicitado para V.15218\n• Armado solicitado para V.15203',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        if (action === 'Solicitar') {
          const assigneeOptions = users.filter((u) => u.id !== user.id).map((u) => u.fullName)
          return {
            title: 'Delegar pedido a usuario',
            description: 'Selecciona el tipo de pedido, vehículo y usuario destino.',
            fields: [
              commonSelectField('requestType', 'Tipo de pedido', ['Lavar vehículo', 'Reparar vehículo', 'Solicitar pieza a encargado', 'Otro']),
              commonSelectField(
                'vehicle',
                'Vehículo',
                vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`),
              ),
              commonSelectField('assignedTo', 'Delegar a usuario', assigneeOptions.length ? assigneeOptions : [user.fullName]),
              commonTextField('requestTitle', 'Título', 'Ej. Lavar unidad en turno tarde'),
              commonTextField('part', 'Pieza/Repuesto (opcional)', 'Ej. Filtro de aceite'),
              commonTextField('quantity', 'Cantidad (opcional)', 'Ej. 1'),
              commonTextField('notes', 'Descripción', 'Detalles del pedido'),
            ],
            submitLabel: 'Delegar pedido',
          }
        }
        if (action === 'Ver historial') {
          return {
            title: 'Historial de solicitudes',
            description: 'Consulta las solicitudes procesadas recientemente.',
            content: 'Historial:\n• Pedido de repuestos completado\n• Lavado registrado\n• Armado solicitado enviado',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        break
      case 'Repuestos':
        if (action === 'Ingresar') {
          return {
            title: 'Inventario de repuestos',
            description: 'Consulta el stock disponible y la ubicación.',
            content: 'Stock actual:\n• Amortiguadores: 8\n• Lámparas delanteras: 15\n• Filtros de aceite: 20',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        if (action === 'Pedido') {
          return {
            title: 'Generar pedido de repuestos',
            description: 'Solicita las piezas que faltan en el taller.',
            fields: [
              commonSelectField(
                'vehicle',
                'Vehículo',
                vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`),
              ),
              commonTextField('part', 'Repuesto', 'Ej. Filtro de aceite'),
              commonTextField('quantity', 'Cantidad', 'Ej. 5'),
              commonTextField('notes', 'Comentarios', 'Información adicional'),
            ],
            submitLabel: 'Enviar pedido',
          }
        }
        if (action === 'Editar') {
          return {
            title: 'Actualizar repuesto',
            description: 'Modifica los datos de inventario o precios.',
            fields: [
              commonTextField('partId', 'ID de repuesto', 'Ej. rp-01'),
              commonTextField('newValue', 'Nuevo valor', 'Ej. Cantidad o precio'),
            ],
            submitLabel: 'Guardar cambios',
          }
        }
        break
      case 'Lavado':
        if (action === 'Programar') {
          return {
            title: 'Programar lavado',
            description: 'Agenda un vehículo para limpieza y asigna un operario.',
            fields: [
              commonSelectField(
                'assignedTo',
                'Operario',
                users.filter((item) => item.category === 'Operario').map((item) => item.fullName),
              ),
              commonSelectField(
                'vehicle',
                'Vehículo',
                vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`),
              ),
              commonTextField('date', 'Fecha', 'Ej. Hoy 18:00'),
              { id: 'notes', label: 'Notas', placeholder: 'Instrucciones de lavado', value: '', multiline: true },
            ],
            submitLabel: 'Programar lavado',
          }
        }
        if (action === 'Ver') {
          return {
            title: 'Vehículos listos para lavado',
            description: 'Consulta las unidades que esperan limpieza.',
            content: 'Listo para lavado:\n• V.15221\n• V.15218\n• V.15203',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        if (action === 'Confirmar') {
          return {
            title: 'Confirmar lavado',
            description: 'Registra la finalización del lavado del vehículo.',
            fields: [
              commonSelectField('vehicle', 'Vehículo', vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`)),
              { id: 'notes', label: 'Comentarios', placeholder: 'Estado final del lavado', value: '', multiline: true },
            ],
            submitLabel: 'Confirmar lavado',
          }
        }
        break
      case 'Fotografía':
        if (action === 'Abrir') {
          return {
            title: 'Módulo de fotografía',
            description: 'Revisa las unidades listas para imagen y venta.',
            content: 'Vehículos listos para foto:\n• V.15203\n• V.15218\n• V.15212',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        if (action === 'Subir') {
          if (!currentUser.username.includes('encargado') && currentUser.role !== 'Administrador' && currentUser.username !== 'encargadoGeneral08') {
            return {
              title: 'Subir imágenes',
              description: 'Solo el encargado de 08 puede subir fotos de vehículos.',
              content: 'Si no eres el encargado de 08, no puedes cargar fotos directamente. Pide al encargado que lo haga.',
              fields: [],
              submitLabel: 'Cerrar',
            }
          }

          return {
            title: 'Subir imágenes',
            description: 'Carga las fotos de los vehículos listos para el registro.',
            fields: [
              commonSelectField('vehicle', 'Vehículo', vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`)),
              { id: 'photo', label: 'Foto del vehículo', value: null, type: 'file', accept: 'image/*' },
              { id: 'notes', label: 'Descripción', placeholder: 'Detalles sobre las imágenes', value: '', multiline: true },
            ],
            submitLabel: 'Subir imágenes',
          }
        }
        if (action === 'Enviar') {
          return {
            title: 'Solicitar revisión de fotos',
            description: 'Envía las imágenes para aprobación del área de venta.',
            fields: [
              commonSelectField('vehicle', 'Vehículo', vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`)),
              { id: 'notes', label: 'Comentario', placeholder: 'Indicaciones para revisión', value: '', multiline: true },
            ],
            submitLabel: 'Enviar a revisión',
          }
        }
        break
      case 'Despacho':
        if (action === 'Preparar') {
          return {
            title: 'Preparar despacho',
            description: 'Organiza la unidad para su salida y documentación.',
            fields: [
              commonSelectField('vehicle', 'Vehículo', vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`)),
              commonTextField('destination', 'Destino', 'Ej. Cliente final'),
            ],
            submitLabel: 'Preparar despacho',
          }
        }
        if (action === 'Generar') {
          return {
            title: 'Generar guía de despacho',
            description: 'Crea el documento de envío para el vehículo.',
            fields: [
              commonTextField('document', 'Documento', 'Ej. Guía de remisión'),
              { id: 'notes', label: 'Observaciones', placeholder: 'Notas de envío', value: '', multiline: true },
            ],
            submitLabel: 'Generar guía',
          }
        }
        if (action === 'Confirmar') {
          return {
            title: 'Confirmar salida',
            description: 'Marca el vehículo como despachado y cierra el proceso.',
            fields: [
              commonSelectField('vehicle', 'Vehículo', vehicles.map((vehicle) => `${vehicle.code} · ${vehicle.model}`)),
              { id: 'notes', label: 'Comentarios', placeholder: 'Notas de salida', value: '', multiline: true },
            ],
            submitLabel: 'Confirmar salida',
          }
        }
        break
      case 'Indicadores':
        if (action === 'Ver') {
          return {
            title: 'Indicadores del taller',
            description: 'Revisa el rendimiento y metas actuales.',
            content: 'Indicadores:\n• Vehículos pendientes: 24\n• En preparación: 8\n• Listos para lavado: 5',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        if (action === 'Editar') {
          return {
            title: 'Editar objetivos',
            description: 'Ajusta las metas del taller para el periodo actual.',
            fields: [
              commonTextField('metric', 'Métrica', 'Ej. Vehículos pendientes'),
              commonTextField('value', 'Nuevo objetivo', 'Ej. 20'),
            ],
            submitLabel: 'Guardar objetivo',
          }
        }
        if (action === 'Exportar') {
          return {
            title: 'Exportar reporte',
            description: 'Prepara la descarga de indicadores y resultados.',
            content: 'Reporte preparado para exportación. Descárgalo desde la sección de informes.',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        break
      case 'Historial':
        if (action === 'Consultar') {
          return {
            title: 'Consultar historial',
            description: 'Busca movimientos anteriores por vehículo o fecha.',
            fields: [commonTextField('query', 'Buscar', 'Ej. V.15203 o fecha')],
            submitLabel: 'Buscar',
          }
        }
        if (action === 'Filtrar') {
          return {
            title: 'Filtrar registros',
            description: 'Aplica filtros para acotar el historial por fecha o estado.',
            fields: [
              commonTextField('from', 'Desde', 'Ej. 01/08/2026'),
              commonTextField('to', 'Hasta', 'Ej. 06/08/2026'),
            ],
            submitLabel: 'Aplicar filtro',
          }
        }
        if (action === 'Exportar') {
          return {
            title: 'Exportar historial',
            description: 'Genera un archivo con el historial filtrado.',
            content: 'El historial se está generando y estará disponible para descarga en breve.',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        break
      case 'Usuarios':
        if (action === 'Agregar') {
          return {
            title: 'Agregar usuario',
            description: 'Registra un nuevo usuario en el sistema.',
            fields: [
              commonTextField('fullName', 'Nombre completo', 'Ej. Poloni Diego Sebastian'),
              commonTextField('username', 'Usuario', 'Ej. operario08'),
              commonTextField('password', 'Contraseña', 'Ej. changeme123'),
              commonTextField('role', 'Rol', 'Ej. Operario 08'),
              commonSelectField('category', 'Categoría', ['Operario', 'Encargado', 'Referente', 'Administrador']),
              commonTextField('permissions', 'Permisos', 'Ej. ingresar,editar,ver'),
            ],
            submitLabel: 'Agregar usuario',
          }
        }
        if (action === 'Editar') {
          return {
            title: 'Editar usuario',
            description: 'Selecciona un usuario para actualizar permisos o eliminarlo.',
            fields: [
              commonSelectField(
                'userFullName',
                'Seleccionar usuario',
                users.map((item) => item.fullName),
              ),
              commonTextField('permissions', 'Permisos', 'Ej. ingresar,editar,ver'),
              commonSelectField('deleteUser', 'Eliminar usuario', ['No', 'Sí']),
            ],
            submitLabel: 'Guardar cambios',
          }
        }
        if (action === 'Ver') {
          return {
            title: 'Equipo activo',
            description: 'Revisa a los usuarios registrados y sus roles.',
            content: 'Usuarios activos:\n• Poloni Diego Sebastian\n• Gutierrez Eliot Francisco\n• Krenz Jose Luis\n• Giordano Nahir\n• Marques Facundo\n• Marques Fernando\n• Encargado Planta',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        break
      case 'Configuración':
        if (action === 'Ajustar') {
          return {
            title: 'Ajustar sistema',
            description: 'Modifica parámetros del dashboard y el taller.',
            fields: [
              commonTextField('setting', 'Parámetro', 'Ej. Horario de operación'),
              commonTextField('value', 'Nuevo valor', 'Ej. 08:00 - 18:00'),
            ],
            submitLabel: 'Guardar ajuste',
          }
        }
        if (action === 'Administrar') {
          return {
            title: 'Administrar permisos',
            description: 'Revisa y asigna permisos para el sistema.',
            content: 'Selecciona un usuario para administrar permisos en el panel de Administración.',
            fields: [],
            submitLabel: 'Cerrar',
          }
        }
        if (action === 'Actualizar') {
          return {
            title: 'Actualizar perfil',
            description: 'Cambia datos del perfil del taller o el usuario.',
            fields: [
              commonTextField('profileField', 'Campo', 'Ej. Nombre del taller'),
              commonTextField('newValue', 'Nuevo valor', 'Ej. Taller ECO 08'),
            ],
            submitLabel: 'Actualizar',
          }
        }
        break
    }

    return {
      title: action,
      description: `Acción de ${section}`,
      content: 'Esta acción abre un flujo de trabajo específico del módulo.',
      fields: [],
      submitLabel: 'Cerrar',
    }
  }

  const setModalFields = (fields: ActionField[]) => {
    setFormValues(Object.fromEntries(fields.map((field) => [field.id, field.value ?? ''])))
  }

  const handleModuleAction = (action: string) => {
    const splitIndex = action.lastIndexOf(' - ')
    const rawAction = splitIndex >= 0 ? action.slice(0, splitIndex) : action
    const section = splitIndex >= 0 ? action.slice(splitIndex + 3) : selectedSection

    if (!requireActionPermission(section, rawAction)) {
      return
    }

    const config = buildModalConfig(rawAction, section, user)
    setModalConfig(config as any)
    setModalFields(config.fields as any)
    setModalAction({ action: rawAction, section })
    setModalOpen(true)
  }

  const handleFieldChange = (id: string, value: string | File | null) => {
    setFormValues((current) => ({ ...current, [id]: value }))
  }

  const modalFieldsWithValues = modalConfig.fields.map((field) => ({
    ...field,
    value: formValues[field.id] ?? field.value,
  }))

  const handleModalSubmit = () => {
    if (modalAction) {
      const values = formValues
      const toStr = (v: string | File | null | undefined) => (typeof v === 'string' ? v : v == null ? '' : '')

      if (!requireActionPermission(modalAction.section, modalAction.action)) {
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Historial' && modalAction.action === 'Consultar') {
        const queryValue = toStr(values.query)
        setHistorySearch(queryValue)
        setFeedbackMessage(queryValue ? `Resultado filtrado por: ${queryValue}` : 'Se limpió la búsqueda del historial.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Historial' && modalAction.action === 'Filtrar') {
        const from = toStr(values.from)
        const to = toStr(values.to)
        setHistoryRange({ from, to })
        setFeedbackMessage(from || to ? `Historial filtrado desde ${from || 'inicio'} hasta ${to || 'hoy'}.` : 'Se limpiaron los filtros del historial.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Inicio' && modalAction.action === 'Ver alertas') {
        setSelectedSection('Notificaciones')
        setFeedbackMessage('Revisaste las alertas del taller y se abrió la bandeja de notificaciones.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Notificaciones' && modalAction.action === 'Ver') {
        setNotifications((current) => current.map((item) => ({ ...item, read: true })))
        setFeedbackMessage('Todas las notificaciones fueron marcadas como leídas.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Notificaciones' && modalAction.action === 'Ver historial') {
        setSelectedSection('Historial')
        setFeedbackMessage('Se abrió el historial de avisos y registros del taller.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Inicio' && modalAction.action === 'Ingresar') {
        setSelectedSection('Inicio')
        setFeedbackMessage('Ingreso al panel principal del taller. Se actualizó la vista de resumen operativo.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Notificaciones' && modalAction.action === 'Ingresar') {
        setSelectedSection('Notificaciones')
        setNotifications((current) => current.map((item) => ({ ...item, read: item.toUser ? true : item.read })))
        setFeedbackMessage('Se abrió la bandeja de notificaciones y se registró la revisión activa del taller.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Solicitudes' && modalAction.action === 'Ingresar') {
        setSelectedSection('Solicitudes')
        setFeedbackMessage(`Solicitudes abiertas: ${requests.length} registros activos.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Repuestos' && modalAction.action === 'Ingresar') {
        setSelectedSection('Repuestos')
        setFeedbackMessage('Inventario revisado. Se cargó la vista de stock y pedidos del taller.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Lavado' && modalAction.action === 'Ver') {
        setSelectedSection('Lavado')
        setFeedbackMessage('Listado de lavado actualizado con vehículos pendientes y en proceso.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Indicadores' && modalAction.action === 'Ver') {
        setSelectedSection('Indicadores')
        setFeedbackMessage(`Indicadores del taller actualizados: meta diaria ${systemSettings.dailyTarget}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Usuarios' && modalAction.action === 'Ver') {
        setSelectedSection('Usuarios')
        setFeedbackMessage(`Equipo activo consultado: ${users.length} usuarios registrados.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Configuración' && modalAction.action === 'Administrar') {
        setSelectedSection('Usuarios')
        setFeedbackMessage('Se abrió el panel de administración de permisos del sistema.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Tareas' && modalAction.action === 'Editar') {
        const taskId = toStr(values.taskId)
        if (!taskId) {
          setFeedbackMessage('Indicá la tarea que querés editar para aplicar el cambio real.')
          return
        }

        const targetTask = tasks.find((task) => task.id === taskId)
        if (!targetTask) {
          setFeedbackMessage(`No se encontró la tarea ${taskId}.`)
          return
        }

        const updatedNotes = toStr(values.notes)
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId ? { ...task, dueDate: updatedNotes ? `Actualizado · ${new Date().toLocaleDateString()}` : task.dueDate } : task,
          ),
        )

        setHistoryRecords((current) => [
          {
            id: `h${Date.now()}`,
            type: 'Tarea',
            title: `Tarea actualizada ${targetTask.id}`,
            description: updatedNotes || `Se actualizó la tarea ${targetTask.title}.`,
            vehicle: targetTask.vehicle,
            operator: user.fullName,
            actionBy: user.fullName,
            createdAt: new Date().toISOString(),
            status: 'Activo',
          },
          ...current,
        ])

        setFeedbackMessage(`Tarea actualizada: ${targetTask.title}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Fotografía' && modalAction.action === 'Enviar') {
        const targetVehicleCode = typeof values.vehicle === 'string' ? values.vehicle.split(' · ')[0] : ''
        if (!targetVehicleCode) {
          setFeedbackMessage('Selecciona un vehículo antes de enviar la revisión fotográfica.')
          return
        }
        setHistoryRecords((current) => [
          {
            id: `h${Date.now()}`,
            type: 'Pedido',
            title: `Revisión fotográfica ${targetVehicleCode}`,
            description: toStr(values.notes) || 'Se envió la revisión fotográfica para aprobación.',
            vehicle: targetVehicleCode,
            operator: user.fullName,
            createdAt: new Date().toISOString(),
            status: 'Activo',
          },
          ...current,
        ])
        setFeedbackMessage(`Revisión fotográfica enviada para ${targetVehicleCode}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Despacho' && modalAction.action === 'Preparar') {
        const targetVehicleCode = typeof values.vehicle === 'string' ? values.vehicle.split(' · ')[0] : ''
        if (!targetVehicleCode) {
          setFeedbackMessage('Selecciona un vehículo para preparar el despacho.')
          return
        }
        setVehicles((current) => current.map((vehicle) => vehicle.code === targetVehicleCode ? { ...vehicle, status: 'Preparacion' } : vehicle))
        setHistoryRecords((current) => [
          {
            id: `h${Date.now()}`,
            type: 'Pedido',
            title: `Despacho preparado ${targetVehicleCode}`,
            description: `Destino: ${toStr(values.destination) || 'No informado'}`,
            vehicle: targetVehicleCode,
            operator: user.fullName,
            createdAt: new Date().toISOString(),
            status: 'Activo',
          },
          ...current,
        ])
        setFeedbackMessage(`Preparación de despacho cargada para ${targetVehicleCode}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Despacho' && modalAction.action === 'Generar') {
        const docName = toStr(values.document) || 'Guía de despacho'
        setHistoryRecords((current) => [
          {
            id: `h${Date.now()}`,
            type: 'Pedido',
            title: `Guía generada: ${docName}`,
            description: toStr(values.notes) || 'Documento generado para entrega.',
            operator: user.fullName,
            createdAt: new Date().toISOString(),
            status: 'Activo',
          },
          ...current,
        ])
        setFeedbackMessage(`Guía de despacho creada: ${docName}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Despacho' && modalAction.action === 'Confirmar') {
        const targetVehicleCode = typeof values.vehicle === 'string' ? values.vehicle.split(' · ')[0] : ''
        if (!targetVehicleCode) {
          setFeedbackMessage('Selecciona un vehículo antes de confirmar la salida.')
          return
        }
        setVehicles((current) => current.map((vehicle) => vehicle.code === targetVehicleCode ? { ...vehicle, status: 'Finalizado' } : vehicle))
        setHistoryRecords((current) => [
          {
            id: `h${Date.now()}`,
            type: 'Pedido',
            title: `Salida confirmada ${targetVehicleCode}`,
            description: toStr(values.notes) || 'Vehículo entregado y salida confirmada.',
            vehicle: targetVehicleCode,
            operator: user.fullName,
            createdAt: new Date().toISOString(),
            status: 'Completada',
          },
          ...current,
        ])
        setFeedbackMessage(`Salida confirmada para ${targetVehicleCode}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Indicadores' && modalAction.action === 'Editar') {
        const metric = toStr(values.metric)
        const numericValue = toStr(values.value)
        if (!metric || !numericValue) {
          setFeedbackMessage('Completá la métrica y el nuevo objetivo para guardar el cambio.')
          return
        }
        setSystemSettings((current) => ({ ...current, dailyTarget: numericValue }))
        setFeedbackMessage(`Meta actualizada: ${metric} = ${numericValue}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.action.startsWith('Ver detalles de ')) {
        const detailTarget = modalAction.action.replace(/^Ver detalles de\s+/i, '')
        setFeedbackMessage(`Detalles revisados: ${detailTarget} · módulo ${modalAction.section}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Indicadores' && modalAction.action === 'Exportar') {
        const csv = ['Métrica,Valor', `Objetivo diario,${systemSettings.dailyTarget}`, `Horario,${systemSettings.schedule}`].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `indicadores-ecotask-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
        setFeedbackMessage('Reporte de indicadores exportado correctamente.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Configuración' && modalAction.action === 'Ajustar') {
        const setting = toStr(values.setting)
        const value = toStr(values.value)
        if (!setting || !value) {
          setFeedbackMessage('Completá el parámetro y el valor nuevo para guardar el ajuste.')
          return
        }
        setSystemSettings((current) => ({
          ...current,
          ...(setting.toLowerCase().includes('horario') ? { schedule: value } : {}),
          ...(setting.toLowerCase().includes('nombre') || setting.toLowerCase().includes('taller') ? { title: value } : {}),
          ...(setting.toLowerCase().includes('meta') || setting.toLowerCase().includes('objetivo') ? { dailyTarget: value } : {}),
        }))
        setFeedbackMessage(`Ajuste guardado: ${setting} = ${value}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Configuración' && modalAction.action === 'Actualizar') {
        const field = toStr(values.profileField)
        const value = toStr(values.newValue)
        if (!field || !value) {
          setFeedbackMessage('Ingresá un campo y el nuevo valor para actualizar el perfil.')
          return
        }
        setSystemSettings((current) => ({ ...current, [field.toLowerCase().includes('taller') ? 'title' : 'schedule']: value }))
        setFeedbackMessage(`Perfil actualizado: ${field} = ${value}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Repuestos' && modalAction.action === 'Editar') {
        const partId = toStr(values.partId)
        const newValue = toStr(values.newValue)
        if (!partId || !newValue) {
          setFeedbackMessage('Ingresá el repuesto y el valor nuevo antes de guardar.')
          return
        }
        setHistoryRecords((current) => [
          {
            id: `h${Date.now()}`,
            type: 'Pedido',
            title: `Inventario actualizado ${partId}`,
            description: newValue,
            operator: user.fullName,
            createdAt: new Date().toISOString(),
            status: 'Completada',
          },
          ...current,
        ])
        setFeedbackMessage(`Repuesto actualizado: ${partId}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Inicio' && modalAction.action === 'Solicitar') {
        const title = toStr(values.requestTitle) || 'Solicitud general'
        const description = toStr(values.notes) || 'Solicitante: ' + user.fullName
        const newRequest: RequestItem = {
          id: `r${Date.now()}`,
          title,
          description,
          timeAgo: 'Ahora',
          badgeColor: 'bg-emerald-500/10 text-emerald-200',
          requestType: 'Solicitud general',
          requestedBy: user.fullName,
          assignedTo: user.fullName,
          vehicle: undefined,
          operator: user.fullName,
        }
        setRequests((current) => [newRequest, ...current])
        setHistoryRecords((current) => [
          {
            id: `h${Date.now()}`,
            type: 'Solicitud',
            title,
            description,
            actionBy: user.fullName,
            requestedBy: user.fullName,
            assignedTo: user.fullName,
            createdAt: new Date().toISOString(),
            status: 'Activo',
          },
          ...current,
        ])
        setFeedbackMessage(`Solicitud creada: ${title}.`)
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Notificaciones' && modalAction.action === 'Ingresar') {
        setSelectedSection('Notificaciones')
        setFeedbackMessage('Bandeja abierta. Puedes revisar la actividad del taller.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      if (modalAction.section === 'Notificaciones' && modalAction.action === 'Ver historial') {
        setSelectedSection('Historial')
        setFeedbackMessage('Se abrió el historial de notificaciones y registros del taller.')
        setModalOpen(false)
        setFormValues({})
        return
      }

      const createRequest = async () => {
        const hasRequestValue = Boolean(toStr(values.part) || toStr(values.requestTitle) || toStr(values.notes) || toStr(values.quantity) || toStr(values.vehicle))
        if (!hasRequestValue) {
          setFeedbackMessage('No se registró ninguna solicitud porque no ingresaste datos.')
          return
        }

        const vehicleLabel = toStr(values.vehicle)
        const requestType = toStr(values.requestType) || (modalAction.action === 'Solicitar' ? 'Solicitud general' : 'Pedido general')
        const assignee = toStr(values.assignedTo) || user.fullName
        const requester = user.fullName
        const title = modalAction.action === 'Solicitar' ? (toStr(values.requestTitle) || `${requestType} - ${vehicleLabel || modalAction.section}`) : `Pedido de ${modalAction.section}`
        const description = `${vehicleLabel}${vehicleLabel && toStr(values.part) ? ' · ' : ''}${
          toStr(values.part) ? `${toStr(values.part)}${toStr(values.quantity) ? ` · ${toStr(values.quantity)}` : ''}` : toStr(values.requestTitle) || toStr(values.notes) || modalAction.section
        } · Solicitado por: ${requester} · Delegado a: ${assignee}`
        const badgeColor = 'bg-cyan-500/10 text-cyan-200'
        const newRequest: RequestItem = {
          id: `r${Date.now()}`,
          title,
          description,
          timeAgo: 'Ahora',
          badgeColor,
          requestType,
          requestedBy: requester,
          assignedTo: assignee,
          vehicle: toStr(values.vehicle) || undefined,
          operator: requester,
        }

        try {
          const apiPayload = {
            title,
            description,
            requestType,
            assignedTo: assignee,
            vehicle: toStr(values.vehicle) || undefined,
          }
          const created = await apiFetch('/api/requests', 'POST', apiPayload)
          if (created) {
            const backendItem = {
              ...newRequest,
              id: String(created.id || newRequest.id),
              requestType: created.type || requestType,
              description: created.description || description,
            }
            setRequests((current) => [backendItem, ...current.filter((item) => item.id !== newRequest.id)])
          } else {
            setRequests((current) => [newRequest, ...current])
          }
        } catch (error) {
          setRequests((current) => [newRequest, ...current])
          setFeedbackMessage(error instanceof Error ? error.message : 'No se pudo guardar la solicitud en la base.')
          return
        }

        setHistoryRecords((current) => [
          {
            id: `h${Date.now()}`,
            type: modalAction.action === 'Solicitar' ? 'Solicitud' : 'Pedido',
            title,
            description,
            actionBy: requester,
            requestedBy: requester,
            assignedTo: assignee,
            vehicle: toStr(values.vehicle) || undefined,
            operator: requester,
            createdAt: new Date().toISOString(),
            status: 'Activo',
          },
          ...current,
        ])
        setNotifications((current) => [
          {
            id: `n-${Date.now()}-self`,
            message: `Delegaste pedido a ${assignee}: ${title}`,
            createdAt: new Date().toISOString(),
            read: false,
            fromUser: requester,
            toUser: assignee,
            requestId: newRequest.id,
          },
          ...current,
        ])
        setFeedbackMessage(`Pedido delegado: ${title} -> ${assignee}`)
        if (broadcast) {
          try {
            const notificationState = {
              requests: [newRequest],
              historyRecords: [{
                id: `h${Date.now()}-n`,
                type: modalAction.action === 'Solicitar' ? 'Solicitud' : 'Pedido',
                title: `Notificación enviada a ${assignee}`,
                description: `Pedido: ${title}`,
                actionBy: requester,
                requestedBy: requester,
                assignedTo: assignee,
                vehicle: toStr(values.vehicle) || undefined,
                operator: requester,
                createdAt: new Date().toISOString(),
                status: 'Activo',
              }],
              notifications: [{
                id: `n-${Date.now()}-remote`,
                message: `Nuevo pedido para ti: ${title}. Solicitado por ${requester}`,
                createdAt: new Date().toISOString(),
                read: false,
                fromUser: requester,
                toUser: assignee,
                requestId: newRequest.id,
              }],
            }
            // @ts-ignore
            broadcast.postMessage({
              type: 'notification',
              targetUser: assignee,
              fromUser: requester,
              requestId: newRequest.id,
              message: `Nuevo pedido para ti: ${title}. Solicitado por ${requester}`,
              state: notificationState,
            })
          } catch {}
        }
      }

      const createUser = async () => {
        if (!isAdmin && !userPermissions.includes('agregar')) {
          setFeedbackMessage('No tenés permiso para crear usuarios.')
          return
        }
        if (!values.username || !values.fullName) {
          setFeedbackMessage('Debes ingresar nombre y usuario.')
          return
        }
        const newUser: User = {
          id: toStr(values.username),
          username: toStr(values.username),
          password: toStr(values.password) || 'changeme123',
          fullName: toStr(values.fullName),
          role: toStr(values.role) || 'Operario',
          category: (toStr(values.category) as User['category']) || 'Operario',
          permissions: toStr(values.permissions)
            ? toStr(values.permissions).split(',').map((permission) => permission.trim()).filter(Boolean)
            : [],
        }

        try {
          const created = await apiFetch('/api/users', 'POST', {
            username: newUser.username,
            fullName: newUser.fullName,
            role: newUser.role,
            category: newUser.category,
            permissions: newUser.permissions,
            password: newUser.password,
          })
          if (created) {
            setUsers((current) => {
              const createdUser = { ...newUser, id: String(created.id || newUser.id), permissions: Array.isArray(created.permissions) ? created.permissions : newUser.permissions }
              return [createdUser, ...current.filter((item) => item.id !== createdUser.id)]
            })
          } else {
            setUsers((current) => [newUser, ...current])
          }
        } catch (error) {
          setUsers((current) => [newUser, ...current])
          setFeedbackMessage(error instanceof Error ? error.message : 'No se pudo guardar el usuario en la base.')
          return
        }

        setFeedbackMessage(`Usuario agregado: ${newUser.fullName}`)
        if (broadcast) {
          try {
            // @ts-ignore
            broadcast.postMessage({ type: 'notification', message: `Usuario agregado: ${newUser.fullName}`, state: { users: [newUser] } })
          } catch {}
        }
      }

      const createTask = async () => {
        if (!values.title) {
          setFeedbackMessage('No se creó la tarea porque falta el título.')
          return
        }
        const newTask: Task = {
          id: `t${Date.now()}`,
          title: toStr(values.title),
          priority: (toStr(values.priority) as Task['priority']) || 'Media',
          assignedTo: toStr(values.assignedTo) || user.fullName,
          dueDate: toStr(values.dueDate) || 'Próximamente',
          vehicle: toStr(values.vehicle) || undefined,
        }

        try {
          const created = await apiFetch('/api/tasks', 'POST', {
            title: newTask.title,
            priority: newTask.priority,
            assignedTo: newTask.assignedTo,
            dueDate: newTask.dueDate,
            vehicle: newTask.vehicle,
          })
          if (created) {
            setTasks((current) => [{ ...newTask, id: String(created.id || newTask.id) }, ...current.filter((item) => item.id !== newTask.id)])
          } else {
            setTasks((current) => [newTask, ...current])
          }
        } catch (error) {
          setTasks((current) => [newTask, ...current])
          setFeedbackMessage(error instanceof Error ? error.message : 'No se pudo guardar la tarea en la base.')
          return
        }

        setHistoryRecords((current) => [
          {
            id: `h${Date.now()}`,
            type: 'Tarea',
            title: newTask.title,
            description: `Asignado a ${newTask.assignedTo}${newTask.vehicle ? ` · ${newTask.vehicle}` : ''}`,
            vehicle: newTask.vehicle,
            operator: newTask.assignedTo,
            createdAt: new Date().toISOString(),
            status: 'Activo',
          },
          ...current,
        ])
        setFeedbackMessage(`Tarea creada: ${newTask.title}`)
        if (broadcast) {
          try {
            // @ts-ignore
            broadcast.postMessage({ type: 'notification', message: `Tarea creada: ${newTask.title}`, state: { tasks: [newTask] } })
          } catch {}
        }
      }

      const editUser = () => {
        if (!isAdmin && !userPermissions.includes('editar')) {
          setFeedbackMessage('No tenés permiso para editar usuarios.')
          return
        }
        const selectedUser = users.find((item) => item.fullName === toStr(values.userFullName))
        if (!selectedUser) {
          setFeedbackMessage('Usuario no encontrado.')
          return
        }
        if (values.deleteUser === 'Sí') {
          if (!isAdmin) {
            setFeedbackMessage('Solo un administrador puede eliminar usuarios.')
            return
          }
          handleDeleteUser(selectedUser.id)
          return
        }
        if (toStr(values.permissions)) {
          const updatedPermissions = toStr(values.permissions).split(',').map((permission) => permission.trim().toLowerCase()).filter(Boolean)
          setUsers((current) =>
            current.map((item) =>
              item.id === selectedUser.id ? { ...item, permissions: updatedPermissions } : item,
            ),
          )
          if (user.id === selectedUser.id) {
            setUser((currentUser) => ({ ...currentUser, permissions: updatedPermissions }))
          }
          setFeedbackMessage(`Permisos actualizados para ${selectedUser.fullName}`)
          return
        }
        setFeedbackMessage('No se realizaron cambios en el usuario.')
      }

      const createVehicle = async () => {
        if (!values.code || !values.dominio) {
          setFeedbackMessage('Debes ingresar al menos código y dominio del vehículo.')
          return
        }

        const normalizedCode = toStr(values.code).trim()
        const duplicate = vehicles.some((vehicle) => vehicle.code.toLowerCase() === normalizedCode.toLowerCase())
        if (duplicate) {
          setFeedbackMessage(`Ya existe un vehículo con el código ${normalizedCode}.`)
          return
        }

        const newVehicle: Vehicle = {
          id: `v${Date.now()}`,
          code: normalizedCode,
          model: toStr(values.model) || 'Sin modelo definido',
          status: (toStr(values.status) as Vehicle['status']) || 'Ingresado',
          mechanic: toStr(values.mechanic) || 'Sin asignar',
          image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
          dominio: toStr(values.dominio),
          motorNumber: toStr(values.motorNumber) || '',
          chassisNumber: toStr(values.chassisNumber) || '',
          bajaTag: toStr(values.bajaTag) || '',
          owner: user.username,
        }

        try {
          const created = await apiFetch('/api/vehicles', 'POST', {
            code: newVehicle.code,
            model: newVehicle.model,
            status: newVehicle.status,
            mechanic: newVehicle.mechanic,
            dominio: newVehicle.dominio,
            motorNumber: newVehicle.motorNumber,
            chassisNumber: newVehicle.chassisNumber,
            bajaTag: newVehicle.bajaTag,
            image: newVehicle.image,
          })
          if (created) {
            setVehicles((current) => [{ ...newVehicle, id: String(created.id || newVehicle.id) }, ...current.filter((item) => item.id !== newVehicle.id)])
          } else {
            setVehicles((current) => [newVehicle, ...current])
          }
        } catch (error) {
          setVehicles((current) => [newVehicle, ...current])
          setFeedbackMessage(error instanceof Error ? error.message : 'No se pudo guardar el vehículo en la base.')
          return
        }

        setHistoryRecords((current) => [
          {
            id: `h${Date.now()}`,
            type: 'Pedido',
            title: `Vehículo ingresado ${newVehicle.code}`,
            description: `${newVehicle.model} · ${newVehicle.dominio}`,
            vehicle: newVehicle.code,
            operator: newVehicle.mechanic,
            createdAt: new Date().toISOString(),
            status: 'Activo',
          },
          ...current,
        ])
        setFeedbackMessage(`Vehículo ingresado: ${newVehicle.code}`)
        if (broadcast) {
          try {
            // @ts-ignore
            broadcast.postMessage({ type: 'notification', message: `Vehículo ingresado: ${newVehicle.code}`, state: { vehicles: [newVehicle] } })
          } catch {}
        }
      }

      const completeTask = () => {
        const taskId = toStr(values.taskId)
        if (taskId) {
          const targetTask = tasks.find((task) => task.id === taskId)
          if (!targetTask) {
            setFeedbackMessage(`No se encontró la tarea: ${taskId}`)
            return
          }
          if (!isAdmin && targetTask.assignedTo !== user.fullName) {
            setFeedbackMessage('Solo el asignado o un administrador puede completar esta tarea.')
            return
          }
          setTasks((current) => current.filter((task) => task.id !== taskId))
          setHistoryRecords((current) => [
            {
              id: `h${Date.now()}`,
              type: 'Tarea',
              title: targetTask.title,
              description: `Completada por ${user.fullName}${targetTask.vehicle ? ` · ${targetTask.vehicle}` : ''}`,
              vehicle: targetTask.vehicle,
              operator: user.fullName,
              actionBy: user.fullName,
              createdAt: new Date().toISOString(),
              status: 'Completada',
            },
            ...current,
          ])
          setFeedbackMessage(`Tarea completada: ${taskId}`)
          return
        }
        setFeedbackMessage('Debes indicar el ID de la tarea a completar.')
      }

      if (modalAction.section === 'Tareas' && modalAction.action === 'Crear') {
        createTask()
      } else if (modalAction.section === 'Tareas' && modalAction.action === 'Completar') {
        completeTask()
      } else if (modalAction.section === 'Usuarios' && modalAction.action === 'Agregar') {
        createUser()
      } else if (modalAction.section === 'Usuarios' && modalAction.action === 'Editar') {
        editUser()
        } else if (modalAction.section === 'Vehículos 08' && modalAction.action === 'Ingresar') {
        createVehicle()
      } else if (modalAction.section === 'Vehículos 08' && modalAction.action === 'Editar') {
        const targetVehicleCode = typeof values.vehicle === 'string' ? values.vehicle.split(' · ')[0] : ''
        if (!targetVehicleCode) {
          setFeedbackMessage('Selecciona un vehículo para editar.')
        } else {
          const newStatus = (toStr(values.status) as Vehicle['status']) || undefined
          const newMechanic = toStr(values.mechanic) || undefined

          if (newStatus === 'Finalizado') {
            // request confirmation before finalizing
            setPendingFinalization({ code: targetVehicleCode, notes: toStr(values.notes) })
            setConfirmOpen(true)
            return
          } else {
            setVehicles((current) =>
              current.map((vehicle) =>
                vehicle.code === targetVehicleCode
                  ? {
                      ...vehicle,
                      status: newStatus || vehicle.status,
                      mechanic: newMechanic || vehicle.mechanic,
                    }
                  : vehicle,
              ),
            )
            setHistoryRecords((current) => [
              {
                id: `h${Date.now()}`,
                type: 'Pedido',
                title: `Actualización de ${targetVehicleCode}`,
                description: values.notes ? values.notes.toString() : 'Estado del vehículo actualizado.',
                vehicle: targetVehicleCode,
                operator: user.fullName,
                createdAt: new Date().toISOString(),
                status: 'Activo',
              },
              ...current,
            ])
            setFeedbackMessage(`Vehículo actualizado: ${targetVehicleCode}`)
          }
        }
      } else if (modalAction.section === 'Lavado' && modalAction.action === 'Confirmar') {
        const targetVehicleCode = typeof values.vehicle === 'string' ? values.vehicle.split(' · ')[0] : ''
        if (!targetVehicleCode) {
          setFeedbackMessage('Selecciona un vehículo para confirmar el lavado.')
        } else {
          setVehicles((current) =>
            current.map((vehicle) =>
              vehicle.code === targetVehicleCode ? { ...vehicle, status: 'Lavado' } : vehicle,
            ),
          )
          setHistoryRecords((current) => [
            {
              id: `h${Date.now()}`,
              type: 'Pedido',
              title: `Lavado completado ${targetVehicleCode}`,
              description: values.notes ? values.notes.toString() : 'Vehículo lavado y listo.',
              vehicle: targetVehicleCode,
              operator: user.fullName,
              createdAt: new Date().toISOString(),
              status: 'Completada',
            },
            ...current,
          ])
          setFeedbackMessage(`Lavado confirmado: ${targetVehicleCode}`)
        }
      } else if (modalAction.section === 'Fotografía' && modalAction.action === 'Subir') {
        const targetVehicleCode = typeof values.vehicle === 'string' ? values.vehicle.split(' · ')[0] : ''
        const photoFile = values.photo as File | null
        if (!targetVehicleCode) {
          setFeedbackMessage('Selecciona un vehículo para subir la foto.')
        } else if (!photoFile) {
          setFeedbackMessage('Sube una imagen para continuar.')
        } else if (!currentUserCanUploadPhotos && !isAdmin) {
          setFeedbackMessage('Solo el encargado de 08 o un administrador puede subir fotos de vehículos.')
        } else {
          const reader = new FileReader()
          reader.onload = () => {
            const imageUrl = reader.result as string
            setVehicles((current) =>
              current.map((vehicle) =>
                vehicle.code === targetVehicleCode
                  ? {
                      ...vehicle,
                      status: 'Fotografia',
                      photos: [...(vehicle.photos ?? []), imageUrl],
                    }
                  : vehicle,
              ),
            )
            setHistoryRecords((current) => [
              {
                id: `h${Date.now()}`,
                type: 'Pedido',
                title: `Foto subida ${targetVehicleCode}`,
                description: values.notes ? values.notes.toString() : 'Imagen del vehículo cargada por encargado 08.',
                vehicle: targetVehicleCode,
                operator: user.fullName,
                createdAt: new Date().toISOString(),
                status: 'Activo',
              },
              ...current,
            ])
            setFeedbackMessage(`Foto cargada para ${targetVehicleCode}`)
            if (broadcast) {
              try {
                // @ts-ignore
                broadcast.postMessage({ type: 'notification', message: `Foto cargada para ${targetVehicleCode}`, state: { vehicles } })
              } catch {}
            }
          }
          reader.readAsDataURL(photoFile)
        }
      } else if (['Pedido', 'Solicitar'].includes(modalAction.action)) {
        createRequest()
      } else {
        const details = Object.entries(formValues)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
        setFeedbackMessage(`Acción enviada: ${modalConfig.title}${details ? `\n${details}` : ''}`)
      }
    }

    setFormValues({})
    setModalOpen(false)
  }


  const performFinalization = () => {
    if (!pendingFinalization) return
    const { code, notes } = pendingFinalization
    // remove from active vehicles
    setVehicles((current) => current.filter((v) => v.code !== code))
    const archivedAt = new Date().toISOString()
    const found = vehicles.find((v) => v.code === code)
    if (found) {
      setArchivedVehicles((current) => [...current, { ...found, archivedAt }])
    }
    setHistoryRecords((current) => [
      {
        id: `h${Date.now()}`,
        type: 'Pedido',
        title: `Vehículo finalizado ${code}`,
        description: notes || 'El vehículo fue marcado como Finalizado y archivado.',
        vehicle: code,
        operator: user.fullName,
        createdAt: new Date().toISOString(),
        status: 'Completada',
      },
      ...current,
    ])
    setFeedbackMessage(`Vehículo finalizado y archivado: ${code}`)
    setDetailVehicleId((cur) => (cur && cur.includes(code) ? null : cur))
    setPendingFinalization(null)
    setConfirmOpen(false)
    setFormValues({})
    setModalOpen(false)
    if (broadcast) {
      try {
        // @ts-ignore
        broadcast.postMessage({ type: 'state-update', state: { archivedVehicles } })
      } catch {}
    }
  }

  const openEditVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (!vehicle) {
      setFeedbackMessage('Vehículo no encontrado.')
      return
    }
    const config = buildModalConfig('Editar', 'Vehículos 08', user)
    setModalConfig(config as any)
    // prefill values
    const initialValues: Record<string, string | File | null> = {}
    config.fields.forEach((f) => {
      if (f.id === 'vehicle') initialValues['vehicle'] = `${vehicle.code} · ${vehicle.model}`
      else if (f.id === 'status') initialValues['status'] = vehicle.status
      else if (f.id === 'mechanic') initialValues['mechanic'] = vehicle.mechanic
      else initialValues[f.id] = f.value ?? ''
    })
    setFormValues(initialValues)
    setModalAction({ action: 'Editar', section: 'Vehículos 08' })
    setModalOpen(true)
  }

  const handleCompleteRequest = async (id: string) => {
    const completedRequests = requests.filter((request) => request.id === id)
    if (completedRequests.length === 0) return
    const completedRequest = completedRequests[0]
    const canComplete =
      isAdmin ||
      completedRequest.assignedTo === user.fullName ||
      completedRequest.assignedTo === user.username ||
      completedRequest.operator === user.fullName ||
      completedRequest.operator === user.username
    if (!canComplete) {
      setFeedbackMessage('Solo el usuario asignado o un administrador puede finalizar este pedido.')
      return
    }

    try {
      await apiFetch(`/api/requests/${id}/complete`, 'PUT')
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : 'No se pudo cerrar la solicitud en la base.')
      return
    }

    setRequests((current) => current.filter((request) => request.id !== id))
    setHistoryRecords((current) => [
      {
        id: `h${Date.now()}`,
        type: 'Pedido',
        title: completedRequest.title,
        description: `Finalizado · ${completedRequest.description}`,
        vehicle: completedRequest.vehicle,
        operator: user.fullName,
        actionBy: user.fullName,
        requestedBy: completedRequest.requestedBy,
        assignedTo: completedRequest.assignedTo,
        createdAt: new Date().toISOString(),
        status: 'Completada',
      },
      ...current,
    ])
    setFeedbackMessage(`Solicitud finalizada: ${completedRequest.title}`)
    if (broadcast) {
      try {
        // @ts-ignore
        broadcast.postMessage({ type: 'notification', message: `Solicitud finalizada: ${completedRequest.title}`, state: { requests } })
      } catch {}
    }
  }

  

  const [detailVehicleId, setDetailVehicleId] = useState<string | null>(null)
  const openVehicleDetail = (vehicleId: string) => setDetailVehicleId(vehicleId)
  const closeVehicleDetail = () => setDetailVehicleId(null)

  const vehicleDetail = detailVehicleId ? vehicles.find((v) => v.id === detailVehicleId) ?? null : null
  const vehicleRequests = vehicleDetail ? requests.filter((r) => r.vehicle && r.vehicle.includes(vehicleDetail.code)) : []

  const handleExportHistory = () => {
    if (historyRecords.length === 0) {
      setFeedbackMessage('No hay historial para exportar.')
      return
    }

    const header = ['Tipo', 'Título', 'Descripción', 'Vehículo', 'Operario', 'Estado', 'Fecha']
    const rows = historyRecords.map((item) => [
      item.type,
      item.title,
      item.description,
      item.vehicle ?? '',
      item.operator ?? '',
      item.status,
      item.createdAt,
    ])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historial-ecotask-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportHistoryJSON = () => {
    if (historyRecords.length === 0) {
      setFeedbackMessage('No hay historial para exportar.')
      return
    }
    const data = { history: historyRecords, archivedVehicles, notifications }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historial-ecotask-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleUpdatePermissions = (targetUserId: string, permissions: string[]) => {
    if (!isAdmin) {
      setFeedbackMessage('Solo un administrador puede cambiar permisos del sistema.')
      return
    }
    const normalized = Array.from(new Set(permissions.map((permission) => permission.trim().toLowerCase()).filter(Boolean)))
    setUsers((current) => {
      const nextUsers = current.map((item) => (item.id === targetUserId ? { ...item, permissions: normalized } : item))
      if (user.id === targetUserId) {
        setUser((currentUser) => ({ ...currentUser, permissions: normalized }))
      }
      if (broadcast) {
        try {
          // @ts-ignore
          broadcast.postMessage({ type: 'state-update', state: { users: nextUsers } })
        } catch {}
      }
      return nextUsers
    })
    setFeedbackMessage(`Permisos actualizados para ${users.find((item) => item.id === targetUserId)?.fullName ?? 'usuario'}.`)
  }

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read && (!n.toUser || n.toUser === user.fullName || n.toUser === user.username)).length,
    [notifications, user.fullName, user.username],
  )

  const notificationsForCurrentUser = useMemo(
    () =>
      notifications.filter((n) => {
        const target = n.toUser ?? 'all'
        return !target || target === 'all' || target === user.fullName || target === user.username
      }),
    [notifications, user.fullName, user.username],
  )

  const markNotificationRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, 'PUT')
    } catch {
      // no-op: UI fallback works even if backend call fails
    }
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllNotificationsRead = async () => {
    for (const n of notifications) {
      if (!n.read) {
        try {
          await apiFetch(`/api/notifications/${n.id}/read`, 'PUT')
        } catch {}
      }
    }
    setNotifications((current) =>
      current.map((n) => {
        const target = n.toUser ?? 'all'
        return !target || target === 'all' || target === user.fullName || target === user.username ? { ...n, read: true } : n
      }),
    )
  }

  const openRequestFromNotification = (requestId: string) => {
    setFocusedRequestId(requestId)
    setSelectedSection('Solicitudes')
    setNotifications((current) => current.map((n) => (n.requestId === requestId ? { ...n, read: true } : n)))
  }

  const visibleHistoryRecords = useMemo(() => {
    const normalizedQuery = historySearch.trim().toLowerCase()
    const fromDate = historyRange.from ? new Date(historyRange.from).getTime() : null
    const toDate = historyRange.to ? new Date(historyRange.to).getTime() : null

    return historyRecords.filter((record) => {
      const matchesQuery =
        !normalizedQuery ||
        `${record.title} ${record.description} ${record.vehicle ?? ''} ${record.operator ?? ''}`.toLowerCase().includes(normalizedQuery)

      const recordTime = new Date(record.createdAt).getTime()
      const matchesFrom = !fromDate || recordTime >= fromDate
      const matchesTo = !toDate || recordTime <= toDate

      return matchesQuery && matchesFrom && matchesTo
    })
  }, [historyRecords, historySearch, historyRange])

  if (!isAuthenticated) {
    return <Login users={users} onLogin={(payload) => {
      setUser(payload.user)
      setUsers((current) => {
        const exists = current.some((item) => item.id === payload.user.id || item.username === payload.user.username)
        return exists ? current.map((item) => (item.id === payload.user.id || item.username === payload.user.username ? payload.user : item)) : [payload.user, ...current]
      })
      setAuthToken(payload.token)
      setIsAuthenticated(true)
      window.localStorage.setItem('ecotask-auth-token', payload.token)
    }} />
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#edf1f2] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar
          open={sidebarOpen}
          selectedSection={selectedSection}
          onSectionChange={(nextSection) => {
            setModalOpen(false)
            setSelectedSection(nextSection)
          }}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onLogout={handleLogout}
          onUploadPhoto={handleProfilePhotoUpload}
        />

        <main className="flex-1 overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex min-h-full max-w-[1600px] flex-col gap-6">
            <TopHeader
              onMenuToggle={() => setSidebarOpen(true)}
              userName={user.fullName}
              userAvatar={user.avatar}
              onNotify={handleNotify}
              onMessages={handleMessages}
              onDashboard={handleDashboardFocus}
              unreadNotifications={unreadNotifications}
            />
            <SectionPanel
              selectedSection={selectedSection}
              userPermissions={userPermissions}
              onAction={handleModuleAction}
            />
            {feedbackMessage ? (
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {feedbackMessage.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            ) : null}
            <ActionModal
              open={modalOpen}
              title={modalConfig.title}
              description={modalConfig.description}
              content={modalConfig.content}
              fields={modalFieldsWithValues}
              onFieldChange={handleFieldChange}
              onSubmit={handleModalSubmit}
              onClose={() => setModalOpen(false)}
              submitLabel={modalConfig.submitLabel}
            />
            {selectedSection === 'Usuarios' ? (
              <AdminPanel user={user} users={users} onUpdatePermissions={handleUpdatePermissions} />
            ) : selectedSection === 'Historial' ? (
              <HistoryPanel
                history={visibleHistoryRecords}
                archivedVehicles={archivedVehicles}
                onExportJSON={exportHistoryJSON}
                searchQuery={historySearch}
                onSearchChange={setHistorySearch}
                dateRange={historyRange}
                onDateRangeChange={setHistoryRange}
              />
            ) : selectedSection === 'Notificaciones' ? (
              <NotificationsPanel notifications={notificationsForCurrentUser} onMarkRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} onOpenRequest={openRequestFromNotification} />
            ) : (
              <>
                <KpiCards metrics={kpiMetricsComputed} />
                <WorkflowTimeline steps={workflowSteps} />
                <SubprocessTracker steps={subprocessSteps} />
                <VehiclesGrid vehicles={vehicles} user={user} onEdit={openEditVehicle} onViewDetail={openVehicleDetail} />
                <VehicleDetailModal open={Boolean(detailVehicleId)} onClose={closeVehicleDetail} vehicle={vehicleDetail} requests={vehicleRequests} />
                <ConfirmModal open={confirmOpen} title="Confirmar finalización" message={pendingFinalization ? `¿Confirmas marcar ${pendingFinalization.code} como Finalizado? Esta acción archivará la unidad.` : '¿Confirmas finalizar?'} onConfirm={performFinalization} onCancel={() => setConfirmOpen(false)} />
                <div className="grid gap-6 xl:grid-cols-2">
                  <TasksPanel tasks={tasks} showAll={showAllTasks} onToggleShowAll={() => setShowAllTasks((current) => !current)} />
                  <RequestsPanel requests={requests} onCompleteRequest={handleCompleteRequest} onExportHistory={handleExportHistory} highlightedRequestId={focusedRequestId} />
                </div>
                <DailyMetricsPanel metrics={dailyMetricsComputed} />
              </>
            )}
          </div>
        </main>
      </div>
      </div>
    </ToastProvider>
  )
}
