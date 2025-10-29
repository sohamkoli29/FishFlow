import React from 'react'
import { useAuth } from '../../context/AuthContext'
import './ProtectedRoute.css'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <h2>Access Denied</h2>
          <p>You need to be logged in to access this page.</p>
          <a href="/admin/login" className="btn btn-primary">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute