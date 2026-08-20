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

export const kpiMetrics = [
  { id: 'pending', label: 'Vehículos pendientes', value: 24, accent: 'bg-amber-500/20 text-amber-300', icon: 'Car' },
  { id: 'preparation', label: 'En preparación', value: 8, accent: 'bg-sky-500/20 text-sky-300', icon: 'Wrench' },
  { id: 'waiting', label: 'Esperando repuestos', value: 3, accent: 'bg-violet-500/20 text-violet-300', icon: 'Package' },
  { id: 'pending08', label: 'Pendientes de 08', value: 4, accent: 'bg-emerald-500/20 text-emerald-300', icon: 'ClipboardList' },
  { id: 'washReady', label: 'Listos para lavado', value: 5, accent: 'bg-cyan-500/20 text-cyan-300', icon: 'Droplet' },
  { id: 'photoReady', label: 'Fotografía / Listos para venta', value: 4, accent: 'bg-fuchsia-500/20 text-fuchsia-300', icon: 'Camera' },
]

export const workflowSteps = [
  { id: 'ingresado', label: 'Ingresado', count: 5 },
  { id: 'En inspeccion', label: 'En inspección', count: 3 },
  { id: 'Pedido repuestos', label: 'Pedido de Repuestos', count: 2 },
  { id: 'En reparacion', label: 'En reparación', count: 8 },
  { id: 'Preparacion', label: 'Preparación', count: 4 },
  { id: 'Control calidad', label: 'Control de calidad', count: 2 },
  { id: 'Finalizado', label: 'Finalizado', count: 4 },
]

export const subprocessSteps = [
  { id: 'pedido_08', label: 'Pedido de 08', count: 3 },
  { id: 'lavado', label: 'Lavado', count: 3 },
  { id: 'fotografia', label: 'Fotografía', count: 4 },
]

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
  { id: 'encargadoGeneral08', username: 'encargadoGeneral08', password: 'encargado08', fullName: 'Encargado Planta', role: 'Encargado', category: 'Encargado', permissions: ['all'] },
  { id: 'poloni', username: 'poloni', password: 'poloni123', fullName: 'Poloni Diego Sebastian', role: 'Operario 08', category: 'Operario', permissions: ['ingresar', 'editar', 'ver', 'pedido', 'completar'] },
  { id: 'gutierrez', username: 'gutierrez', password: 'gutierrez123', fullName: 'Gutierrez Eliot Francisco', role: 'Operario 08', category: 'Operario', permissions: ['ingresar', 'ver', 'pedido'] },
  { id: 'krenz', username: 'krenz', password: 'krenz123', fullName: 'Krenz Jose Luis', role: 'Referente', category: 'Referente', permissions: ['ver', 'editar', 'pedido'] },
  { id: 'giordano', username: 'giordano', password: 'giordano123', fullName: 'Giordano Nahir', role: 'Operario Lavado', category: 'Operario', permissions: ['ver', 'completar', 'pedido'] },
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

