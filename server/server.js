const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
require('dotenv').config()
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const { createToken, normalizeUser, verifyToken } = require('./auth')
const { roles, permissionCatalog } = require('./rbac')

const app = express()
const port = Number(process.env.PORT || 3001)
const dbPath = path.join(__dirname, 'db.json')

const defaultSeedUsers = []

const defaultLoginCredentials = Object.fromEntries(defaultSeedUsers.map((user) => [user.username, user.password]))

const emptyUser = {
  id: '',
  username: '',
  password: '',
  fullName: '',
  role: 'Operario',
  category: 'Operario',
  permissions: [],
  avatar: '',
}

const defaultState = {
  isAuthenticated: false,
  user: emptyUser,
  users: [],
  vehicles: [],
  tasks: [],
  requests: [],
  historyRecords: [],
  archivedVehicles: [],
  notifications: [],
  systemSettings: { title: 'EcoTask Autoparts', schedule: '08:00 - 18:00', dailyTarget: '20' },
}

const ensureDb = () => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultState, null, 2))
  }
}

const readDb = () => {
  ensureDb()
  try {
    const raw = fs.readFileSync(dbPath, 'utf8')
    return JSON.parse(raw)
  } catch {
    fs.writeFileSync(dbPath, JSON.stringify(defaultState, null, 2))
    return JSON.parse(JSON.stringify(defaultState))
  }
}

const writeDb = (state) => {
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2))
  return state
}

const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecotask',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

const ensureDefaultUsers = async () => {
  try {
    for (const user of defaultSeedUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10)
      await dbPool.execute(
        `INSERT INTO users (username, email, password_hash, full_name, role, department, active, avatar_url)
         VALUES (?, ?, ?, ?, ?, ?, 1, NULL)
         ON DUPLICATE KEY UPDATE
           email = VALUES(email),
           password_hash = VALUES(password_hash),
           full_name = VALUES(full_name),
           role = VALUES(role),
           department = VALUES(department),
           active = VALUES(active)`,
        [user.username, `${user.username}@internal.local`, passwordHash, user.fullName, user.role, user.department],
      )
    }
  } catch (error) {
    console.warn('Default user sync failed:', error.message)
  }
}

const removeLegacyBootstrapAdmin = async () => {
  try {
    await dbPool.execute(
      'DELETE FROM users WHERE username = ? AND email = ? AND full_name = ? AND role = ?',
      ['admin', 'admin@ecotask.local', 'Administrador', 'admin'],
    )
  } catch (error) {
    console.warn('Legacy admin cleanup skipped:', error.message)
  }
}

const getAdminCount = async () => {
  try {
    const [rows] = await dbPool.query("SELECT COUNT(*) AS total FROM users WHERE LOWER(role) = 'admin'")
    return Number(rows?.[0]?.total || 0)
  } catch {
    const db = readDb()
    return (db.users || []).filter((user) => String(user.role).toLowerCase() === 'admin').length
  }
}

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

const mapDbUser = (row) => ({
  id: String(row.id),
  username: row.username,
  fullName: row.full_name || row.username,
  email: row.email || '',
  role: row.role || 'operator',
  category: row.role === 'admin' ? 'Administrador' : row.role === 'encargado' ? 'Encargado' : row.role === 'supervisor' ? 'Referente' : 'Operario',
  permissions: getRolePermissions(row.role),
  avatar: row.avatar_url || '',
  active: row.active !== 0,
})

const getSystemSettings = async () => {
  try {
    const [rows] = await dbPool.query('SELECT setting_key, setting_value FROM system_settings')
    const settings = {}
    for (const row of rows) settings[row.setting_key] = row.setting_value
    return {
      title: settings.app_title || 'EcoTask Autoparts',
      schedule: settings.schedule || '08:00 - 18:00',
      dailyTarget: settings.daily_target || '20',
    }
  } catch {
    return defaultState.systemSettings
  }
}

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
  res.json({ ok: true, service: 'ecotask-backend', timestamp: new Date().toISOString() })
})

app.get('/api/auth/bootstrap-status', async (_req, res) => {
  const adminCount = await getAdminCount()
  res.json({ canCreateAdmin: adminCount === 0, hasAdmin: adminCount > 0 })
})

