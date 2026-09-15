require('dotenv').config()
const { initializeApp, getApps, cert, applicationDefault } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

let app
if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson)
    app = initializeApp({ credential: cert(credentials) })
  } else if (serviceAccountPath) {
    // applicationDefault() reads GOOGLE_APPLICATION_CREDENTIALS itself
    app = initializeApp({ credential: applicationDefault() })
  } else {
    app = initializeApp()
  }
} else {
  app = getApps()[0]
}

const db = getFirestore(app)

module.exports = { db }
