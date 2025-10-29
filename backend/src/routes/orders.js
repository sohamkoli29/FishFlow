import express from 'express'
import { supabase } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/orders - Get all orders
router.get('/', async (req, res) => {
  try {
    const { payment_status, status } = req.query
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by payment status if provided
    if (payment_status) {
      query = query.eq('payment_status', payment_status)
    }

    // Filter by order status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    })
  }
})

// GET /api/orders/unpaid - Get unpaid orders with totals
router.get('/unpaid/summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('payment_status', 'unpaid')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate total unpaid amount
    const totalUnpaid = data?.reduce((total, order) => {
      return total + parseFloat(order.total_amount || 0)
    }, 0) || 0

    res.json({
      success: true,
      data: {
        orders: data || [],
        summary: {
          totalUnpaidOrders: data?.length || 0,
          totalUnpaidAmount: parseFloat(totalUnpaid.toFixed(2))
        }
      }
    })
  } catch (error) {
    console.error('Error fetching unpaid orders:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unpaid orders'
    })
  }
})

// GET /api/orders/:id - Get single order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    })
  }
})

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_phone, table_number, notes, items } = req.body

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order must contain at least one item'
      })
    }

    if (!customer_name || customer_name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required'
      })
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id) {
        return res.status(400).json({
          success: false,
          error: 'Each item must have a product_id'
        })
      }
      
      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quantity for item'
        })
      }
      
      const unitPrice = parseFloat(item.unit_price);
      if (isNaN(unitPrice) || unitPrice < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid unit price for item'
        })
      }
    }

    // Calculate total amount with float precision
    const total_amount = parseFloat(items.reduce((total, item) => {
      return total + (parseFloat(item.quantity) * parseFloat(item.unit_price))
    }, 0).toFixed(2))

    const orderData = {
      customer_name: customer_name.trim(),
      customer_phone: customer_phone ? customer_phone.trim() : null,
      table_number: table_number ? table_number.trim() : null,
      notes: notes ? notes.trim() : null,
      total_amount,
      status: 'pending',
      payment_status: 'unpaid'
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items with proper decimal values
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: parseFloat(parseFloat(item.quantity).toFixed(2)),
      unit_price: parseFloat(parseFloat(item.unit_price).toFixed(2))
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Fetch the complete order with items and products
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq('id', order.id)
      .single()

    if (fetchError) throw fetchError

    res.status(201).json({
      success: true,
      data: completeOrder,
      message: 'Order placed successfully'
    })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    })
  }
})

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { status, payment_status } = req.body

    const updateData = {}
    
    if (status) updateData.status = status
    if (payment_status) updateData.payment_status = payment_status
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      })
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Order status updated successfully'
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    })
  }
})

// PUT /api/orders/:id/mark-paid - Mark order as paid
router.put('/:id/mark-paid', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { payment_method = 'cash', notes } = req.body

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'completed',
        payment_method,
        payment_notes: notes,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)

    if (error) throw error

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      })
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Order marked as paid successfully'
    })
  } catch (error) {
    console.error('Error marking order as paid:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to mark order as paid'
    })
  }
})

// PUT /api/orders/:id/cancel - Cancel an order
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { cancellation_reason } = req.body

    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: 'cancelled',
        cancellation_reason: cancellation_reason || 'Order cancelled by admin',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)

    if (error) throw error

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      })
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    })
  }
})

export default router