app.post('/api/auth/bootstrap-admin', async (req, res) => {
  const { username, fullName, password } = req.body || {}
  if (!username || !fullName || !password) {
    return res.status(400).json({ error: 'Usuario, nombre y contraseña requeridos' })
  }

  const adminCount = await getAdminCount()
  if (adminCount > 0) {
    return res.status(409).json({ error: 'Ya existe un administrador creado' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await dbPool.execute(
      'INSERT INTO users (username, email, password_hash, full_name, role, department, active, avatar_url) VALUES (?, ?, ?, ?, ?, ?, 1, NULL)',
      [username, `${username}@internal.local`, passwordHash, fullName, 'admin', 'General'],
    )
    const [rows] = await dbPool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [result.insertId])
    const safeUser = mapDbUser(rows[0])
    const state = readDb()
    state.users = [safeUser, ...(state.users || []).filter((user) => String(user.id) !== String(safeUser.id))]
    state.user = safeUser
    state.isAuthenticated = true
    writeDb(state)
    const token = createToken({ userId: safeUser.id, role: safeUser.role, permissions: safeUser.permissions })
    return res.status(201).json({ token, user: safeUser, permissions: safeUser.permissions })
  } catch (error) {
    const db = readDb()
    const currentAdmin = (db.users || []).find((user) => String(user.role).toLowerCase() === 'admin')
    if (currentAdmin) {
      return res.status(409).json({ error: 'Ya existe un administrador creado' })
    }

    const nextUser = {
      id: `u${Date.now()}`,
      username,
      email: `${username}@internal.local`,
      password,
      fullName,
      role: 'admin',
      department: 'General',
      category: 'Administrador',
      permissions: ['all'],
      avatar: '',
      active: true,
    }

    db.users = [nextUser, ...(db.users || [])]
    db.isAuthenticated = true
    db.user = nextUser
    writeDb(db)

    const safeUser = normalizeUser(nextUser)
    const token = createToken({ userId: safeUser.id, role: safeUser.role, permissions: safeUser.permissions })
    return res.status(201).json({ token, user: safeUser, permissions: safeUser.permissions })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
  }

  try {
    const [rows] = await dbPool.execute('SELECT * FROM users WHERE username = ? LIMIT 1', [username])
    const foundUser = rows[0]

    if (!foundUser) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const isValid = await bcrypt.compare(password, foundUser.password_hash)
    const isFallbackValid = defaultLoginCredentials[username] === password

    if (!isValid && !isFallbackValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    if (isFallbackValid) {
      const nextHash = await bcrypt.hash(password, 10)
      await dbPool.execute('UPDATE users SET password_hash = ? WHERE username = ?', [nextHash, username])
    }

    const safeUser = mapDbUser(foundUser)
    const token = createToken({ userId: safeUser.id, role: safeUser.role, permissions: safeUser.permissions })

    return res.json({
      token,
      user: safeUser,
      permissions: safeUser.permissions,
    })
  } catch (error) {
    console.error('Login DB error:', error)
    const db = readDb()
    const fallbackUser = (db.users || []).find((user) => user.username === username)
    if (!fallbackUser) return res.status(401).json({ error: 'Credenciales inválidas' })
    const valid = fallbackUser.password === password || fallbackUser.passwordHash === password || defaultLoginCredentials[username] === password
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' })

    const safeUser = normalizeUser(fallbackUser)
    return res.json({ token: createToken(safeUser), user: safeUser, permissions: safeUser.permissions })
  }
})

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await dbPool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.userId])
    const user = rows[0]
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    return res.json(mapDbUser(user))
  } catch (error) {
    const db = readDb()
    const user = (db.users || []).find((item) => String(item.id) === String(req.user.userId)) || db.users[0]
    return res.json(normalizeUser(user))
  }
})

app.get('/api/state', requireAuth, async (req, res) => {
  try {
    const state = readDb()
    const requestedUserId = req.user?.userId ?? null
    const rows = requestedUserId ? (await dbPool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [requestedUserId]))[0] : []
    const currentUser = rows[0] ? mapDbUser(rows[0]) : (state.users || []).find((item) => requestedUserId && String(item.id) === String(requestedUserId)) || state.user || defaultState.user
    const users = Array.isArray(state.users) ? state.users : []
    const nextUsers = currentUser?.id
      ? [currentUser, ...users.filter((item) => String(item.id) !== String(currentUser.id))]
      : users

    res.json({
      ...defaultState,
      ...state,
      isAuthenticated: true,
      user: currentUser,
      users: nextUsers,
      permissions: currentUser.permissions || [],
    })
  } catch (error) {
    console.error('State DB error:', error)
    const fallback = readDb()
    res.json({
      ...fallback,
      isAuthenticated: true,
      user: fallback.user || defaultState.user,
      permissions: (fallback.user && fallback.user.permissions) || defaultState.user.permissions || [],
    })
  }
})

