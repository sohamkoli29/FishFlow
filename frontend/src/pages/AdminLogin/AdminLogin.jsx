import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import './AdminLogin.css'

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false)

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/admin'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      navigate('/admin', { replace: true })
    } else {
      setError(result.error || 'Login failed. Please check your credentials.')
    }
    
    setLoading(false)
  }

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>🐟 FishFlow Admin</h1>
            <p>Sign in to manage your fish shop</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="your-email@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="button-spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              <strong>Note:</strong> This is the admin panel. 
              Customer ordering does not require login.
            </p>
            {isFirstTimeSetup && (
              <div className="setup-notice">
                <p>
                  <strong>First time setup?</strong> Contact support to create your admin account.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin