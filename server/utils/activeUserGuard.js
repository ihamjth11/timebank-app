// ===================================
// ACTIVEUSERGUARD.JS — Stops suspended accounts from using the API
//
// A login token stays valid for 30 days, so suspending someone used to block only
// their NEXT login. This guard runs on every /api request that carries a valid token
// and refuses it when the account is suspended or no longer exists.
//
// The check is cached for 60 seconds per user so it costs one small database read
// per minute per active user. Suspend/reactivate call invalidateActiveUser() so the
// change takes effect immediately on this server.
// ===================================

const jwt = require('jsonwebtoken')
const User = require('../models/User')

const CACHE_TTL_MS = 60 * 1000
const MAX_CACHE_ENTRIES = 5000
const cache = new Map() // userId -> { active, expiresAt }

function invalidateActiveUser(userId) {
  cache.delete(String(userId))
}

async function isAccountActive(userId) {
  const cached = cache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.active

  const user = await User.findById(userId).select('isActive')
  const active = !!user && user.isActive !== false

  // Keep the cache from growing without limit
  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear()
  cache.set(userId, { active, expiresAt: Date.now() + CACHE_TTL_MS })
  return active
}

async function activeUserGuard(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return next() // public request: the route decides

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      return next() // invalid or expired token: the route answers 401 itself
    }

    const userId = typeof decoded.id === 'string' ? decoded.id : ''
    if (!/^[a-f\d]{24}$/i.test(userId)) return next()

    if (!(await isAccountActive(userId))) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'This account has been suspended. Contact TimeBank support if you think this is a mistake.'
      })
    }
    next()
  } catch (error) {
    // If the database check itself fails, do not lock everybody out
    console.error('Active user guard error:', error)
    next()
  }
}

module.exports = { activeUserGuard, invalidateActiveUser }