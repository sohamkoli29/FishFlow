import React, { useState, useEffect } from 'react'
import { api } from '../../utils/api'
import { formatCurrency } from '../../utils/currency'
import './SupplierBills.css'

const SupplierBills = () => {
  const [bills, setBills] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, unpaid, paid
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [filter, selectedMonth, selectedYear])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch bills with filters
      const filters = {}
      if (filter !== 'all') filters.payment_status = filter
      filters.month = selectedMonth.toString().padStart(2, '0')
      filters.year = selectedYear.toString()

      const billsResult = await api.getSupplierBills(filters)
      if (billsResult.success) {
        setBills(billsResult.data)
      }

      // Fetch summary
      const summaryResult = await api.getSupplierBillsSummary({
        month: selectedMonth.toString().padStart(2, '0'),
        year: selectedYear.toString()
      })
      if (summaryResult.success) {
        setSummary(summaryResult.data)
      }

    } catch (err) {
      setError('Error connecting to server')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBill = async (billData) => {
    try {
      const result = await api.createSupplierBill(billData)
      
      if (result.success) {
        setBills(prev => [result.data, ...prev])
        setShowAddForm(false)
        fetchData() // Refresh summary
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Error adding supplier bill:', err)
      return { success: false, error: 'Failed to add supplier bill' }
    }
  }

  // Update the handleUpdatePaymentStatus function with better error handling
const handleUpdatePaymentStatus = async (billId, paymentStatus) => {
  try {
    const result = await api.updateSupplierBillPaymentStatus(billId, {
      payment_status: paymentStatus
    })
    
    if (result.success) {
      setBills(prev => prev.map(bill => 
        bill.id === billId ? result.data : bill
      ))
      fetchData() // Refresh summary
    } else {
      alert(result.error || 'Failed to update payment status')
    }
  } catch (err) {
    console.error('Error updating payment status:', err)
    alert('Failed to update payment status. Please check the console for details.')
  }
}

  const getStatusBadge = (paymentStatus) => {
    if (paymentStatus === 'paid') {
      return <span className="status-badge paid">Paid</span>
    }
    return <span className="status-badge unpaid">Unpaid</span>
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  // Generate months and years for filters
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  if (loading) {
    return (
      <div className="supplier-bills-page">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading supplier bills...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="supplier-bills-page">
      {/* Header */}
      <div className="bills-header">
        <div className="container">
          <div className="bills-header-content">
            <div>
              <h1>Supplier Bills</h1>
              <p>Track fish purchase costs from suppliers</p>
            </div>
            <div className="header-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                + Add Bill
              </button>
              <button 
                className="btn btn-secondary"
                onClick={fetchData}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Summary Cards */}
        {summary && (
          <div className="summary-cards">
            <div className="summary-card total-bills">
              <div className="summary-icon">🧾</div>
              <div className="summary-content">
                <h3>{summary.totalBills}</h3>
                <p>Total Bills</p>
              </div>
            </div>
            <div className="summary-card total-amount">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <h3>{formatCurrency(summary.totalAmount)}</h3>
                <p>Total Amount</p>
              </div>
            </div>
            <div className="summary-card paid-amount">
              <div className="summary-icon">✅</div>
              <div className="summary-content">
                <h3>{formatCurrency(summary.paidAmount)}</h3>
                <p>Paid</p>
              </div>
            </div>
            <div className="summary-card unpaid-amount">
              <div className="summary-icon">⏳</div>
              <div className="summary-content">
                <h3>{formatCurrency(summary.unpaidAmount)}</h3>
                <p>Unpaid</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Month:</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="filter-select"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Year:</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="filter-select"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Payment Status:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Bills</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Bills List */}
        <div className="bills-section">
          <h2>
            {filter === 'all' && 'All Bills'}
            {filter === 'unpaid' && 'Unpaid Bills'}
            {filter === 'paid' && 'Paid Bills'}
            <span className="bills-count"> ({bills.length})</span>
          </h2>
          
          {bills.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Bills Found</h3>
              <p>There are no supplier bills matching your current filters.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                Add Your First Bill
              </button>
            </div>
          ) : (
            <div className="bills-list">
              {bills.map(bill => (
                <div key={bill.id} className="bill-card">
                  <div className="bill-header">
                    <div className="bill-info">
                      <h3 className="supplier-name">
                        {bill.supplier_name}
                        {getStatusBadge(bill.payment_status)}
                      </h3>
                      <div className="bill-meta">
                        <span className="bill-id">
                          Bill #{bill.id.slice(-8)}
                        </span>
                        <span className="bill-date">
                          {formatDate(bill.bill_date)}
                        </span>
                        {bill.paid_date && (
                          <span className="paid-date">
                            Paid: {formatDate(bill.paid_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bill-amount">
                      <div className="amount">{formatCurrency(bill.total_amount)}</div>
                      <div className="amount-label">Total</div>
                    </div>
                  </div>

                  {/* Bill Items */}
                  <div className="bill-items">
                    <h4>Fish Items Purchased:</h4>
                    <div className="items-list">
                      {bill.supplier_bill_items?.map(item => (
                        <div key={item.id} className="bill-item">
                          <span className="item-name">
                            {item.product_name}
                          </span>
                          <span className="item-quantity">
                            {item.quantity} kg
                          </span>
                          <span className="item-price">
                            {formatCurrency(item.unit_price)}/kg
                          </span>
                          <span className="item-total">
                            {formatCurrency(item.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {bill.notes && (
                    <div className="bill-notes">
                      <strong>Notes:</strong> {bill.notes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="bill-actions">
                    {bill.payment_status === 'unpaid' ? (
                      <button
                        className="btn btn-success mark-paid-btn"
                        onClick={() => handleUpdatePaymentStatus(bill.id, 'paid')}
                      >
                        Mark as Paid
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary mark-unpaid-btn"
                        onClick={() => handleUpdatePaymentStatus(bill.id, 'unpaid')}
                      >
                        Mark as Unpaid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Bill Form */}
      {showAddForm && (
        <AddBillForm
          onSave={handleAddBill}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}

// Add Bill Form Component
const AddBillForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    supplier_name: '',
    bill_date: new Date().toISOString().split('T')[0],
    items: [{ product_name: '', quantity: '', unit_price: '', notes: '' }],
    payment_status: 'unpaid',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_name: '', quantity: '', unit_price: '', notes: '' }]
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((total, item) => {
      return total + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0))
    }, 0)
    return itemsTotal.toFixed(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.supplier_name.trim()) {
      setError('Please enter supplier name')
      setLoading(false)
      return
    }

    if (!formData.bill_date) {
      setError('Bill date is required')
      setLoading(false)
      return
    }

    // Validate items
    for (const item of formData.items) {
      if (!item.product_name.trim()) {
        setError('All items must have a fish name')
        setLoading(false)
        return
      }
      
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        setError('All items must have a valid quantity')
        setLoading(false)
        return
      }
      
      if (!item.unit_price || parseFloat(item.unit_price) < 0) {
        setError('All items must have a valid price per kg')
        setLoading(false)
        return
      }
    }

    const billData = {
      ...formData,
      items: formData.items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price)
      }))
    }

    const result = await onSave(billData)
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container bill-form-modal">
        <div className="modal-header">
          <h2>Add Supplier Bill</h2>
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supplier_name" className="form-label">
                Supplier Name *
              </label>
              <input
                type="text"
                id="supplier_name"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter supplier name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bill_date" className="form-label">
                Purchase Date *
              </label>
              <input
                type="date"
                id="bill_date"
                name="bill_date"
                value={formData.bill_date}
                onChange={handleInputChange}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="payment_status" className="form-label">
              Payment Status
            </label>
            <select
              id="payment_status"
              name="payment_status"
              value={formData.payment_status}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Bill Items */}
          <div className="form-section">
            <div className="section-header">
              <h3>Fish Items Purchased</h3>
              <button
                type="button"
                className="btn btn-small btn-secondary"
                onClick={addItem}
                disabled={loading}
              >
                + Add Fish Item
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="bill-item-row">
                <div className="item-fields">
                  <input
                    type="text"
                    placeholder="Fish name (e.g., Salmon, Pomfret)"
                    value={item.product_name}
                    onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                    className="form-input"
                    disabled={loading}
                  />
                  <input
                    type="number"
                    placeholder="Quantity (kg)"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="form-input"
                    min="0.01"
                    step="0.01"
                    disabled={loading}
                  />
                  <input
                    type="number"
                    placeholder="Price per kg (₹)"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    className="form-input"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={item.notes}
                    onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                    className="form-input"
                    disabled={loading}
                  />
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-small btn-danger remove-item-btn"
                      onClick={() => removeItem(index)}
                      disabled={loading}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {item.quantity && item.unit_price && (
                  <div className="item-total">
                    Item Total: {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total Calculation */}
          <div className="total-calculation">
            <div className="total-line grand-total">
              <span>Total Bill Amount:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="form-input form-textarea"
              placeholder="Any additional notes about this purchase..."
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
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : `Save Bill - ${formatCurrency(calculateTotal())}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SupplierBills