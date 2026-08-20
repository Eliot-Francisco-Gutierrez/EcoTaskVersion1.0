const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { roles } = require('./rbac')

const JWT_SECRET = process.env.JWT_SECRET || 'ecotask-internal-secret'

const normalizeUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  department: user.department,
  permissions: user.permissions || roles[user.role]?.permissions || [],
})

const createToken = (user) => jwt.sign({ userId: user.id ?? user.userId ?? null, role: user.role, permissions: user.permissions || [] }, JWT_SECRET, { expiresIn: '8h' })

const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, 10)

const verifyPassword = async (plainPassword, hash) => bcrypt.compare(plainPassword, hash)

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

module.exports = {
  createToken,
  hashPassword,
  verifyPassword,
  normalizeUser,
  verifyToken,
}
