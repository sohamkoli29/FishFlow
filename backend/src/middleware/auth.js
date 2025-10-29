// Simple authentication middleware for admin routes
// In a real application, you'd use proper JWT authentication
export const requireAuth = (req, res, next) => {
  // For now, we'll use a simple header-based auth
  // In Day 10, we'll implement proper Supabase Auth
  const authHeader = req.headers.authorization
  
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET || 'fishflow-admin'}`) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Admin access required'
    })
  }
  
  next()
}