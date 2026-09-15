export type VehicleStatus =
  | 'Ingresado'
  | 'En inspeccion'
  | 'Pedido repuestos'
  | 'En reparacion'
  | 'Preparacion'
  | 'Control calidad'
  | 'Finalizado'
  | 'Pedido 08'
  | 'Lavado'
  | 'Fotografia'

export type SubprocessStatus = 'pedido_08' | 'lavado' | 'fotografia'

export type TaskPriority = 'Alta' | 'Media' | 'Baja'

export interface Vehicle {
  id: string
  code: string
  model: string
  status: VehicleStatus
  mechanic: string
  image: string
  dominio: string
  motorNumber: string
  chassisNumber: string
  bajaTag: string
  owner?: string
  photos?: string[]
}

export interface Task {
  id: string
  title: string
  priority: TaskPriority
  assignedTo: string
  dueDate: string
  vehicle?: string
}

export interface RequestItem {
  id: string
  title: string
  description: string
  timeAgo: string
  badgeColor: string
  requestType?: string
  requestedBy?: string
  assignedTo?: string
  vehicle?: string
  operator?: string
}

export interface RecordItem {
  id: string
  type: 'Solicitud' | 'Pedido' | 'Tarea'
  title: string
  description: string
  actionBy?: string
  assignedTo?: string
  requestedBy?: string
  vehicle?: string
  operator?: string
  createdAt: string
  status: 'Activo' | 'Completada'
}

export interface NotificationItem {
  id: string
  message: string
  createdAt: string
  read: boolean
  fromUser?: string
  toUser?: string
  requestId?: string
}

export interface DailyMetric {
  label: string
  value: number
  icon: string
}

export const kpiMetrics: Array<{ id: string; label: string; value: number | null; accent: string; icon: string }> = []
export const workflowSteps: Array<{ id: string; label: string; count: number }> = []
export const subprocessSteps: Array<{ id: string; label: string; count: number }> = []

export interface User {
  id: string
  username: string
  password: string
  fullName: string
  role: string
  category: 'Operario' | 'Encargado' | 'Referente' | 'Administrador'
  permissions: string[]
  avatar?: string
}

export const users: User[] = [
]

export const sidebarItems = [
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

