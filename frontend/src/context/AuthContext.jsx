import React, { createContext, useState, useContext, useEffect } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    try {
      // Check if we have a token
      const supabaseToken = localStorage.getItem('supabaseToken')
      const adminToken = localStorage.getItem('adminToken')
      const token = supabaseToken || adminToken
      
      if (token) {
        // We have a token, assume we're authenticated
        setUser({
          id: 'admin-1',
          email: 'admin', // Generic - no hardcoded email
          role: 'admin'
        })
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const result = await api.login({ email, password })
      
      if (result.success) {
        setUser(result.data.user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: 'Login failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('supabaseToken')
    localStorage.removeItem('supabaseRefreshToken')
    localStorage.removeItem('supabaseUser')
    localStorage.removeItem('adminToken')
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}