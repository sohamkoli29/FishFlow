import React, { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { formatCurrency } from '../../utils/currency'
import './AllOrders.css'

const AllOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, unpaid, paid, cancelled
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [markingPaid, setMarkingPaid] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const filters = {}
      
      if (filter === 'unpaid') filters.payment_status = 'unpaid'
      if (filter === 'paid') filters.payment_status = 'paid'
      if (filter === 'cancelled') filters.status = 'cancelled'
      
      const result = await api.getOrders(filters)
      
      if (result.success) {
        setOrders(result.data)
      } else {
        setError('Failed to load orders')
      }
    } catch (err) {
      setError('Error connecting to server')
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId, cancellationData) => {
    try {
      setCancellingOrder(orderId)
      const result = await api.cancelOrder(orderId, cancellationData)
      
      if (result.success) {
        // Update the order in the list
        setOrders(prev => prev.map(order => 
          order.id === orderId ? result.data : order
        ))
        setShowCancelModal(null)
      } else {
        alert(result.error || 'Failed to cancel order')
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      alert('Failed to cancel order')
    } finally {
      setCancellingOrder(null)
    }
  }

  const handleMarkAsPaid = async (orderId, paymentData) => {
    try {
      setMarkingPaid(orderId)
      const result = await api.markOrderAsPaid(orderId, paymentData)
      
      if (result.success) {
        // Update the order in the list
        setOrders(prev => prev.map(order => 
          order.id === orderId ? result.data : order
        ))
        setShowPaymentModal(null)
      } else {
        alert(result.error || 'Failed to mark order as paid')
      }
    } catch (err) {
      console.error('Error marking order as paid:', err)
      alert('Failed to mark order as paid')
    } finally {
      setMarkingPaid(null)
    }
  }

  const getStatusBadge = (order) => {
    if (order.status === 'cancelled') {
      return <span className="status-badge cancelled">Cancelled</span>
    }
    
    if (order.payment_status === 'paid') {
      return <span className="status-badge paid">Paid</span>
    }
    
    return <span className="status-badge unpaid">Unpaid</span>
  }

  const getTimeAgo = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  // Helper function to get product name safely
  const getProductName = (item) => {
    // Check if products data exists and has name
    if (item.products && item.products.name) {
      return item.products.name
    }
    // If product data is missing, use product_name from order_items if available
    if (item.product_name) {
      return item.product_name
    }
    // Fallback
    return 'Unknown Product'
  }

  if (loading) {
    return (
      <div className="all-orders-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="all-orders-page">
        <div className="container">
          <div className="error-message">
            <h3>Unable to Load Orders</h3>
            <p>{error}</p>
            <button onClick={fetchOrders} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="all-orders-page">
      {/* Header */}
      <div className="orders-header">
        <div className="container">
          <div className="orders-header-content">
            <div>
              <h1>All Orders</h1>
              <p>Manage and track all customer orders</p>
            </div>
            <div className="header-actions">
              <button 
                className="btn btn-secondary"
                onClick={fetchOrders}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Orders
          </button>
          <button
            className={`filter-tab ${filter === 'unpaid' ? 'active' : ''}`}
            onClick={() => setFilter('unpaid')}
          >
            Unpaid
          </button>
          <button
            className={`filter-tab ${filter === 'paid' ? 'active' : ''}`}
            onClick={() => setFilter('paid')}
          >
            Paid
          </button>
          <button
            className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>

        {/* Orders List */}
        <div className="orders-section">
          <div className="section-header">
            <h2>
              {filter === 'all' && 'All Orders'}
              {filter === 'unpaid' && 'Unpaid Orders'}
              {filter === 'paid' && 'Paid Orders'}
              {filter === 'cancelled' && 'Cancelled Orders'}
              <span className="orders-count"> ({orders.length})</span>
            </h2>
          </div>
          
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Orders Found</h3>
              <p>There are no orders matching your current filter.</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className={`order-card ${order.status === 'cancelled' ? 'cancelled' : ''}`}>
                  <div className="order-header">
                    <div className="order-info">
                      <h3 className="customer-name">
                        {order.customer_name}
                        {order.table_number && (
                          <span className="table-badge">Table {order.table_number}</span>
                        )}
                        {getStatusBadge(order)}
                      </h3>
                      <div className="order-meta">
                        <span className="order-id">Order #{order.id.slice(-8)}</span>
                        <span className="order-time">
                          {new Date(order.created_at).toLocaleDateString()} • {getTimeAgo(order.created_at)}
                        </span>
                        {order.paid_at && (
                          <span className="paid-time">
                            Paid {getTimeAgo(order.paid_at)}
                          </span>
                        )}
                        {order.cancelled_at && (
                          <span className="cancelled-time">
                            Cancelled {getTimeAgo(order.cancelled_at)}
                          </span>
                        )}
                      </div>
                      {order.customer_phone && (
  <div className="customer-phone">
    <a 
      href={`tel:${order.customer_phone}`} 
      className="call-button"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      📞 {order.customer_phone}
    </a>
  </div>
)}

                    </div>
                    <div className="order-amount">
                      <div className="amount">{formatCurrency(order.total_amount)}</div>
                      <div className="amount-label">Total</div>
                    </div>
                  </div>

                  {/* Order Items - Fixed display */}
                  <div className="order-items">
                    <h4>Order Items:</h4>
                    <div className="items-list">
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map(item => (
                          <div key={item.id} className="order-item">
                            <span className="item-name">
                              {getProductName(item)}
                            </span>
                            <span className="item-quantity">
                              {item.quantity} kg
                            </span>
                            <span className="item-price">
                              {formatCurrency(item.unit_price * item.quantity)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="no-items">
                          No items found in this order
                        </div>
                      )}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="order-notes">
                      <strong>Order Notes:</strong> {order.notes}
                    </div>
                  )}

                  {order.cancellation_reason && (
                    <div className="cancellation-reason">
                      <strong>Cancellation Reason:</strong> {order.cancellation_reason}
                    </div>
                  )}

                  {order.payment_method && (
                    <div className="payment-info">
                      <strong>Payment Method:</strong> {order.payment_method}
                      {order.payment_notes && ` - ${order.payment_notes}`}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {order.status !== 'cancelled' && order.payment_status === 'unpaid' && (
                    <div className="order-actions">
                      <button
                        className="btn btn-danger cancel-btn"
                        onClick={() => setShowCancelModal(order)}
                        disabled={cancellingOrder === order.id}
                      >
                        {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                      <button
                        className="btn btn-success mark-paid-btn"
                        onClick={() => setShowPaymentModal(order)}
                        disabled={markingPaid === order.id}
                      >
                        {markingPaid === order.id ? 'Processing...' : 'Mark as Paid'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          order={showPaymentModal}
          onConfirm={handleMarkAsPaid}
          onCancel={() => setShowPaymentModal(null)}
          loading={markingPaid === showPaymentModal.id}
        />
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <CancelModal
          order={showCancelModal}
          onConfirm={handleCancelOrder}
          onCancel={() => setShowCancelModal(null)}
          loading={cancellingOrder === showCancelModal.id}
        />
      )}
    </div>
  )
}

// Payment Modal Component
const PaymentModal = ({ order, onConfirm, onCancel, loading }) => {
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash',
    notes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(order.id, paymentData)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container payment-modal">
        <div className="modal-header">
          <h2>Mark Order as Paid</h2>
          <button 
            className="close-btn"
            onClick={onCancel}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="payment-summary">
            <div className="payment-customer">
              <strong>Customer:</strong> {order.customer_name}
            </div>
            <div className="payment-amount">
              <strong>Amount:</strong> {formatCurrency(order.total_amount)}
            </div>
            {order.table_number && (
              <div className="payment-table">
                <strong>Table:</strong> {order.table_number}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="payment_method" className="form-label">
              Payment Method *
            </label>
            <select
              id="payment_method"
              name="payment_method"
              value={paymentData.payment_method}
              onChange={handleInputChange}
              className="form-input"
              required
              disabled={loading}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Payment Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={paymentData.notes}
              onChange={handleInputChange}
              className="form-input form-textarea"
              placeholder="Any notes about this payment..."
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? 'Processing...' : `Confirm Payment - ${formatCurrency(order.total_amount)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Cancel Order Modal Component
const CancelModal = ({ order, onConfirm, onCancel, loading }) => {
  const [cancellationData, setCancellationData] = useState({
    cancellation_reason: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(order.id, cancellationData)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCancellationData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const quickReasons = [
    'Customer left without paying',
    'Order placed by mistake',
    'Item not available',
    'Customer changed mind',
    'Duplicate order',
    'Technical issue'
  ]

  return (
    <div className="modal-overlay">
      <div className="modal-container cancel-modal">
        <div className="modal-header">
          <h2>Cancel Order</h2>
          <button 
            className="close-btn"
            onClick={onCancel}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="cancel-summary">
            <div className="cancel-customer">
              <strong>Customer:</strong> {order.customer_name}
            </div>
            <div className="cancel-amount">
              <strong>Order Amount:</strong> {formatCurrency(order.total_amount)}
            </div>
            {order.table_number && (
              <div className="cancel-table">
                <strong>Table:</strong> {order.table_number}
              </div>
            )}
            <div className="cancel-warning">
              ⚠️ This action cannot be undone. The order will be marked as cancelled.
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cancellation_reason" className="form-label">
              Cancellation Reason *
            </label>
            
            {/* Quick reason buttons */}
            <div className="quick-reasons">
              <p className="quick-reasons-label">Quick reasons:</p>
              <div className="quick-reasons-buttons">
                {quickReasons.map(reason => (
                  <button
                    key={reason}
                    type="button"
                    className="quick-reason-btn"
                    onClick={() => setCancellationData({ cancellation_reason: reason })}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              id="cancellation_reason"
              name="cancellation_reason"
              value={cancellationData.cancellation_reason}
              onChange={handleInputChange}
              className="form-input form-textarea"
              placeholder="Please provide a reason for cancellation..."
              rows="3"
              required
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Go Back
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading || !cancellationData.cancellation_reason.trim()}
            >
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AllOrders