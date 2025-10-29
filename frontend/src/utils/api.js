const API_BASE_URL = '/api'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export const api = {
  // Auth
  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    return await response.json()
  },

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    })
    return await response.json()
  },

  // Upload
  async uploadImage(imageData, fileName) {
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ imageData, fileName }),
    })
    return await response.json()
  },

  // Products
  async getProducts() {
    const response = await fetch(`${API_BASE_URL}/products`)
    return await response.json()
  },

  async getProduct(id) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`)
    return await response.json()
  },

  async createProduct(productData) {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(productData),
    })
    return await response.json()
  },

  async updateProduct(id, productData) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(productData),
    })
    return await response.json()
  },

  async deleteProduct(id) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    return await response.json()
  },

  // Orders
  async getOrders(filters = {}) {
    const params = new URLSearchParams()
    if (filters.payment_status) params.append('payment_status', filters.payment_status)
    if (filters.status) params.append('status', filters.status)
    
    const response = await fetch(`${API_BASE_URL}/orders?${params}`)
    return await response.json()
  },

  async getUnpaidOrdersSummary() {
    const response = await fetch(`${API_BASE_URL}/orders/unpaid/summary`)
    return await response.json()
  },

  async getOrder(id) {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`)
    return await response.json()
  },

  async createOrder(orderData) {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })
    return await response.json()
  },

  async updateOrderStatus(id, statusData) {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(statusData),
    })
    return await response.json()
  },

  async markOrderAsPaid(id, paymentData = {}) {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/mark-paid`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(paymentData),
    })
    return await response.json()
  },

  async cancelOrder(id, cancellationData = {}) {
  const response = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(cancellationData),
  })
  return await response.json()
},
  // QR Codes
  async getMenuQRCode() {
    const response = await fetch(`${API_BASE_URL}/qr/menu`)
    return await response.json()
  },


  // Suppliers
async getSuppliers(filters = {}) {
  const params = new URLSearchParams()
  if (filters.active !== undefined) params.append('active', filters.active)
  
  const response = await fetch(`${API_BASE_URL}/suppliers?${params}`)
  return await response.json()
},

async getSupplier(id) {
  const response = await fetch(`${API_BASE_URL}/suppliers/${id}`)
  return await response.json()
},

async createSupplier(supplierData) {
  const response = await fetch(`${API_BASE_URL}/suppliers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(supplierData),
  })
  return await response.json()
},

async updateSupplier(id, supplierData) {
  const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(supplierData),
  })
  return await response.json()
},

// Supplier Bills
async getSupplierBills(filters = {}) {
  const params = new URLSearchParams()
  if (filters.payment_status) params.append('payment_status', filters.payment_status)
  if (filters.month) params.append('month', filters.month)
  if (filters.year) params.append('year', filters.year)
  
  const response = await fetch(`${API_BASE_URL}/supplier-bills?${params}`)
  return await response.json()
},

async getSupplierBillsSummary(filters = {}) {
  const params = new URLSearchParams()
  if (filters.month) params.append('month', filters.month)
  if (filters.year) params.append('year', filters.year)
  
  const response = await fetch(`${API_BASE_URL}/supplier-bills/summary?${params}`)
  return await response.json()
},

async getSupplierBill(id) {
  const response = await fetch(`${API_BASE_URL}/supplier-bills/${id}`)
  return await response.json()
},

async createSupplierBill(billData) {
  const response = await fetch(`${API_BASE_URL}/supplier-bills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(billData),
  })
  return await response.json()
},

async updateSupplierBillPaymentStatus(id, statusData) {
  const response = await fetch(`${API_BASE_URL}/supplier-bills/${id}/payment-status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(statusData),
  })
  return await response.json()
},

  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`)
    return await response.json()
  }
}