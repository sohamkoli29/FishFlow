import React, { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { formatCurrency, formatCurrencyWithoutSymbol } from '../../utils/currency'
import CheckoutForm from '../../components/CheckoutForm/CheckoutForm'
import './MenuPage.css'

const MenuPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const result = await api.getProducts()
      
      if (result.success) {
        setProducts(result.data)
      } else {
        setError('Failed to load products')
      }
    } catch (err) {
      setError('Error connecting to server')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    if (!product.is_available) return

    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: parseFloat((item.quantity + 0.1).toFixed(2)) }
          : item
      ))
    } else {
      setCart([...cart, {
        ...product,
        quantity: 0.1
      }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, newQuantity) => {
    const quantity = parseFloat(newQuantity)
    if (quantity < 0.1) {
      removeFromCart(productId)
      return
    }
    
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: parseFloat(quantity.toFixed(2)) }
        : item
    ))
  }

  const handleQuantityInput = (productId, value) => {
    const quantity = parseFloat(value) || 0
    if (quantity >= 0.1) {
      updateQuantity(productId, quantity)
    }
  }

  const getCartTotal = () => {
    return parseFloat(cart.reduce((total, item) => 
      total + (parseFloat(item.price) * parseFloat(item.quantity)), 0).toFixed(2)
    )
  }

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const handleCheckout = async (customerData) => {
    try {
      setOrderLoading(true)
      
      const orderData = {
        ...customerData,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.price)
        }))
      }

      const result = await api.createOrder(orderData)
      
      if (result.success) {
        setOrderSuccess(result.data)
        setCart([])
        setShowCheckout(false)
        setShowCart(false)
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setOrderSuccess(null)
        }, 5000)
      } else {
        alert(result.error || 'Failed to place order. Please try again.')
      }
    } catch (err) {
      alert('Error placing order. Please try again.')
      console.error('Error creating order:', err)
    } finally {
      setOrderLoading(false)
    }
  }

  const proceedToCheckout = () => {
    setShowCart(false)
    setShowCheckout(true)
  }

  const closeCheckout = () => {
    setShowCheckout(false)
  }

  if (loading) {
    return (
      <div className="menu-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading menu...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="menu-page">
        <div className="container">
          <div className="error-message">
            <h3>Unable to Load Menu</h3>
            <p>{error}</p>
            <button onClick={fetchProducts} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-page">
      {/* Success Message */}
      {orderSuccess && (
        <div className="success-banner">
          <div className="container">
            <div className="success-content">
              <span className="success-icon">✅</span>
              <div>
                <h3>Order Placed Successfully!</h3>
                <p>Order #{orderSuccess.id.slice(-8)} - Total: {formatCurrency(orderSuccess.total_amount)}</p>
              </div>
              <button 
                className="close-success"
                onClick={() => setOrderSuccess(null)}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="menu-header">
        <div className="container">
          <div className="menu-header-content">
            <h1>🐟 Fresh Fish Menu</h1>
            <p>Order directly from your phone</p>
          </div>
        </div>
      </div>

      {/* Cart Button - Floating */}
      {cart.length > 0 && (
        <button 
          className="cart-floating-btn"
          onClick={() => setShowCart(true)}
        >
          <span className="cart-icon">🛒</span>
          <span className="cart-count">{getCartItemCount().toFixed(1)}</span>
          <span className="cart-total">{formatCurrency(getCartTotal())}</span>
        </button>
      )}

      {/* Products Grid */}
      <div className="container">
        <div className="products-section">
          <h2 className="section-title">Available Fish</h2>
          
          {products.length === 0 ? (
            <div className="no-products">
              <p>No products available at the moment.</p>
              <p>Please check back later.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <div 
                  key={product.id} 
                  className={`product-card ${!product.is_available ? 'unavailable' : ''}`}
                >
                  <div className="product-image">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        🐟
                      </div>
                    )}
                    {!product.is_available && (
                      <div className="unavailable-overlay">
                        Sold Out
                      </div>
                    )}
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    {product.description && (
                      <p className="product-description">{product.description}</p>
                    )}
                    <div className="product-price">{formatCurrency(product.price)}</div>
                    
                    {product.is_available ? (
                      <button 
                        className="btn btn-primary add-to-cart-btn"
                        onClick={() => addToCart(product)}
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <button className="btn btn-secondary" disabled>
                        Unavailable
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Your Order</h2>
              <button 
                className="close-cart"
                onClick={() => setShowCart(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Your cart is empty</p>
                  <p>Add some delicious fish to get started!</p>
                </div>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        <p>{formatCurrency(item.price)} per kg</p>
                      </div>
                      <div className="cart-item-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 0.1)}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          className="quantity-input"
                          value={item.quantity}
                          min="0.1"
                          step="0.1"
                          onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                          onBlur={(e) => {
                            if (!e.target.value || parseFloat(e.target.value) < 0.1) {
                              updateQuantity(item.id, 0.1)
                            }
                          }}
                        />
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 0.1)}
                        >
                          +
                        </button>
                        <button 
                          className="remove-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="cart-item-total">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total-section">
                  <div className="total-line">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(getCartTotal())}</span>
                  </div>
                  <div className="total-line grand-total">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(getCartTotal())}</span>
                  </div>
                </div>
                <button 
                  className="btn btn-primary checkout-btn"
                  onClick={proceedToCheckout}
                >
                  Proceed to Checkout - {formatCurrency(getCartTotal())}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Form */}
      {showCheckout && (
        <CheckoutForm
          cart={cart}
          onCheckout={handleCheckout}
          onCancel={closeCheckout}
          loading={orderLoading}
        />
      )}
    </div>
  )
}

export default MenuPage