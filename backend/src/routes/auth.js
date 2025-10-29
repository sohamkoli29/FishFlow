import express from 'express'
import { supabase, supabaseAuth } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// POST /api/auth/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Get credentials only from environment
    const expectedEmail = process.env.FIRST_ADMIN_EMAIL
    const expectedPassword = process.env.FIRST_ADMIN_PASSWORD
    const expectedToken = process.env.ADMIN_SECRET

    // Validate environment variables
    if (!expectedEmail || !expectedPassword) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      })
    }

    // Check if credentials match
    if (email === expectedEmail && password === expectedPassword) {
      return res.json({
        success: true,
        data: {
          user: {
            id: 'admin-1',
            email: expectedEmail,
            role: 'admin'
          },
          session: {
            access_token: expectedToken,
            refresh_token: expectedToken + '_refresh',
            user: {
              id: 'admin-1',
              email: expectedEmail
            }
          },
          token: expectedToken
        },
        message: 'Login successful'
      })
    } else {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
    }

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Login failed'
    })
  }
})

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      })
    }

    const token = authHeader.split(' ')[1]
    const expectedToken = process.env.ADMIN_SECRET

    // Validate token
    if (token !== expectedToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
    }

    // Return user info
    res.json({
      success: true,
      data: {
        user: {
          id: 'admin-1',
          email: process.env.FIRST_ADMIN_EMAIL,
          role: 'admin'
        }
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication check failed'
    })
  }
})

// POST /api/auth/logout - Logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    })
  }
})

// POST /api/auth/refresh - Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      })
    }

    // For now, just return success since we're using simple tokens
    // In a real JWT implementation, you'd verify and issue new tokens
    res.json({
      success: true,
      data: {
        session: {
          access_token: process.env.ADMIN_SECRET,
          refresh_token: refresh_token
        }
      }
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({
      success: false,
      error: 'Token refresh failed'
    })
  }
})

// Remove these routes for now since we're using simple auth:
// - /signup route (commented out since we're using env-based auth)
// - The duplicate /me route that uses requireAuth

export default router