app.get('/api/roles', requireAuth, requirePermission('users.read'), (_req, res) => {
  res.json(Object.values(roles))
})

app.get('/api/permissions', requireAuth, requirePermission('users.read'), (_req, res) => {
  res.json(permissionCatalog)
})

app.get('/api/tasks', requireAuth, requirePermission('tasks.read'), (_req, res) => {
  const db = readDb()
  res.json(db.tasks || [])
})

app.post('/api/tasks', requireAuth, requirePermission('tasks.write'), (req, res) => {
  const db = readDb()
  const task = {
    id: `t${Date.now()}`,
    title: req.body.title,
    priority: req.body.priority || 'Media',
    assignedTo: req.body.assignedTo || req.user.userId,
    dueDate: req.body.dueDate || 'Sin fecha',
    vehicle: req.body.vehicle,
    createdAt: new Date().toISOString(),
  }

  db.tasks = [task, ...(db.tasks || [])]
  writeDb(db)
  res.status(201).json(task)
})

app.get('/api/requests', requireAuth, requirePermission('requests.read'), (_req, res) => {
  const db = readDb()
  res.json(db.requests || [])
})

app.post('/api/requests', requireAuth, requirePermission('requests.write'), (req, res) => {
  const db = readDb()
  const request = {
    id: `r${Date.now()}`,
    title: req.body.title,
    description: req.body.description || '',
    requestType: req.body.requestType || 'General',
    requestedBy: req.body.requestedBy || 'Sistema',
    assignedTo: req.body.assignedTo || 'Sin asignar',
    vehicle: req.body.vehicle,
    createdAt: new Date().toISOString(),
  }

  db.requests = [request, ...(db.requests || [])]
  writeDb(db)
  res.status(201).json(request)
})

app.get('/api/notifications', requireAuth, requirePermission('notifications.read'), (_req, res) => {
  const db = readDb()
  res.json(db.notifications || [])
})

app.post('/api/notifications', requireAuth, requirePermission('notifications.write'), (req, res) => {
  const db = readDb()
  const notification = {
    id: `n${Date.now()}`,
    message: req.body.message || 'Nuevo aviso',
    createdAt: new Date().toISOString(),
    read: false,
    fromUser: req.user.userId,
    toUser: req.body.toUser || 'all',
  }

  db.notifications = [notification, ...(db.notifications || [])]
  writeDb(db)
  res.status(201).json(notification)
})

app.get('/api/audit', requireAuth, requirePermission('audit.read'), (_req, res) => {
  const db = readDb()
  res.json(db.historyRecords || [])
})

app.get('/api/users', requireAuth, requirePermission('users.read'), async (_req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM users ORDER BY id ASC')
    res.json(rows.map(mapDbUser))
  } catch (error) {
    const db = readDb()
    res.json((db.users || []).map((user) => normalizeUser(user)))
  }
})

app.post('/api/users', requireAuth, requirePermission('users.write'), async (req, res) => {
  const { username, fullName, role, category, permissions, password } = req.body || {}
  if (!username || !fullName) {
    return res.status(400).json({ error: 'Usuario y nombre requeridos' })
  }

  try {
    const passwordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('changeme123', 10)
    const [result] = await dbPool.execute(
      'INSERT INTO users (username, email, password_hash, full_name, role, department, active, avatar_url) VALUES (?, ?, ?, ?, ?, ?, 1, NULL)',
      [username, `${username}@internal.local`, passwordHash, fullName, role || 'operator', category || 'General'],
    )

    const userId = result.insertId
    const createdUser = await dbPool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [userId])
    const [row] = createdUser[0]
    const normalizedUser = mapDbUser(row)
    const db = readDb()
    db.users = [normalizedUser, ...(db.users || []).filter((item) => String(item.id) !== String(normalizedUser.id))]
    writeDb(db)
    res.status(201).json(normalizedUser)
  } catch (error) {
    const db = readDb()
    const item = {
      id: `u${Date.now()}`,
      username,
      password: password || 'changeme123',
      fullName,
      role: role || category || 'Operario',
      category: category || 'Operario',
      permissions: Array.isArray(permissions) ? permissions : [],
    }
    db.users = [item, ...(db.users || [])]
    writeDb(db)
    res.status(201).json(normalizeUser(item))
  }
})