export const vehicles: Vehicle[] = [
  {
    id: 'v1',
    code: 'V.15203',
    model: 'VW Gol Trend',
    status: 'En inspeccion',
    mechanic: 'Poloni Diego Sebastian',
    image: 'https://images.unsplash.com/photo-1511919884226-4f0f2c5d0645?auto=format&fit=crop&w=800&q=80',
    dominio: 'ABC123',
    motorNumber: '9BWZZZ377VT004251',
    chassisNumber: '1HGCM82633A004352',
    bajaTag: 'V.14322',
    owner: 'admin',
    photos: [
      'https://images.unsplash.com/photo-1511919884226-4f0f2c5d0645?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    id: 'v2',
    code: 'V.15218',
    model: 'Ford Ranger',
    status: 'Preparacion',
    mechanic: 'Gutierrez Eliot Francisco',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    dominio: 'DEF456',
    motorNumber: '1FTFW1EF2EKE12345',
    chassisNumber: '2FTRX18L1XCA12345',
    bajaTag: 'V.15218',
    owner: 'admin',
  },
  {
    id: 'v3',
    code: 'V.15221',
    model: 'Peugeot 208',
    status: 'Control calidad',
    mechanic: 'Krenz Jose Luis',
    image: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=800&q=80',
    dominio: 'GHI789',
    motorNumber: 'VF3HBHMR3GW123456',
    chassisNumber: 'VF3HBHMR7GW654321',
    bajaTag: 'V.15221',
    owner: 'admin',
  },
  {
    id: 'v4',
    code: 'V.15212',
    model: 'Renault Duster',
    status: 'En reparacion',
    mechanic: 'Giordano Nahir',
    image: 'https://images.unsplash.com/photo-1542367597-2b4669e8df86?auto=format&fit=crop&w=800&q=80',
    dominio: 'JKL012',
    motorNumber: '9B1KK41R34A123456',
    chassisNumber: '9B1KK41R94A654321',
    bajaTag: 'V.15212',
    owner: 'admin',
  },
  {
    id: 'v5',
    code: 'V.15245',
    model: 'Toyota Corolla',
    status: 'Pedido 08',
    mechanic: 'Encargado Planta',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    dominio: 'MNO345',
    motorNumber: '7A1C1234567890123',
    chassisNumber: '1N4AZ1CPXAC123456',
    bajaTag: 'V.15245',
    owner: 'admin',
  },
]

export const tasks: Task[] = [
  {
    id: 't1',
    title: 'Revisión de frenos traseros',
    priority: 'Alta',
    assignedTo: 'Poloni Diego Sebastian',
    dueDate: 'Hoy 16:00',
    vehicle: 'V.15203',
  },
  {
    id: 't2',
    title: 'Repuesto solicitado - amortiguadores',
    priority: 'Media',
    assignedTo: 'Gutierrez Eliot Francisco',
    dueDate: 'Mañana 09:00',
    vehicle: 'V.15218',
  },
  {
    id: 't3',
    title: 'Prelavado y secado',
    priority: 'Media',
    assignedTo: 'Giordano Nahir',
    dueDate: 'Hoy 18:00',
    vehicle: 'V.15221',
  },
  {
    id: 't4',
    title: 'Control de calidad final',
    priority: 'Alta',
    assignedTo: 'Krenz Jose Luis',
    dueDate: 'Hoy 20:00',
    vehicle: 'V.15221',
  },
]

export const requests: RequestItem[] = [
  {
    id: 'r1',
    title: 'Lavado solicitado',
    description: 'V.15221 · Peugeot 208',
    timeAgo: 'Hace 1 hora',
    badgeColor: 'bg-cyan-500/10 text-cyan-200',
    requestType: 'Lavar vehículo',
    requestedBy: 'Administrador',
    assignedTo: 'Operario Lavado',
    vehicle: 'V.15221',
  },
  {
    id: 'r2',
    title: 'Repuesto solicitado',
    description: 'Optica delantera derecha · V.15218',
    timeAgo: 'Hace 3 horas',
    badgeColor: 'bg-amber-500/10 text-amber-200',
    requestType: 'Solicitar pieza a encargado',
    requestedBy: 'Administrador',
    assignedTo: 'Encargado de Repuestos',
    vehicle: 'V.15218',
  },
  {
    id: 'r3',
    title: 'Armado solicitado',
    description: 'Motor completo · V.15203',
    timeAgo: 'Hace 5 horas',
    badgeColor: 'bg-emerald-500/10 text-emerald-200',
    requestType: 'Reparar vehículo',
    requestedBy: 'Administrador',
    assignedTo: 'Mecánico General',
    vehicle: 'V.15203',
  },
  {
    id: 'r4',
    title: 'Pedido de fotos',
    description: 'V.15245 · Toyota Corolla',
    timeAgo: 'Hace 10 minutos',
    badgeColor: 'bg-fuchsia-500/10 text-fuchsia-200',
    requestType: 'Fotografía de vehículo',
    requestedBy: 'Encargado Planta',
    assignedTo: 'Encargado general 08',
    vehicle: 'V.15245',
  },
]

export const historyRecords: RecordItem[] = [
  {
    id: 'h1',
    type: 'Pedido',
    title: 'Vehículo ingresado V.15203',
    description: 'VW Gol Trend · ABC123',
    vehicle: 'V.15203',
    operator: 'Administrador',
    createdAt: '2026-08-05T09:30:00.000Z',
    status: 'Activo',
  },
  {
    id: 'h2',
    type: 'Pedido',
    title: 'Pedido de repuesto V.15218',
    description: 'Optica delantera derecha aprobada',
    vehicle: 'V.15218',
    operator: 'Encargado Planta',
    createdAt: '2026-08-05T11:00:00.000Z',
    status: 'Completada',
  },
  {
    id: 'h3',
    type: 'Tarea',
    title: 'Control de calidad V.15221',
    description: 'Se completó revisión final',
    vehicle: 'V.15221',
    operator: 'Krenz Jose Luis',
    createdAt: '2026-08-05T15:15:00.000Z',
    status: 'Completada',
  },
  {
    id: 'h4',
    type: 'Solicitud',
    title: 'Lavado solicitado',
    description: 'Se programó lavado para la unidad',
    vehicle: 'V.15221',
    operator: 'Administrador',
    assignedTo: 'Operario Lavado',
    createdAt: '2026-08-05T16:40:00.000Z',
    status: 'Activo',
  },
]

export const notifications: NotificationItem[] = [
  {
    id: 'n1',
    message: 'Se requiere revisión final para V.15221.',
    createdAt: '2026-08-05T17:15:00.000Z',
    read: false,
    fromUser: 'Sistema',
    toUser: 'admin',
  },
  {
    id: 'n2',
    message: 'Nuevo pedido de repuestos para V.15218.',
    createdAt: '2026-08-05T16:00:00.000Z',
    read: true,
    fromUser: 'Encargado Planta',
    toUser: 'admin',
    requestId: 'r2',
  },
  {
    id: 'n3',
    message: 'Lavado confirmado para V.15221.',
    createdAt: '2026-08-05T18:05:00.000Z',
    read: false,
    fromUser: 'Operario Lavado',
    toUser: 'admin',
    requestId: 'r1',
  },
]

export const archivedVehicles: (Vehicle & { archivedAt?: string })[] = []

export const dailyMetrics = [
  { label: 'Vehículos descargados', value: 17, icon: 'Truck' },
  { label: 'Vehículos lavados', value: 6, icon: 'Droplet' },
  { label: 'Autopartes realizadas', value: 13, icon: 'Cog' },
  { label: 'Tareas finalizadas', value: 8, icon: 'CheckCircle' },
]
