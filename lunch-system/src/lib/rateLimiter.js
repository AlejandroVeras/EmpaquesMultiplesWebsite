// Rate limiting utility for form submissions and API calls
class RateLimiter {
  constructor() {
    this.attempts = new Map()
    this.blockedUntil = new Map()
  }

  // Check if action is rate limited
  isRateLimited(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now()
    const blocked = this.blockedUntil.get(key)
    
    // Check if still blocked
    if (blocked && now < blocked) {
      return {
        limited: true,
        retryAfter: Math.ceil((blocked - now) / 1000)
      }
    }
    
    // Clean up old attempts
    const attempts = this.attempts.get(key) || []
    const validAttempts = attempts.filter(time => now - time < windowMs)
    
    // Check if too many attempts
    if (validAttempts.length >= maxAttempts) {
      const blockUntil = now + windowMs
      this.blockedUntil.set(key, blockUntil)
      
      return {
        limited: true,
        retryAfter: Math.ceil(windowMs / 1000)
      }
    }
    
    return { limited: false }
  }

  // Record an attempt
  recordAttempt(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Add current attempt
    attempts.push(now)
    
    // Keep only recent attempts
    const validAttempts = attempts.filter(time => now - time < windowMs)
    this.attempts.set(key, validAttempts)
    
    return this.isRateLimited(key, maxAttempts, windowMs)
  }

  // Clear attempts for a key
  clearAttempts(key) {
    this.attempts.delete(key)
    this.blockedUntil.delete(key)
  }

  // Get time until retry is allowed
  getRetryAfter(key) {
    const blocked = this.blockedUntil.get(key)
    if (!blocked) return 0
    
    const now = Date.now()
    return Math.max(0, Math.ceil((blocked - now) / 1000))
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

// Specific rate limiting functions
export const checkFormSubmissionRate = (userId) => {
  return rateLimiter.isRateLimited(`form_submission_${userId}`, 10, 60000) // 10 attempts per minute
}

export const recordFormSubmission = (userId) => {
  return rateLimiter.recordAttempt(`form_submission_${userId}`, 10, 60000)
}

export const checkLoginRate = (email) => {
  return rateLimiter.isRateLimited(`login_${email}`, 5, 300000) // 5 attempts per 5 minutes
}

export const recordLoginAttempt = (email) => {
  return rateLimiter.recordAttempt(`login_${email}`, 5, 300000)
}

export const checkSyncRate = () => {
  return rateLimiter.isRateLimited('sync_operation', 3, 30000) // 3 syncs per 30 seconds
}

export const recordSyncAttempt = () => {
  return rateLimiter.recordAttempt('sync_operation', 3, 30000)
}

// Clear all rate limits (for admin use)
export const clearAllRateLimits = () => {
  rateLimiter.attempts.clear()
  rateLimiter.blockedUntil.clear()
}

// Utility function to create user-friendly rate limit messages
export const getRateLimitMessage = (retryAfter) => {
  if (retryAfter < 60) {
    return `Demasiados intentos. Intenta de nuevo en ${retryAfter} segundo${retryAfter !== 1 ? 's' : ''}.`
  } else {
    const minutes = Math.ceil(retryAfter / 60)
    return `Demasiados intentos. Intenta de nuevo en ${minutes} minuto${minutes !== 1 ? 's' : ''}.`
  }
}

// Hook for React components to use rate limiting
export const useRateLimit = (key, maxAttempts = 5, windowMs = 60000) => {
  const checkLimit = () => rateLimiter.isRateLimited(key, maxAttempts, windowMs)
  const recordAttempt = () => rateLimiter.recordAttempt(key, maxAttempts, windowMs)
  const clearLimit = () => rateLimiter.clearAttempts(key)
  const getRetryAfter = () => rateLimiter.getRetryAfter(key)
  
  return {
    checkLimit,
    recordAttempt,
    clearLimit,
    getRetryAfter
  }
}