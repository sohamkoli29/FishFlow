import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'
import { formatCurrency } from '../../utils/currency'
import InlineEdit from '../../components/InlineEdit/InlineEdit'
import ImageUpload from '../../components/ImageUpload/ImageUpload'
import './AdminDashboard.css'

// Helper functions for mobile detection
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const hasCamera = () => {
  return navigator.mediaDevices && navigator.mediaDevices.getUserMedia
}

const AdminDashboard = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const { logout } = useAuth()

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

  const handleAddProduct = async (productData) => {
    try {
      const result = await api.createProduct(productData)
      
      if (result.success) {
        setProducts(prev => [result.data, ...prev])
        setShowAddForm(false)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Error adding product:', err)
      return { success: false, error: 'Failed to add product' }
    }
  }

  const handleUpdateProduct = async (id, productData) => {
    try {
      const result = await api.updateProduct(id, productData)
      
      if (result.success) {
        setProducts(prev => prev.map(p => p.id === id ? result.data : p))
        setEditingProduct(null)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Error updating product:', err)
      return { success: false, error: 'Failed to update product' }
    }
  }

  const handleInlineUpdate = async (productId, field, value) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) return

      const updateData = { [field]: value }
      const result = await api.updateProduct(productId, { ...product, ...updateData })
      
      if (result.success) {
        setProducts(prev => prev.map(p => p.id === productId ? result.data : p))
      } else {
        throw new Error(result.error || 'Update failed')
      }
    } catch (err) {
      console.error('Error updating product:', err)
      throw err
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      const result = await api.deleteProduct(id)
      
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== id))
      } else {
        alert(result.error || 'Failed to delete product')
      }
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Failed to delete product')
    }
  }

  const toggleProductAvailability = async (product) => {
    const result = await handleUpdateProduct(product.id, {
      ...product,
      is_available: !product.is_available
    })
    
    if (!result.success) {
      alert(result.error)
    }
  }

  // Price validation for inline editing
  const validatePrice = (value) => {
    const price = parseFloat(value)
    if (isNaN(price) || price < 0) {
      return 'Price must be a positive number'
    }
    return null
  }

  // Name validation for inline editing
  const validateName = (value) => {
    if (!value.trim()) {
      return 'Product name is required'
    }
    if (value.trim().length < 2) {
      return 'Product name must be at least 2 characters'
    }
    return null
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Manage your fish shop products</p>
            </div>
            <div className="admin-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                + Add Product
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => window.open('/menu', '_blank')}
              >
                View Menu
              </button>
              <button 
                className="btn btn-secondary"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchProducts} className="btn btn-primary btn-small">
              Try Again
            </button>
          </div>
        )}

        {/* Products Table */}
        <div className="products-table-section">
          <div className="section-header">
            <h2>Products ({products.length})</h2>
            <div className="section-actions">
              <button 
                className="btn btn-small btn-secondary"
                onClick={fetchProducts}
              >
                Refresh
              </button>
            </div>
          </div>
          
          {products.length === 0 ? (
            <div className="empty-state">
              <p>No products found.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: '120px' }}>Price</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className={!product.is_available ? 'unavailable' : ''}>
                      <td>
                        <div className="product-info-cell">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="product-thumbnail"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          )}
                          <div className="product-details">
                            <InlineEdit
                              value={product.name}
                              onSave={(value) => handleInlineUpdate(product.id, 'name', value)}
                              validate={validateName}
                              className="inline-edit-name"
                              inputClassName="name-input"
                              placeholder="Product name"
                            />
                            <InlineEdit
                              value={product.description || ''}
                              onSave={(value) => handleInlineUpdate(product.id, 'description', value)}
                              className="inline-edit-description"
                              inputClassName="description-input"
                              placeholder="Add description..."
                            />
                          </div>
                        </div>
                      </td>
                      <td className="price-cell">
                        <InlineEdit
                          value={product.price}
                          onSave={(value) => handleInlineUpdate(product.id, 'price', parseFloat(value))}
                          type="number"
                          validate={validatePrice}
                          className="inline-edit-price"
                          inputClassName="price-input"
                          placeholder="0.00"
                        />
                      </td>
                      <td>
                        <span className={`status-badge ${product.is_available ? 'available' : 'unavailable'}`}>
                          {product.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => toggleProductAvailability(product)}
                          >
                            {product.is_available ? 'Make Unavailable' : 'Make Available'}
                          </button>
                          <button
                            className="btn btn-small btn-primary"
                            onClick={() => setEditingProduct(product)}
                          >
                            Edit Image
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <ProductForm
          onSave={handleAddProduct}
          onCancel={() => setShowAddForm(false)}
          title="Add New Product"
        />
      )}

      {/* Edit Product Form */}
      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSave={(data) => handleUpdateProduct(editingProduct.id, data)}
          onCancel={() => setEditingProduct(null)}
          title="Edit Product Image"
        />
      )}
    </div>
  )
}

// Enhanced Product Form Component with Image Upload
const ProductForm = ({ product, onSave, onCancel, title }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    image_url: product?.image_url || '',
    is_available: product?.is_available ?? true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required')
      setLoading(false)
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required')
      setLoading(false)
      return
    }

    const result = await onSave(formData)
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{title}</h2>
          <button 
            className="close-btn"
            onClick={onCancel}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Salmon Fillet"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input form-textarea"
              placeholder="Product description..."
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price" className="form-label">
              Price (₹) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="form-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">  
            <label className="form-label">
              Product Image {isMobile() && hasCamera() && '📷'}
            </label>
            <ImageUpload
              currentImage={formData.image_url}
              onImageChange={handleImageChange}
              disabled={loading}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              Available for sale
            </label>
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
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminDashboard