import React from 'react'
import './LandingPage.css'

const LandingPage = () => {
  return (
    <div className="landing-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to <span className="highlight">FishFlow</span>
            </h1>
            <p className="hero-subtitle">
              Modern fish shop management system that streamlines your operations
            </p>
            <div className="hero-actions">
              <a href="/menu" className="btn btn-primary btn-large">
                Order Now
              </a>
              <a href="/admin" className="btn btn-secondary btn-large">
                Manage Shop
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose FishFlow?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>QR Ordering</h3>
              <p>Customers scan QR codes to view menu and order directly from their phones</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Live Dashboard</h3>
              <p>Real-time sales tracking and inventory management</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Payment Tracking</h3>
              <p>Keep track of customer balances and supplier bills</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Easy to Use</h3>
              <p>Simple interface designed for fish shop owners</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Modernize Your Fish Shop?</h2>
            <p>Start using FishFlow today and experience seamless management</p>
            <a href="/admin" className="btn btn-primary btn-large">
              Get Started
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage