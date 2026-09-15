const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { roles } = require('./rbac')

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET es obligatorio para autenticar usuarios')
  }
  return process.env.JWT_SECRET
}

const normalizeUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  department: user.department,
  permissions: user.permissions || roles[user.role]?.permissions || [],
})

const createToken = (user) => jwt.sign({ userId: user.id ?? user.userId ?? null, role: user.role, permissions: user.permissions || [] }, getJwtSecret(), { expiresIn: '8h' })

const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, 10)

const verifyPassword = async (plainPassword, hash) => bcrypt.compare(plainPassword, hash)

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret())
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
