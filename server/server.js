const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
require('dotenv').config()
const bcrypt = require('bcryptjs')
const { createToken, verifyToken } = require('./auth')
const { roles, permissionCatalog } = require('./rbac')
const repo = require('./firestoreRepo')

// Evita que un error de credenciales de Firestore tumbe todo el proceso.
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection (Firestore u otro servicio):', error?.message || error)
})
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception (Firestore u otro servicio):', error?.message || error)
})

const app = express()
const port = Number(process.env.PORT || 3001)

const emptyUser = {
  id: '',
  username: '',
  fullName: '',
  role: 'Operario',
  category: 'Operario',
  permissions: [],
  avatar: '',
}

const defaultSystemSettings = { title: 'EcoTask Autoparts', schedule: '08:00 - 18:00', dailyTarget: '20' }

const normalizeRoleKey = (role = 'operator') => {
  const normalized = String(role || 'operator')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')

  const aliases = {
    administrador: 'admin',
    admin: 'admin',
    supervisor: 'supervisor',
    encargado: 'encargado',
    operario: 'operator',
    operario08: 'operator',
    referente: 'supervisor',
    operator: 'operator',
    teamlead: 'supervisor',
  }

  return aliases[normalized] || normalized
}

const getRolePermissions = (role = 'operator') => {
  const normalizedRole = normalizeRoleKey(role)
  return roles[normalizedRole]?.permissions || roles.operator.permissions || []
}

const toIso = (value) => {
  if (!value) return new Date().toISOString()
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  return value
}

const mapUser = (doc) => ({
  id: doc.id,
  username: doc.username,
  fullName: doc.fullName || doc.username,
  email: doc.email || '',
  role: doc.role || 'operator',
  category: doc.role === 'admin' ? 'Administrador' : doc.role === 'encargado' ? 'Encargado' : doc.role === 'supervisor' ? 'Referente' : 'Operario',
  permissions: getRolePermissions(doc.role),
  avatar: doc.avatarUrl || '',
  active: doc.active !== false,
})

const mapVehicle = (doc) => ({
  id: doc.id,
  code: doc.code,
  model: doc.model,
  status: doc.status,
  mechanic: doc.mechanic || 'Sin asignar',
  image: doc.imageUrl || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  dominio: doc.domain || '',
  motorNumber: doc.motorNumber || '',
  chassisNumber: doc.chassisNumber || '',
  bajaTag: doc.bajaTag || '',
  owner: doc.ownerUserId ? String(doc.ownerUserId) : 'sistema',
  photos: doc.photos || [],
})

const mapTask = (doc) => ({
  id: doc.id,
  title: doc.title,
  priority: doc.priority || 'Media',
  assignedTo: doc.assignedTo || 'Sin asignar',
  dueDate: doc.dueDate || 'Sin fecha',
  vehicle: doc.vehicle,
})

const mapRequest = (doc) => ({
  id: doc.id,
  title: doc.title,
  description: doc.description || '',
  timeAgo: 'Ahora',
  badgeColor: 'bg-cyan-500/10 text-cyan-200',
  requestType: doc.requestType || 'General',
  requestedBy: doc.requestedBy || 'Sistema',
  assignedTo: doc.assignedTo || 'Sin asignar',
  vehicle: doc.vehicle,
  status: doc.status,
  createdAt: toIso(doc.createdAt),
})

const mapNotification = (doc) => ({
  id: doc.id,
  message: doc.message,
  createdAt: toIso(doc.createdAt),
  read: Boolean(doc.isRead),
  fromUser: doc.fromUser || 'Sistema',
  toUser: doc.toUser || 'all',
  requestId: doc.requestId,
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
}

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  req.user = payload
  next()
}

