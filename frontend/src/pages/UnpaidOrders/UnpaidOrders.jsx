import React, { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { formatCurrency } from '../../utils/currency'
import './UnpaidOrders.css'

const UnpaidOrders = () => {
  const [unpaidData, setUnpaidData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingPaid, setMarkingPaid] = useState(null)
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(null)

  useEffect(() => {
    fetchUnpaidOrders()
  }, [])

  const fetchUnpaidOrders = async () => {
    try {
      setLoading(true)
      const result = await api.getUnpaidOrdersSummary()
      
      if (result.success) {
        setUnpaidData(result.data)
      } else {
        setError('Failed to load unpaid orders')
      }
    } catch (err) {
      setError('Error connecting to server')
      console.error('Error fetching unpaid orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (orderId, paymentData) => {
    try {
      setMarkingPaid(orderId)
      const result = await api.markOrderAsPaid(orderId, paymentData)
      
      if (result.success) {
        // Remove the order from the unpaid list
        setUnpaidData(prev => ({
          ...prev,
          orders: prev.orders.filter(order => order.id !== orderId),
          summary: {
            ...prev.summary,
            totalUnpaidOrders: prev.summary.totalUnpaidOrders - 1,
            totalUnpaidAmount: parseFloat((prev.summary.totalUnpaidAmount - result.data.total_amount).toFixed(2))
          }
        }))
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

  const handleCancelOrder = async (orderId, cancellationData) => {
    try {
      setCancellingOrder(orderId)
      const result = await api.cancelOrder(orderId, cancellationData)
      
      if (result.success) {
        // Remove the order from the unpaid list
        setUnpaidData(prev => ({
          ...prev,
          orders: prev.orders.filter(order => order.id !== orderId),
          summary: {
            ...prev.summary,
            totalUnpaidOrders: prev.summary.totalUnpaidOrders - 1,
            totalUnpaidAmount: parseFloat((prev.summary.totalUnpaidAmount - result.data.total_amount).toFixed(2))
          }
        }))
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

  const getTimeAgo = (dateString) => {
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

  if (loading) {
    return (
      <div className="unpaid-orders-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading unpaid orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="unpaid-orders-page">
        <div className="container">
          <div className="error-message">
            <h3>Unable to Load Unpaid Orders</h3>
            <p>{error}</p>
            <button onClick={fetchUnpaidOrders} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="unpaid-orders-page">
      {/* Header */}
      <div className="unpaid-header">
        <div className="container">
          <div className="unpaid-header-content">
            <div>
              <h1>Unpaid Balances</h1>
              <p>Track and manage customer payments</p>
            </div>
            <div className="header-actions">
              <button 
                className="btn btn-secondary"
                onClick={fetchUnpaidOrders}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Summary Cards */}
        {unpaidData && (
          <div className="summary-cards">
            <div className="summary-card total-orders">
              <div className="summary-icon">📋</div>
              <div className="summary-content">
                <h3>{unpaidData.summary.totalUnpaidOrders}</h3>
                <p>Unpaid Orders</p>
              </div>
            </div>
            <div className="summary-card total-amount">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <h3>{formatCurrency(unpaidData.summary.totalUnpaidAmount)}</h3>
                <p>Total Due</p>
              </div>
            </div>
          </div>
        )}

        {/* Unpaid Orders List */}
        <div className="unpaid-orders-section">
          <h2>Pending Payments</h2>
          
          {!unpaidData?.orders || unpaidData.orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>All Caught Up!</h3>
              <p>No unpaid orders at the moment.</p>
              <p>All customers have settled their bills.</p>
            </div>
          ) : (
            <div className="unpaid-orders-list">
              {unpaidData.orders.map(order => (
                <div key={order.id} className="unpaid-order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3 className="customer-name">
                        {order.customer_name}
                        {order.table_number && (
                          <span className="table-badge">Table {order.table_number}</span>
                        )}
                      </h3>
                      <div className="order-meta">
                        <span className="order-id">Order #{order.id.slice(-8)}</span>
                        <span className="order-time">
                          {new Date(order.created_at).toLocaleDateString()} • {getTimeAgo(order.created_at)}
                        </span>
                      </div>
                      {order.customer_phone && (
                        <div className="customer-phone">
                          📞 {order.customer_phone}
                        </div>
                      )}
                    </div>
                    <div className="order-amount">
                      <div className="amount-due">{formatCurrency(order.total_amount)}</div>
                      <div className="amount-label">Due</div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="order-items">
                    <h4>Order Items:</h4>
                    <div className="items-list">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="order-item">
                          <span className="item-name">
                            {item.products?.name || 'Unknown Product'}
                          </span>
                          <span className="item-quantity">
                            {item.quantity} kg
                          </span>
                          <span className="item-price">
                            {formatCurrency(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="order-notes">
                      <strong>Notes:</strong> {order.notes}
                    </div>
                  )}

                  {/* Action Buttons */}
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

export default UnpaidOrders