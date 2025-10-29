import express from 'express'
import { supabase } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/suppliers - Get all suppliers
router.get('/', async (req, res) => {
  try {
    const { active } = req.query
    
    let query = supabase
      .from('suppliers')
      .select('*')
      .order('name')

    // Filter by active status if provided
    if (active !== undefined) {
      query = query.eq('is_active', active === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suppliers'
    })
  }
})

// GET /api/suppliers/:id - Get single supplier
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier'
    })
  }
})

// POST /api/suppliers - Create new supplier
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, notes, is_active = true } = req.body

    // Basic validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Supplier name is required'
      })
    }

    const supplierData = {
      name: name.trim(),
      contact_person: contact_person ? contact_person.trim() : null,
      phone: phone ? phone.trim() : null,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      notes: notes ? notes.trim() : null,
      is_active: Boolean(is_active)
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select()

    if (error) throw error

    res.status(201).json({
      success: true,
      data: data[0]
    })
  } catch (error) {
    console.error('Error creating supplier:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create supplier'
    })
  }
})

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { name, contact_person, phone, email, address, notes, is_active } = req.body

    const updateData = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (contact_person !== undefined) updateData.contact_person = contact_person ? contact_person.trim() : null
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null
    if (email !== undefined) updateData.email = email ? email.trim() : null
    if (address !== undefined) updateData.address = address ? address.trim() : null
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null
    if (is_active !== undefined) updateData.is_active = Boolean(is_active)
    
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      })
    }

    res.json({
      success: true,
      data: data[0]
    })
  } catch (error) {
    console.error('Error updating supplier:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update supplier'
    })
  }
})

export default router