const requirePermission = (permission) => (req, res, next) => {
  const userPermissions = Array.isArray(req.user?.permissions)
    ? req.user.permissions
    : roles[normalizeRoleKey(req.user?.role || 'operator')]?.permissions || []

  const normalizedPermissions = userPermissions.map((item) => String(item).trim().toLowerCase())

  if (normalizedPermissions.includes(permission) || normalizedPermissions.includes('all')) {
    return next()
  }

  return res.status(403).json({ error: `No tenés permiso para ${permission}` })
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ecotask-backend', timestamp: new Date().toISOString(), db: 'firestore' })
})

app.get('/api/auth/bootstrap-status', async (_req, res) => {
  try {
    const adminCount = await repo.countAdmins()
    res.json({ canCreateAdmin: adminCount === 0, hasAdmin: adminCount > 0 })
  } catch (error) {
    console.error('Bootstrap status error:', error)
    res.status(500).json({ error: 'No se pudo consultar Firestore' })
  }
})

app.post('/api/auth/bootstrap-admin', async (req, res) => {
  const { username, fullName, password } = req.body || {}
  if (!username || !fullName || !password) {
    return res.status(400).json({ error: 'Usuario, nombre y contraseña requeridos' })
  }

  try {
    const adminCount = await repo.countAdmins()
    if (adminCount > 0) {
      return res.status(409).json({ error: 'Ya existe un administrador creado' })
    }

    const existing = await repo.findUserByUsername(username)
    if (existing) {
      return res.status(409).json({ error: 'El usuario ya existe' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const created = await repo.createUser({
      username,
      email: `${username}@internal.local`,
      passwordHash,
      fullName,
      role: 'admin',
      department: 'General',
      active: true,
      avatarUrl: null,
    })

    const safeUser = mapUser(created)
    const token = createToken({ userId: safeUser.id, role: safeUser.role, permissions: safeUser.permissions })
    return res.status(201).json({ token, user: safeUser, permissions: safeUser.permissions })
  } catch (error) {
    console.error('Bootstrap admin error:', error)
    return res.status(500).json({ error: 'No se pudo crear el administrador' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
  }

  try {
    const foundUser = await repo.findUserByUsername(username)
    if (!foundUser) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const isValid = await bcrypt.compare(password, foundUser.passwordHash || '')
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const safeUser = mapUser(foundUser)
    const token = createToken({ userId: safeUser.id, role: safeUser.role, permissions: safeUser.permissions })

    return res.json({ token, user: safeUser, permissions: safeUser.permissions })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Error de autenticación' })
  }
})

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const foundUser = await repo.getUserById(req.user.userId)
    if (!foundUser) return res.status(404).json({ error: 'Usuario no encontrado' })
    return res.json(mapUser(foundUser))
  } catch (error) {
    console.error('Me error:', error)
    return res.status(500).json({ error: 'No se pudo obtener el usuario' })
  }
})

app.get('/api/state', requireAuth, async (req, res) => {
  try {
    const [usersDocs, vehiclesDocs, tasksDocs, requestsDocs, notificationsDocs, settings] = await Promise.all([
      repo.listUsers(),
      repo.listVehicles(),
      repo.listTasks(),
      repo.listRequests(),
      repo.listNotifications(),
      repo.getSystemSettings(),
    ])

    const users = usersDocs.map(mapUser)
    const currentUser = users.find((item) => String(item.id) === String(req.user.userId)) || users[0] || emptyUser

    res.json({
      isAuthenticated: true,
      user: currentUser,
      users,
      vehicles: vehiclesDocs.map(mapVehicle),
      tasks: tasksDocs.map(mapTask),
      requests: requestsDocs.map(mapRequest),
      historyRecords: [],
      archivedVehicles: [],
      notifications: notificationsDocs.map(mapNotification),
      systemSettings: settings || defaultSystemSettings,
      permissions: currentUser.permissions || [],
    })
  } catch (error) {
    console.error('State error:', error)
    res.status(500).json({ error: 'No se pudo leer el estado desde Firestore' })
  }
})

app.post('/api/state', requireAuth, requirePermission('settings.write'), async (req, res) => {
  const incoming = req.body || {}
  try {
    if (incoming.systemSettings) {
      await repo.setSystemSettings(incoming.systemSettings)
    }
    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('State sync error:', error)
    res.status(500).json({ error: 'No se pudo sincronizar la configuración' })
  }
})

app.get('/api/roles', requireAuth, requirePermission('users.read'), (_req, res) => {
  res.json(Object.values(roles))
})

app.get('/api/permissions', requireAuth, requirePermission('users.read'), (_req, res) => {
  res.json(permissionCatalog)
})

app.get('/api/tasks', requireAuth, requirePermission('tasks.read'), async (_req, res) => {
  try {
    const tasks = await repo.listTasks()
    res.json(tasks.map(mapTask))
  } catch (error) {
    console.error('List tasks error:', error)
    res.status(500).json({ error: 'No se pudieron leer las tareas' })
  }
})

app.post('/api/tasks', requireAuth, requirePermission('tasks.write'), async (req, res) => {
  const { title, priority, assignedTo, dueDate, vehicle } = req.body || {}
  if (!title) {
    return res.status(400).json({ error: 'Título requerido' })
  }
  try {
    const created = await repo.createTask({
      title,
      priority: priority || 'Media',
      assignedTo: assignedTo || req.user.userId,
      dueDate: dueDate || 'Sin fecha',
      vehicle,
      status: 'pending',
    })
    res.status(201).json(mapTask(created))
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({ error: 'No se pudo crear la tarea' })
  }
})

app.put('/api/tasks/:id/complete', requireAuth, requirePermission('tasks.complete'), async (req, res) => {
  try {
    await repo.updateTask(req.params.id, { status: 'completed' })
    res.json({ ok: true })
  } catch (error) {
    console.error('Complete task error:', error)
    res.status(500).json({ error: 'No se pudo completar la tarea' })
  }
})

app.get('/api/requests', requireAuth, requirePermission('requests.read'), async (_req, res) => {
  try {
    const requests = await repo.listRequests()
    res.json(requests.map(mapRequest))
  } catch (error) {
    console.error('List requests error:', error)
    res.status(500).json({ error: 'No se pudieron leer las solicitudes' })
  }
})

app.post('/api/requests', requireAuth, requirePermission('requests.write'), async (req, res) => {
  const { title, description, requestType, assignedTo, vehicle } = req.body || {}
  if (!title) {
    return res.status(400).json({ error: 'Título requerido' })
  }
  try {
    const created = await repo.createRequest({
      title,
      description: description || '',
      requestType: requestType || 'General',
      requestedBy: req.user.userId,
      assignedTo: assignedTo || 'Sin asignar',
      vehicle,
      status: 'open',
    })
    res.status(201).json(mapRequest(created))
  } catch (error) {
    console.error('Create request error:', error)
    res.status(500).json({ error: 'No se pudo crear la solicitud' })
  }
})

app.put('/api/requests/:id/complete', requireAuth, requirePermission('requests.write'), async (req, res) => {
  try {
    await repo.updateRequest(req.params.id, { status: 'closed' })
    res.json({ ok: true })
  } catch (error) {
    console.error('Complete request error:', error)
    res.status(500).json({ error: 'No se pudo completar la solicitud' })
  }
})

app.get('/api/notifications', requireAuth, requirePermission('notifications.read'), async (_req, res) => {
  try {
    const notifications = await repo.listNotifications()
    res.json(notifications.map(mapNotification))
  } catch (error) {
    console.error('List notifications error:', error)
    res.status(500).json({ error: 'No se pudieron leer las notificaciones' })
  }
})

app.post('/api/notifications', requireAuth, requirePermission('notifications.write'), async (req, res) => {
  const { message, toUser, requestId } = req.body || {}
  try {
    const created = await repo.createNotification({
      message: message || 'Nuevo aviso',
      fromUser: req.user.userId,
      toUser: toUser || 'all',
      requestId: requestId || null,
      isRead: false,
    })
    res.status(201).json(mapNotification(created))
  } catch (error) {
    console.error('Create notification error:', error)
    res.status(500).json({ error: 'No se pudo crear la notificación' })
  }
})

app.put('/api/notifications/:id/read', requireAuth, requirePermission('notifications.write'), async (req, res) => {
  try {
    await repo.markNotificationRead(req.params.id)
    res.json({ ok: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ error: 'No se pudo actualizar la notificación' })
  }
})

app.get('/api/audit', requireAuth, requirePermission('audit.read'), (_req, res) => {
  res.json([])
})

app.get('/api/users', requireAuth, requirePermission('users.read'), async (_req, res) => {
  try {
    const users = await repo.listUsers()
    res.json(users.map(mapUser))
  } catch (error) {
    console.error('List users error:', error)
    res.status(500).json({ error: 'No se pudieron leer los usuarios' })
  }
})

app.post('/api/users', requireAuth, requirePermission('users.write'), async (req, res) => {
  const { username, fullName, role, password } = req.body || {}
  if (!username || !fullName) {
    return res.status(400).json({ error: 'Usuario y nombre requeridos' })
  }

  try {
    const existing = await repo.findUserByUsername(username)
    if (existing) {
      return res.status(409).json({ error: 'El usuario ya existe' })
    }

    const passwordHash = await bcrypt.hash(password || 'changeme123', 10)
    const created = await repo.createUser({
      username,
      email: `${username}@internal.local`,
      passwordHash,
      fullName,
      role: role || 'operator',
      department: 'General',
      active: true,
      avatarUrl: null,
    })

    res.status(201).json(mapUser(created))
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'No se pudo crear el usuario' })
  }
})

