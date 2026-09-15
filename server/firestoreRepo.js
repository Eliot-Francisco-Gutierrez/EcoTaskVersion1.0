const { FieldValue } = require('firebase-admin/firestore')
const { db } = require('./firestore')

const usersCol = db.collection('users')
const vehiclesCol = db.collection('vehicles')
const tasksCol = db.collection('tasks')
const requestsCol = db.collection('requests')
const notificationsCol = db.collection('notifications')
const settingsDoc = db.collection('settings').doc('app')

const docToUser = (doc) => ({ id: doc.id, ...doc.data() })

const findUserByUsername = async (username) => {
  const snap = await usersCol.where('username', '==', username).limit(1).get()
  if (snap.empty) return null
  return docToUser(snap.docs[0])
}

const getUserById = async (id) => {
  if (!id) return null
  const doc = await usersCol.doc(String(id)).get()
  if (!doc.exists) return null
  return docToUser(doc)
}

const listUsers = async () => {
  const snap = await usersCol.orderBy('createdAt', 'asc').get()
  return snap.docs.map(docToUser)
}

const createUser = async (data) => {
  const ref = await usersCol.add({ ...data, createdAt: FieldValue.serverTimestamp() })
  const doc = await ref.get()
  return docToUser(doc)
}

const updateUser = async (id, patch) => {
  await usersCol.doc(String(id)).set(patch, { merge: true })
  return getUserById(id)
}

const deleteUser = async (id) => {
  await usersCol.doc(String(id)).delete()
}

const countAdmins = async () => {
  const snap = await usersCol.where('role', '==', 'admin').get()
  return snap.size
}

const listVehicles = async () => {
  const snap = await vehiclesCol.orderBy('createdAt', 'desc').get()
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

const createVehicle = async (data) => {
  const ref = await vehiclesCol.add({ ...data, createdAt: FieldValue.serverTimestamp() })
  const doc = await ref.get()
  return { id: doc.id, ...doc.data() }
}

const updateVehicle = async (id, patch) => {
  await vehiclesCol.doc(String(id)).set(patch, { merge: true })
  const doc = await vehiclesCol.doc(String(id)).get()
  return { id: doc.id, ...doc.data() }
}

const listTasks = async () => {
  const snap = await tasksCol.orderBy('createdAt', 'desc').get()
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

const createTask = async (data) => {
  const ref = await tasksCol.add({ ...data, createdAt: FieldValue.serverTimestamp() })
  const doc = await ref.get()
  return { id: doc.id, ...doc.data() }
}

const updateTask = async (id, patch) => {
  await tasksCol.doc(String(id)).set(patch, { merge: true })
}

const deleteTask = async (id) => {
  await tasksCol.doc(String(id)).delete()
}

const listRequests = async () => {
  const snap = await requestsCol.orderBy('createdAt', 'desc').get()
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

const createRequest = async (data) => {
  const ref = await requestsCol.add({ ...data, createdAt: FieldValue.serverTimestamp() })
  const doc = await ref.get()
  return { id: doc.id, ...doc.data() }
}

const updateRequest = async (id, patch) => {
  await requestsCol.doc(String(id)).set(patch, { merge: true })
}

const deleteRequest = async (id) => {
  await requestsCol.doc(String(id)).delete()
}

const listNotifications = async () => {
  const snap = await notificationsCol.orderBy('createdAt', 'desc').get()
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

const createNotification = async (data) => {
  const ref = await notificationsCol.add({ ...data, createdAt: FieldValue.serverTimestamp() })
  const doc = await ref.get()
  return { id: doc.id, ...doc.data() }
}

const markNotificationRead = async (id) => {
  await notificationsCol.doc(String(id)).set({ isRead: true }, { merge: true })
}

const getSystemSettings = async () => {
  const doc = await settingsDoc.get()
  if (!doc.exists) return null
  return doc.data()
}

const setSystemSettings = async (patch) => {
  await settingsDoc.set(patch, { merge: true })
}

module.exports = {
  findUserByUsername,
  getUserById,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  countAdmins,
  listVehicles,
  createVehicle,
  updateVehicle,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  listRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  listNotifications,
  createNotification,
  markNotificationRead,
  getSystemSettings,
  setSystemSettings,
}
