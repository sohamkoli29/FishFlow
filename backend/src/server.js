import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Import routes
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import qrRoutes from './routes/qr.js'
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import supplierRoutes from './routes/suppliers.js'
import supplierBillRoutes from './routes/supplierBills.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'FishFlow Backend is running',
    timestamp: new Date().toISOString()
  })
})

// Routes
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/qr', qrRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/supplier-bills', supplierBillRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 FishFlow Backend running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🐟 Products API: http://localhost:${PORT}/api/products`)
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders`)
  console.log(`🔲 QR API: http://localhost:${PORT}/api/qr`)
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`)
  console.log(`🖼️ Upload API: http://localhost:${PORT}/api/upload`)
  console.log(`🏭 Suppliers API: http://localhost:${PORT}/api/suppliers`)
  console.log(`🧾 Supplier Bills API: http://localhost:${PORT}/api/supplier-bills`)
})