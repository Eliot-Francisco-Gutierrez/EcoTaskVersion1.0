import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { deleteApp, initializeApp } from 'firebase/app'
import { auth, db, firebaseConfig, getUsernameEmail } from './firebaseClient'
import { User } from '../data/mockData'

const collectionNames = ['users', 'vehicles', 'tasks', 'requests', 'notifications'] as const

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

const userFromDoc = (id: string, data: Record<string, any>): User => ({
  id,
  username: data.username || data.email?.split('@')[0] || id,
  password: '',
  fullName: data.fullName || data.username || 'Usuario',
  role: data.role || 'operator',
  category: data.category || (data.role === 'admin' ? 'Administrador' : 'Operario'),
  permissions: Array.isArray(data.permissions) ? data.permissions : [],
  avatar: data.avatarUrl || data.avatar || '',
})

const mapDoc = (id: string, data: Record<string, any>) => ({
  id,
  ...data,
  image: data.image || data.imageUrl || '',
  dominio: data.dominio || data.domain || '',
  owner: data.owner || data.ownerUserId || '',
  assignedTo: data.assignedTo || '',
  requestedBy: data.requestedBy || '',
  timeAgo: data.timeAgo || 'Ahora',
  badgeColor: data.badgeColor || 'bg-cyan-500/10 text-cyan-200',
  read: Boolean(data.read ?? !data.isRead),
})

const readCollection = async (name: (typeof collectionNames)[number]) => {
  const ref = collection(db, name)
  try {
    const snapshot = await getDocs(query(ref, orderBy('createdAt', 'desc')))
    return snapshot.docs.map((item) => mapDoc(item.id, item.data()))
  } catch {
    const snapshot = await getDocs(ref)
    return snapshot.docs.map((item) => mapDoc(item.id, item.data()))
  }
}

export const getCurrentProfile = async (): Promise<User> => {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('Sesión no iniciada')
  const profile = await getDoc(doc(db, 'users', currentUser.uid))
  if (!profile.exists()) throw new Error('Perfil de usuario no encontrado')
  return userFromDoc(profile.id, profile.data())
}

export const loginWithUsername = async (username: string, password: string) => {
  const credentials = await signInWithEmailAndPassword(auth, getUsernameEmail(username), password)
  const profile = await getCurrentProfile()
  return { user: profile, token: await credentials.user.getIdToken() }
}

export const bootstrapAdmin = async (username: string, fullName: string, password: string) => {
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')
  const credentials = await createUserWithEmailAndPassword(auth, getUsernameEmail(username), password)
  const profile = {
    username: username.trim(),
    fullName: fullName.trim(),
    email: credentials.user.email,
    role: 'admin',
    category: 'Administrador',
    permissions: ['all'],
    active: true,
    createdAt: new Date().toISOString(),
  }
  await setDoc(doc(db, 'users', credentials.user.uid), profile)
  await setDoc(doc(db, 'settings', 'bootstrap'), { adminCreated: true }, { merge: true })
  return { user: userFromDoc(credentials.user.uid, profile), token: await credentials.user.getIdToken() }
}

export const getBootstrapStatus = async () => {
  const bootstrap = await getDoc(doc(db, 'settings', 'bootstrap'))
  const hasAdmin = bootstrap.data()?.adminCreated === true
  return { canCreateAdmin: !hasAdmin, hasAdmin }
}

const writeDocument = async (name: string, body: Record<string, any>) => {
  const created = await addDoc(collection(db, name), { ...body, createdAt: new Date().toISOString() })
  return { id: created.id, ...body }
}

export const firestoreApiFetch = async (path: string, method: ApiMethod = 'GET', body?: Record<string, any>): Promise<any> => {
  if (!auth.currentUser) return null

  if (path === '/api/state' && method === 'GET') {
    const [users, vehicles, tasks, requests, notifications, settings] = await Promise.all([
      readCollection('users'),
      readCollection('vehicles'),
      readCollection('tasks'),
      readCollection('requests'),
      readCollection('notifications'),
      getDoc(doc(db, 'settings', 'app')),
    ])
    const user = await getCurrentProfile()
    return {
      isAuthenticated: true,
      user,
      users,
      vehicles,
      tasks,
      requests,
      historyRecords: [],
      archivedVehicles: [],
      notifications,
      systemSettings: settings.exists() ? settings.data() : undefined,
      permissions: user.permissions,
    }
  }

  if (path === '/api/state' && method === 'POST') {
    if (body?.systemSettings) await setDoc(doc(db, 'settings', 'app'), body.systemSettings, { merge: true })
    return { ok: true }
  }

  const userDelete = path.match(/^\/api\/users\/([^/]+)$/)
  if (userDelete && method === 'PUT' && body) {
    await updateDoc(doc(db, 'users', userDelete[1]), {
      permissions: Array.isArray(body.permissions) ? body.permissions : [],
    })
    return { ok: true }
  }

  if (userDelete && method === 'DELETE') {
    await deleteDoc(doc(db, 'users', userDelete[1]))
    return { ok: true }
  }

  const requestComplete = path.match(/^\/api\/requests\/([^/]+)\/complete$/)
  if (requestComplete && method === 'PUT') {
    await updateDoc(doc(db, 'requests', requestComplete[1]), { status: 'closed' })
    return { ok: true }
  }

  const notificationRead = path.match(/^\/api\/notifications\/([^/]+)\/read$/)
  if (notificationRead && method === 'PUT') {
    await updateDoc(doc(db, 'notifications', notificationRead[1]), { isRead: true, read: true })
    return { ok: true }
  }

  if (method === 'POST' && body) {
    if (path === '/api/users') {
      const email = getUsernameEmail(String(body.username))
      const secondaryAppName = `user-${Date.now()}`
      const secondary = initializeApp(firebaseConfig, secondaryAppName)
      const secondaryAuth = getAuth(secondary)
      try {
        const credentials = await createUserWithEmailAndPassword(secondaryAuth, email, String(body.password || ''))
        const profile = { ...body, email, password: undefined, createdAt: new Date().toISOString() }
        delete profile.password
        await setDoc(doc(db, 'users', credentials.user.uid), profile)
        await signOut(secondaryAuth)
        await deleteApp(secondary)
        return userFromDoc(credentials.user.uid, profile)
      } finally {
        await deleteApp(secondary).catch(() => undefined)
      }
    }
    if (path === '/api/requests') return writeDocument('requests', body)
    if (path === '/api/tasks') return writeDocument('tasks', body)
    if (path === '/api/vehicles') return writeDocument('vehicles', { ...body, imageUrl: body.image })
    if (path === '/api/notifications') return writeDocument('notifications', body)
  }

  return null
}

export const logout = () => signOut(auth)
