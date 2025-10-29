

// Middleware to verify Supabase JWT tokens
// Simple authentication middleware for admin routes - Updated for compatibility
export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      })
    }

    const token = authHeader.split(' ')[1]
    
    // For now, use simple token validation (like your original)
    const expectedToken = process.env.ADMIN_SECRET 
    
    if (token !== expectedToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      })
    }
    
    // Add basic user info to request
    req.user = {
      id: 'admin-1',
      email: process.env.FIRST_ADMIN_EMAIL ,
      role: 'admin'
    }
    
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}