app.delete('/api/users/:id', requireAuth, requirePermission('users.write'), async (req, res) => {
  try {
    await repo.deleteUser(req.params.id)
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'No se pudo eliminar el usuario' })
  }
})

app.post('/api/vehicles', requireAuth, requirePermission('tasks.write'), async (req, res) => {
  const { code, model, status, mechanic, dominio, motorNumber, chassisNumber, bajaTag, image } = req.body || {}
  if (!code || !dominio) {
    return res.status(400).json({ error: 'Código y dominio requeridos' })
  }

  try {
    const created = await repo.createVehicle({
      code,
      model: model || 'Sin modelo',
      status: status || 'Ingresado',
      mechanic: mechanic || 'Sin asignar',
      domain: dominio,
      motorNumber: motorNumber || '',
      chassisNumber: chassisNumber || '',
      bajaTag: bajaTag || '',
      ownerUserId: req.user.userId,
      assignedMechanicId: req.user.userId,
      imageUrl: image || null,
      photos: [],
    })
    res.status(201).json(mapVehicle(created))
  } catch (error) {
    console.error('Create vehicle error:', error)
    res.status(500).json({ error: 'No se pudo crear el vehículo' })
  }
})

app.put('/api/vehicles/:id/status', requireAuth, requirePermission('tasks.write'), async (req, res) => {
  const { status, mechanic } = req.body || {}
  try {
    const patch = {}
    if (status) patch.status = status
    if (mechanic) patch.mechanic = mechanic
    await repo.updateVehicle(req.params.id, patch)
    res.json({ ok: true, status, mechanic })
  } catch (error) {
    console.error('Update vehicle error:', error)
    res.status(500).json({ error: 'No se pudo actualizar el vehículo' })
  }
})

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  const indexPath = path.join(distPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath)
  }
  return res.status(404).json({ error: 'Frontend build not found' })
})

if (require.main === module) {
  app.listen(port, () => {
    console.log(`EcoTask backend running on http://localhost:${port} (Firestore)`)
  })
}

module.exports = app
