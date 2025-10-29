import express from 'express'
import { supabase } from '../config/database.js'

const router = express.Router()

// POST /api/auth/login - Simple admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Simple hardcoded admin credentials for development
    // In Day 10, we'll replace this with proper Supabase Auth
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fishflow.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    if (email === adminEmail && password === adminPassword) {
      res.json({
        success: true,
        data: {
          user: {
            id: 'admin-1',
            email: adminEmail,
            role: 'admin'
          },
          token: process.env.ADMIN_SECRET || 'fishflow-admin'
        },
        message: 'Login successful'
      })
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
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

// GET /api/auth/me - Get current user (simple implementation)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET || 'fishflow-admin'}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: 'admin-1',
          email: process.env.ADMIN_EMAIL || 'admin@fishflow.com',
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

export default router