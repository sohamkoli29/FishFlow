import express from 'express'
import { supabase } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/supplier-bills - Get all supplier bills
router.get('/', async (req, res) => {
  try {
    const { payment_status, month, year } = req.query
    
    let query = supabase
      .from('supplier_bills')
      .select(`
        *,
        supplier_bill_items (*)
      `)
      .order('bill_date', { ascending: false })

    // Filter by payment status if provided
    if (payment_status) {
      query = query.eq('payment_status', payment_status)
    }

    // Filter by month and year if provided
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`
      const endDate = `${year}-${month.padStart(2, '0')}-31`
      query = query.gte('bill_date', startDate).lte('bill_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching supplier bills:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier bills'
    })
  }
})

// GET /api/supplier-bills/summary - Get bills summary
router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query
    
    let query = supabase
      .from('supplier_bills')
      .select('total_amount, payment_status, bill_date')

    // Filter by month and year if provided
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`
      const endDate = `${year}-${month.padStart(2, '0')}-31`
      query = query.gte('bill_date', startDate).lte('bill_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Calculate summary statistics
    const totalBills = data?.length || 0
    const totalAmount = data?.reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0) || 0
    const paidAmount = data
      ?.filter(bill => bill.payment_status === 'paid')
      .reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0) || 0
    const unpaidAmount = data
      ?.filter(bill => bill.payment_status === 'unpaid')
      .reduce((sum, bill) => sum + parseFloat(bill.total_amount || 0), 0) || 0

    res.json({
      success: true,
      data: {
        totalBills,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        paidAmount: parseFloat(paidAmount.toFixed(2)),
        unpaidAmount: parseFloat(unpaidAmount.toFixed(2))
      }
    })
  } catch (error) {
    console.error('Error fetching supplier bills summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier bills summary'
    })
  }
})

// GET /api/supplier-bills/:id - Get single supplier bill
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('supplier_bills')
      .select(`
        *,
        supplier_bill_items (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Supplier bill not found'
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching supplier bill:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier bill'
    })
  }
})

// POST /api/supplier-bills - Create new supplier bill
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      supplier_name,
      bill_date,
      items,
      payment_status = 'unpaid',
      notes
    } = req.body

    // Validation
    if (!supplier_name || supplier_name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Supplier name is required'
      })
    }

    if (!bill_date) {
      return res.status(400).json({
        success: false,
        error: 'Bill date is required'
      })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bill must contain at least one item'
      })
    }

    // Validate items
    for (const item of items) {
      if (!item.product_name || item.product_name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Each item must have a product name'
        })
      }
      
      const quantity = parseFloat(item.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quantity for item'
        })
      }
      
      const unitPrice = parseFloat(item.unit_price)
      if (isNaN(unitPrice) || unitPrice < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid unit price for item'
        })
      }
    }

    // Calculate total amount
    const total_amount = parseFloat(items.reduce((total, item) => {
      return total + (parseFloat(item.quantity) * parseFloat(item.unit_price))
    }, 0).toFixed(2))

    const billData = {
      supplier_name: supplier_name.trim(),
      bill_date,
      total_amount,
      payment_status,
      notes: notes ? notes.trim() : null
    }

    // Create bill
    const { data: bill, error: billError } = await supabase
      .from('supplier_bills')
      .insert([billData])
      .select()
      .single()

    if (billError) {
      console.error('Supabase error creating bill:', billError)
      throw billError
    }

    // Create bill items
    const billItems = items.map(item => ({
      bill_id: bill.id,
      product_name: item.product_name.trim(),
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat((parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2)),
      notes: item.notes ? item.notes.trim() : null
    }))

    const { error: itemsError } = await supabase
      .from('supplier_bill_items')
      .insert(billItems)

    if (itemsError) {
      console.error('Supabase error creating bill items:', itemsError)
      throw itemsError
    }

    // Fetch complete bill with items
    const { data: completeBill, error: fetchError } = await supabase
      .from('supplier_bills')
      .select(`
        *,
        supplier_bill_items (*)
      `)
      .eq('id', bill.id)
      .single()

    if (fetchError) {
      console.error('Supabase error fetching complete bill:', fetchError)
      throw fetchError
    }

    res.status(201).json({
      success: true,
      data: completeBill,
      message: 'Supplier bill created successfully'
    })
  } catch (error) {
    console.error('Error creating supplier bill:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create supplier bill'
    })
  }
})

// PUT /api/supplier-bills/:id/payment-status - Update payment status
router.put('/:id/payment-status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { payment_status } = req.body

    // Validate payment status
    if (!payment_status || !['paid', 'unpaid'].includes(payment_status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment status. Must be "paid" or "unpaid"'
      })
    }

    const updateData = {
      payment_status,
      updated_at: new Date().toISOString()
    }

    // Set paid_date only when marking as paid
    if (payment_status === 'paid') {
      updateData.paid_date = new Date().toISOString().split('T')[0]
    } else {
      updateData.paid_date = null
    }

    const { data, error } = await supabase
      .from('supplier_bills')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        supplier_bill_items (*)
      `)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Supplier bill not found'
      })
    }

    res.json({
      success: true,
      data: data[0],
      message: `Bill marked as ${payment_status} successfully`
    })
  } catch (error) {
    console.error('Error updating payment status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update payment status'
    })
  }
})

export default router