app.delete('/api/users/:id', requireAuth, requirePermission('users.write'), async (req, res) => {
  try {
    await dbPool.execute('DELETE FROM users WHERE id = ?', [req.params.id])
  } catch (error) {
    console.warn('User DB delete failed:', error.message)
  }

  const db = readDb()
  const nextUsers = (db.users || []).filter((item) => String(item.id) !== String(req.params.id))
  db.users = nextUsers
  if (db.user && String(db.user.id) === String(req.params.id)) {
    db.user = emptyUser
    db.isAuthenticated = false
  }
  writeDb(db)
  res.json({ ok: true })
})

app.post('/api/vehicles', requireAuth, requirePermission('tasks.write'), async (req, res) => {
  const { code, model, status, mechanic, dominio, motorNumber, chassisNumber, bajaTag, image } = req.body || {}
  if (!code || !dominio) {
    return res.status(400).json({ error: 'Código y dominio requeridos' })
  }

  try {
    const [result] = await dbPool.execute(
      'INSERT INTO vehicles (code, model, status, domain, motor_number, chassis_number, baja_tag, owner_user_id, assigned_mechanic_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [code, model || 'Sin modelo', status || 'Ingresado', dominio, motorNumber || '', chassisNumber || '', bajaTag || '', req.user.userId || 1, req.user.userId || 1, image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'],
    )
    const [rows] = await dbPool.execute('SELECT * FROM vehicles WHERE id = ? LIMIT 1', [result.insertId])
    res.status(201).json(rows[0])
  } catch (error) {
    const db = readDb()
    const item = {
      id: `v${Date.now()}`,
      code,
      model: model || 'Sin modelo',
      status: status || 'Ingresado',
      mechanic: mechanic || 'Sin asignar',
      image: image || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      dominio,
      motorNumber: motorNumber || '',
      chassisNumber: chassisNumber || '',
      bajaTag: bajaTag || '',
      owner: req.user.userId || 'admin',
      photos: [],
    }
    db.vehicles = [item, ...(db.vehicles || [])]
    writeDb(db)
    res.status(201).json(item)
  }
})

app.put('/api/vehicles/:id/status', requireAuth, requirePermission('tasks.write'), async (req, res) => {
  const { status, mechanic, notes } = req.body || {}
  try {
    if (status) {
      await dbPool.execute('UPDATE vehicles SET status = ?, assigned_mechanic_id = ? WHERE id = ?', [status, req.user.userId || 1, req.params.id])
    }
    res.json({ ok: true, status, mechanic, notes })
  } catch (error) {
    const db = readDb()
    db.vehicles = (db.vehicles || []).map((vehicle) => vehicle.id === req.params.id ? { ...vehicle, status: status || vehicle.status, mechanic: mechanic || vehicle.mechanic } : vehicle)
    writeDb(db)
    res.json({ ok: true })
  }
})

app.post('/api/tasks', requireAuth, requirePermission('tasks.write'), async (req, res) => {
  const { title, priority, assignedTo, dueDate, vehicle } = req.body || {}
  if (!title) {
    return res.status(400).json({ error: 'Título requerido' })
  }

  try {
    const [result] = await dbPool.execute(
      'INSERT INTO tasks (title, description, vehicle_id, assigned_to, created_by, status, priority, due_date, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, '', vehicle ? Number(vehicle) || null : null, assignedTo || req.user.userId || 1, req.user.userId || 1, 'pending', priority || 'medium', dueDate || new Date(), 'General'],
    )
    const [rows] = await dbPool.execute('SELECT * FROM tasks WHERE id = ? LIMIT 1', [result.insertId])
    res.status(201).json(rows[0])
  } catch (error) {
    const db = readDb()
    const item = { id: `t${Date.now()}`, title, priority: priority || 'Media', assignedTo: assignedTo || req.user.userId || 'Sin asignar', dueDate: dueDate || 'Próximamente', vehicle }
    db.tasks = [item, ...(db.tasks || [])]
    writeDb(db)
    res.status(201).json(item)
  }
})

app.put('/api/tasks/:id/complete', requireAuth, requirePermission('tasks.complete'), async (req, res) => {
  try {
    await dbPool.execute('UPDATE tasks SET status = ? WHERE id = ?', ['completed', req.params.id])
    res.json({ ok: true })
  } catch (error) {
    const db = readDb()
    db.tasks = (db.tasks || []).filter((task) => task.id !== req.params.id)
    writeDb(db)
    res.json({ ok: true })
  }
})

