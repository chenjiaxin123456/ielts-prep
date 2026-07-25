import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { config } from './config.js'

export function signToken(userId) {
  return jwt.sign({ uid: userId }, config.jwtSecret, { expiresIn: `${config.tokenExpireDays}d` })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch {
    return null
  }
}

export function hashPassword(p) {
  return bcrypt.hash(p, 10)
}

export function comparePassword(p, hash) {
  return bcrypt.compare(p, hash || '')
}
