import React from 'react'
import { useAuth } from '../../context/AuthContext'
import './Header.css'

const Header = () => {
  const { isAuthenticated } = useAuth()

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1>🐟 FishFlow</h1>
          </div>
         <nav className="nav">
            <a href="/" className="nav-link">Home</a>
             <a href="/menu" className="nav-link">Menu</a>
            {isAuthenticated ? (
              <>
              <a href="/admin" className="nav-link">Products</a>
            <a href="/admin/orders" className="nav-link">All Orders</a>
            <a href="/admin/unpaid" className="nav-link">Unpaid</a>
             <a href="/admin/supplier-bills" className="nav-link">Supplier Bills</a>
             </>
          ) : (
        <a href="/admin/login" className="nav-link">Admin</a>
         )}
      </nav>
        </div>
      </div>
    </header>
  )
}

export default Header