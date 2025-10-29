import React, { useState } from 'react'
import { formatCurrency } from '../../utils/currency'
import './CheckoutForm.css'

const CheckoutForm = ({ 
  cart, 
  onCheckout, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    table_number: '',
    notes: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onCheckout(formData)
  }

  const getCartTotal = () => {
    return parseFloat(cart.reduce((total, item) => 
      total + (parseFloat(item.price) * parseFloat(item.quantity)), 0).toFixed(2)
    )
  }

  return (
    <div className="checkout-form-overlay">
      <div className="checkout-form-container">
        <div className="checkout-form-header">
          <h2>Checkout</h2>
          <button 
            className="close-btn"
            onClick={onCancel}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          {/* Order Summary */}
          <div className="order-summary-section">
            <h3>Order Summary</h3>
            <div className="order-items">
              {cart.map(item => (
                <div key={item.id} className="order-item">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">{item.quantity} kg</span>
                  <span className="item-total">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="order-total">
              <span>Total:</span>
              <span>{formatCurrency(getCartTotal())}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="form-section">
            <h3>Customer Information</h3>
            
            <div className="form-group">
              <label htmlFor="customer_name" className="form-label">
                Customer Name *
              </label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer_phone" className="form-label">
                Phone Number
              </label>
              <input
                type="tel"
                id="customer_phone"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your phone number"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="table_number" className="form-label">
                Table Number (if applicable)
              </label>
              <input
                type="text"
                id="table_number"
                name="table_number"
                value={formData.table_number}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter table number"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Special Instructions
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="form-input form-textarea"
                placeholder="Any special instructions or requests..."
                rows="3"
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              className="btn btn-primary"
              disabled={loading || !formData.customer_name.trim()}
            >
              {loading ? 'Placing Order...' : `Place Order - ${formatCurrency(getCartTotal())}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CheckoutForm