app.post('/api/requests', requireAuth, requirePermission('requests.write'), async (req, res) => {
  const { title, description, requestType, assignedTo, vehicle } = req.body || {}
  if (!title) {
    return res.status(400).json({ error: 'Título requerido' })
  }

  try {
    const [result] = await dbPool.execute(
      'INSERT INTO requests (type, title, description, vehicle_id, requested_by, assigned_to, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [requestType || 'General', title, description || '', vehicle ? Number(vehicle) || null : null, req.user.userId || 1, assignedTo || req.user.userId || 1, 'open'],
    )
    const [rows] = await dbPool.execute('SELECT * FROM requests WHERE id = ? LIMIT 1', [result.insertId])
    res.status(201).json(rows[0])
  } catch (error) {
    const db = readDb()
    const item = { id: `r${Date.now()}`, title, description: description || '', requestType: requestType || 'General', requestedBy: req.user.userId || 'Sistema', assignedTo: assignedTo || 'Sin asignar', vehicle, createdAt: new Date().toISOString() }
    db.requests = [item, ...(db.requests || [])]
    writeDb(db)
    res.status(201).json(item)
  }
})

app.put('/api/requests/:id/complete', requireAuth, requirePermission('requests.write'), async (req, res) => {
  try {
    await dbPool.execute('UPDATE requests SET status = ? WHERE id = ?', ['closed', req.params.id])
    res.json({ ok: true })
  } catch (error) {
    const db = readDb()
    db.requests = (db.requests || []).filter((request) => request.id !== req.params.id)
    writeDb(db)
    res.json({ ok: true })
  }
})

app.get('/api/notifications', requireAuth, requirePermission('notifications.read'), async (_req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM notifications ORDER BY id DESC')
    res.json(rows)
  } catch (error) {
    const db = readDb()
    res.json(db.notifications || [])
  }
})

app.post('/api/notifications', requireAuth, requirePermission('notifications.write'), async (req, res) => {
  const { message, toUser, requestId } = req.body || {}
  try {
    const [result] = await dbPool.execute(
      'INSERT INTO notifications (user_id, from_user_id, request_id, message, is_read) VALUES (?, ?, ?, ?, 0)',
      [req.user.userId || 1, req.user.userId || 1, requestId || null, message || 'Nuevo aviso'],
    )
    const [rows] = await dbPool.execute('SELECT * FROM notifications WHERE id = ? LIMIT 1', [result.insertId])
    res.status(201).json(rows[0])
  } catch (error) {
    const db = readDb()
    const item = { id: `n${Date.now()}`, message: message || 'Nuevo aviso', createdAt: new Date().toISOString(), read: false, fromUser: req.user.userId || 'Sistema', toUser: toUser || 'all', requestId }
    db.notifications = [item, ...(db.notifications || [])]
    writeDb(db)
    res.status(201).json(item)
  }
})

app.put('/api/notifications/:id/read', requireAuth, requirePermission('notifications.write'), async (req, res) => {
  try {
    await dbPool.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (error) {
    const db = readDb()
    db.notifications = (db.notifications || []).map((notification) => notification.id === req.params.id ? { ...notification, read: true } : notification)
    writeDb(db)
    res.json({ ok: true })
  }
})

app.post('/api/state', requireAuth, (req, res) => {
  const incoming = req.body || {}
  const current = readDb()
  const merged = {
    ...defaultState,
    ...current,
    ...incoming,
    user: incoming.user || current.user || defaultState.user,
    users: Array.isArray(incoming.users) ? incoming.users : current.users || defaultState.users,
    vehicles: Array.isArray(incoming.vehicles) ? incoming.vehicles : current.vehicles || defaultState.vehicles,
    tasks: Array.isArray(incoming.tasks) ? incoming.tasks : current.tasks || defaultState.tasks,
    requests: Array.isArray(incoming.requests) ? incoming.requests : current.requests || defaultState.requests,
    historyRecords: Array.isArray(incoming.historyRecords) ? incoming.historyRecords : current.historyRecords || defaultState.historyRecords,
    archivedVehicles: Array.isArray(incoming.archivedVehicles) ? incoming.archivedVehicles : current.archivedVehicles || defaultState.archivedVehicles,
    notifications: Array.isArray(incoming.notifications) ? incoming.notifications : current.notifications || defaultState.notifications,
    systemSettings: incoming.systemSettings || current.systemSettings || defaultState.systemSettings,
  }

  const stored = writeDb(merged)
  res.status(200).json(stored)
})

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  const indexPath = path.join(distPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath)
  }
  return res.status(404).json({ error: 'Frontend build not found' })
})

app.listen(port, async () => {
  await removeLegacyBootstrapAdmin()
  console.log(`EcoTask backend running on http://localhost:${port}`)
})
