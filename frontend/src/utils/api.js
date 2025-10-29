const API_BASE_URL = import.meta.env.VITE_API_BASE

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('supabaseToken') || localStorage.getItem('adminToken')
  
  return token ? { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : { 'Content-Type': 'application/json' }
}

// Helper to store session data
const storeSession = (data) => {
  if (data?.token) {
    // Store token for simple auth
    localStorage.setItem('adminToken', data.token)
    localStorage.setItem('supabaseToken', data.token)
  }
  if (data?.session?.access_token) {
    // Store session for Supabase auth (if you switch later)
    localStorage.setItem('supabaseToken', data.session.access_token)
    localStorage.setItem('supabaseRefreshToken', data.session.refresh_token)
    localStorage.setItem('supabaseUser', JSON.stringify(data.session.user))
    localStorage.setItem('adminToken', data.session.access_token)
  }
}

// Helper to clear session data
const clearSession = () => {
  localStorage.removeItem('supabaseToken')
  localStorage.removeItem('supabaseRefreshToken')
  localStorage.removeItem('supabaseUser')
  localStorage.removeItem('adminToken')
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
    
    const result = await response.json()
    
    // Store session if login successful
    if (result.success && result.data) {
      storeSession(result.data)
    }
    
    return result
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    
    // Clear session regardless of response
    clearSession()
    
    return await response.json()
  },

  async getCurrentUser() {
    // Simple version that doesn't make an API call
    const token = localStorage.getItem('supabaseToken') || localStorage.getItem('adminToken')
    
    if (token) {
      return {
        success: true,
        data: {
          user: {
            id: 'admin-1',
            email: 'admin', // Generic - no hardcoded email
            role: 'admin'
          }
        }
      }
    } else {
      return {
        success: false,
        error: 'No token found'
      }
    }
  },

  async refreshToken(refreshToken) {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    
    const result = await response.json()
    
    // Store new session if refresh successful
    if (result.success && result.data.session) {
      storeSession(result.data)
    }
    
    return result
  },

  // Auto-refresh token on 401 responses
  async fetchWithAuth(url, options = {}) {
    let response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    })

    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('supabaseRefreshToken')
      if (refreshToken) {
        const refreshResult = await this.refreshToken(refreshToken)
        if (refreshResult.success) {
          // Retry original request with new token
          response = await fetch(url, {
            ...options,
            headers: {
              ...getAuthHeaders(),
              ...options.headers,
            },
          })
        } else {
          clearSession()
          window.location.href = '/admin/login'
          throw new Error('Session expired')
        }
      } else {
        clearSession()
        window.location.href = '/admin/login'
        throw new Error('Session expired')
      }
    }

    return response
  },

  // Upload
  async uploadImage(imageData, fileName) {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
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
    const response = await this.fetchWithAuth(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(productData),
    })
    return await response.json()
  },

  async updateProduct(id, productData) {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    })
    return await response.json()
  },

  async deleteProduct(id) {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
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
    const response = await this.fetchWithAuth(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    })
    return await response.json()
  },

  async markOrderAsPaid(id, paymentData = {}) {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/orders/${id}/mark-paid`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    })
    return await response.json()
  },

  async cancelOrder(id, cancellationData = {}) {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/orders/${id}/cancel`, {
      method: 'PUT',
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
    const response = await this.fetchWithAuth(`${API_BASE_URL}/suppliers`, {
      method: 'POST',
      body: JSON.stringify(supplierData),
    })
    return await response.json()
  },

  async updateSupplier(id, supplierData) {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
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
    const response = await this.fetchWithAuth(`${API_BASE_URL}/supplier-bills`, {
      method: 'POST',
      body: JSON.stringify(billData),
    })
    return await response.json()
  },

  async updateSupplierBillPaymentStatus(id, statusData) {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/supplier-bills/${id}/payment-status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    })
    return await response.json()
  },

  // Analytics
  async getSalesSummary(period = 'today') {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/analytics/sales-summary?period=${period}`)
    return await response.json()
  },

  async getRevenueTrends(period = 'week') {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/analytics/revenue-trends?period=${period}`)
    return await response.json()
  },

  async getTopProducts(limit = 10, period = 'month') {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/analytics/top-products?limit=${limit}&period=${period}`)
    return await response.json()
  },

  async getOrderMetrics(period = 'month') {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/analytics/order-metrics?period=${period}`)
    return await response.json()
  },

  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`)
    return await response.json()
  }
}