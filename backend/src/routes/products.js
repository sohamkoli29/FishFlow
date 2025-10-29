import express from 'express'
import { supabase } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// GET /api/products - Get all products (public route)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')

    if (error) throw error

    res.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    })
  }
})

// GET /api/products/:id - Get single product (public route)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    })
  }
})

// POST /api/products - Create new product (admin only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, price, image_url, is_available = true } = req.body

    // Basic validation
    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name and price are required'
      })
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      image_url,
      is_available: Boolean(is_available)
    }

    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()

    if (error) throw error

    res.status(201).json({
      success: true,
      data: data[0]
    })
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    })
  }
})

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, image_url, is_available } = req.body

    const updateData = {}
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (image_url !== undefined) updateData.image_url = image_url
    if (is_available !== undefined) updateData.is_available = Boolean(is_available)
    
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      })
    }

    res.json({
      success: true,
      data: data[0]
    })
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    })
  }
})

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    })
  }
})

export default router