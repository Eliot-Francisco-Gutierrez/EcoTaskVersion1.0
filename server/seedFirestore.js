const fs = require('fs')
const path = require('path')
const { FieldValue } = require('firebase-admin/firestore')
const { db } = require('./firestore')

const sourcePath = path.join(__dirname, 'db.json')
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))

const collections = ['users', 'vehicles', 'tasks', 'requests', 'notifications']

const cleanData = (value) => Object.fromEntries(
  Object.entries(value || {}).filter(([, item]) => item !== undefined),
)

const writeCollection = async (name, records) => {
  if (!Array.isArray(records) || records.length === 0) return 0

  const batch = db.batch()
  let written = 0
  records.forEach((record) => {
    const { id, password, ...data } = cleanData(record)

    // Usuarios importados sin passwordHash no pueden autenticarse de forma segura.
    if (name === 'users' && !data.passwordHash) return

    const ref = id ? db.collection(name).doc(String(id)) : db.collection(name).doc()
    batch.set(ref, { ...data, createdAt: data.createdAt || FieldValue.serverTimestamp() }, { merge: true })
    written += 1
  })

  if (written === 0) return 0
  await batch.commit()
  return written
}

const seed = async () => {
  const counts = {}
  for (const name of collections) {
    counts[name] = await writeCollection(name, source[name])
  }

  if (source.systemSettings) {
    await db.collection('settings').doc('app').set(cleanData(source.systemSettings), { merge: true })
    counts.settings = 1
  }

  console.log(`Firestore seed completado: ${JSON.stringify(counts)}`)
}

seed().catch((error) => {
  console.error('No se pudo poblar Firestore:', error.message)
  process.exitCode = 1
})