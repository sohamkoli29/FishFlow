import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import LandingPage from './pages/LandingPage/LandingPage'
import MenuPage from './pages/MenuPage/MenuPage'
import AdminLogin from './pages/AdminLogin/AdminLogin'
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'
import UnpaidOrders from './pages/UnpaidOrders/UnpaidOrders'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import AllOrders from './pages/AllOrders/AllOrders'
import SupplierBills from './pages/SupplierBills/SupplierBills'
import { api } from './utils/api'
import './styles/App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking')

  useEffect(() => {
    checkBackendStatus()
  }, [])

  const checkBackendStatus = async () => {
    try {
      const result = await api.healthCheck()
      if (result.status === 'OK') {
        setBackendStatus('connected')
      } else {
        setBackendStatus('error')
      }
    } catch (error) {
      console.error('Backend connection failed:', error)
      setBackendStatus('error')
    }
  }

  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <div className="status-banner">
              <div className="container">
                <div className="status-content">
                  <span className={`status-indicator status-${backendStatus}`}></span>
                  Backend: {backendStatus === 'connected' ? 'Connected' : 
                           backendStatus === 'checking' ? 'Checking...' : 'Disconnected'}
                </div>
              </div>
            </div>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/unpaid" 
                element={
                  <ProtectedRoute>
                    <UnpaidOrders />
                  </ProtectedRoute>
                } 
              />

              <Route 
                  path="/admin/orders" 
                  element={
                    <ProtectedRoute>
                      <AllOrders />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                   path="/admin/supplier-bills" 
                   element={
                     <ProtectedRoute>
                       <SupplierBills />
                     </ProtectedRoute>
                   } 
                 />
            </Routes>

            // Add this route to App.jsx

          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App