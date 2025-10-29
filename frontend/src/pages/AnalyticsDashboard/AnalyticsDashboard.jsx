import React, { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { formatCurrency } from '../../utils/currency'
import './AnalyticsDashboard.css'

// Helper function to calculate percentage change
const calculateChange = (current, previous) => {
  if (!previous || previous === 0) return { value: 0, isPositive: true }
  const change = ((current - previous) / previous) * 100
  return {
    value: Math.abs(change).toFixed(1),
    isPositive: change >= 0
  }
}

const AnalyticsDashboard = () => {
  const [salesSummary, setSalesSummary] = useState(null)
  const [revenueTrends, setRevenueTrends] = useState(null)
  const [topProducts, setTopProducts] = useState(null)
  const [orderMetrics, setOrderMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')
  const [trendPeriod, setTrendPeriod] = useState('week')

  useEffect(() => {
    fetchAnalyticsData()
  }, [period, trendPeriod])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      const [summaryRes, trendsRes, productsRes, metricsRes] = await Promise.all([
        api.getSalesSummary(period),
        api.getRevenueTrends(trendPeriod),
        api.getTopProducts(10, 'month'),
        api.getOrderMetrics('month')
      ])

      if (summaryRes.success) setSalesSummary(summaryRes.data)
      if (trendsRes.success) setRevenueTrends(trendsRes.data)
      if (productsRes.success) setTopProducts(productsRes.data)
      if (metricsRes.success) setOrderMetrics(metricsRes.data)
      
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-dashboard">
      <div className="container">
        {/* Header */}
        <div className="analytics-header">
          <div>
            <h1>Sales Analytics</h1>
            <p>Track your business performance and revenue trends</p>
          </div>
          <div className="period-selector">
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="period-select"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Sales Summary Cards */}
        {salesSummary && (
          <div className="sales-summary-section">
            <h2>Sales Summary</h2>
            <div className="summary-cards">
              <SummaryCard
                title="Total Revenue"
                current={salesSummary.summary.totalRevenue}
                previous={salesSummary.previous?.totalRevenue}
                format={formatCurrency}
                icon="💰"
              />
              <SummaryCard
                title="Orders"
                current={salesSummary.summary.orderCount}
                previous={salesSummary.previous?.orderCount}
                format={(val) => val}
                icon="📦"
              />
              <SummaryCard
                title="Average Order Value"
                current={salesSummary.summary.averageOrderValue}
                previous={salesSummary.previous?.averageOrderValue}
                format={formatCurrency}
                icon="📊"
              />
            </div>
          </div>
        )}

        <div className="analytics-grid">
          {/* Revenue Trends */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>Revenue Trends</h3>
              <select 
                value={trendPeriod} 
                onChange={(e) => setTrendPeriod(e.target.value)}
                className="trend-period-select"
              >
                <option value="day">24 Hours</option>
                <option value="week">7 Days</option>
                <option value="month">30 Days</option>
              </select>
            </div>
            {revenueTrends && <RevenueChart data={revenueTrends.trends} />}
          </div>

          {/* Order Metrics */}
          {orderMetrics && (
            <div className="analytics-card">
              <div className="card-header">
                <h3>Order Metrics</h3>
                <span className="period-badge">This Month</span>
              </div>
              <OrderMetrics metrics={orderMetrics} />
            </div>
          )}

          {/* Top Products */}
          {topProducts && (
            <div className="analytics-card">
              <div className="card-header">
                <h3>Top Selling Products</h3>
                <span className="period-badge">This Month</span>
              </div>
              <TopProductsList products={topProducts.products} />
            </div>
          )}

          {/* Quick Stats */}
          <div className="analytics-card">
            <div className="card-header">
              <h3>Quick Stats</h3>
            </div>
            <QuickStats 
              salesSummary={salesSummary}
              orderMetrics={orderMetrics}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Summary Card Component
const SummaryCard = ({ title, current, previous, format, icon }) => {
  const change = calculateChange(current, previous)
  
  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <span className="summary-icon">{icon}</span>
        <h4>{title}</h4>
      </div>
      <div className="summary-card-content">
        <div className="current-value">{format(current)}</div>
        {previous !== undefined && (
          <div className={`change-indicator ${change.isPositive ? 'positive' : 'negative'}`}>
            {change.isPositive ? '↗' : '↘'} {change.value}%
            <span className="change-label">
              vs {change.isPositive ? 'up' : 'down'} from previous
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Revenue Chart Component (Simple bar chart with CSS)
const RevenueChart = ({ data }) => {
  const maxRevenue = Math.max(...data.map(item => item.revenue))
  
  return (
    <div className="revenue-chart">
      <div className="chart-bars">
        {data.map((item, index) => (
          <div key={index} className="chart-bar-container">
            <div className="chart-bar-label">{item.label}</div>
            <div className="chart-bar-wrapper">
              <div 
                className="chart-bar"
                style={{ 
                  height: maxRevenue > 0 ? `${(item.revenue / maxRevenue) * 100}%` : '0%' 
                }}
              ></div>
            </div>
            <div className="chart-bar-value">{formatCurrency(item.revenue)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Order Metrics Component
const OrderMetrics = ({ metrics }) => {
  return (
    <div className="order-metrics">
      <div className="metric-item">
        <span className="metric-label">Total Orders:</span>
        <span className="metric-value">{metrics.totalOrders}</span>
      </div>
      <div className="metric-item">
        <span className="metric-label">Completed:</span>
        <span className="metric-value positive">{metrics.completedOrders}</span>
      </div>
      <div className="metric-item">
        <span className="metric-label">Pending:</span>
        <span className="metric-value warning">{metrics.pendingOrders}</span>
      </div>
      <div className="metric-item">
        <span className="metric-label">Cancelled:</span>
        <span className="metric-value negative">{metrics.cancelledOrders}</span>
      </div>
      <div className="metric-item">
        <span className="metric-label">Paid Orders:</span>
        <span className="metric-value positive">{metrics.paidOrders}</span>
      </div>
      <div className="metric-item">
        <span className="metric-label">Unpaid Orders:</span>
        <span className="metric-value negative">{metrics.unpaidOrders}</span>
      </div>
      <div className="metric-item highlight">
        <span className="metric-label">Completion Rate:</span>
        <span className="metric-value">{metrics.completionRate.toFixed(1)}%</span>
      </div>
    </div>
  )
}

// Top Products List Component
const TopProductsList = ({ products }) => {
  return (
    <div className="top-products">
      {products.map((product, index) => (
        <div key={product.product.id} className="top-product-item">
          <div className="product-rank">#{index + 1}</div>
          <div className="product-info">
            {product.product.image_url && (
              <img 
                src={product.product.image_url} 
                alt={product.product.name}
                className="product-image"
              />
            )}
            <div className="product-details">
              <div className="product-name">{product.product.name}</div>
              <div className="product-stats">
                <span className="quantity">{product.totalQuantity} sold</span>
                <span className="revenue">{formatCurrency(product.totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Quick Stats Component
const QuickStats = ({ salesSummary, orderMetrics }) => {
  return (
    <div className="quick-stats">
      <div className="quick-stat">
        <span className="stat-icon">🎯</span>
        <div className="stat-info">
          <div className="stat-value">
            {orderMetrics?.averageOrderValue ? formatCurrency(orderMetrics.averageOrderValue) : '₹0'}
          </div>
          <div className="stat-label">Avg Order Value</div>
        </div>
      </div>
      <div className="quick-stat">
        <span className="stat-icon">📈</span>
        <div className="stat-info">
          <div className="stat-value">
            {salesSummary?.summary.orderCount || 0}
          </div>
          <div className="stat-label">Orders Today</div>
        </div>
      </div>
      <div className="quick-stat">
        <span className="stat-icon">💰</span>
        <div className="stat-info">
          <div className="stat-value">
            {orderMetrics?.totalRevenue ? formatCurrency(orderMetrics.totalRevenue) : '₹0'}
          </div>
          <div className="stat-label">Monthly Revenue</div>
        </div>
      </div>
      <div className="quick-stat">
        <span className="stat-icon">✅</span>
        <div className="stat-info">
          <div className="stat-value">
            {orderMetrics?.completionRate ? `${orderMetrics.completionRate.toFixed(1)}%` : '0%'}
          </div>
          <div className="stat-label">Success Rate</div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard