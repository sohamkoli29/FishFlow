import express from 'express'
import { supabase } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// POST /api/upload/image - Upload product image
router.post('/image', requireAuth, async (req, res) => {
  try {
    const { imageData, fileName } = req.body

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      })
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to Supabase Storage
    const fileExt = fileName?.split('.').pop() || 'jpg'
    const filePath = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    res.json({
      success: true,
      data: {
        imageUrl: publicUrl,
        filePath: filePath
      }
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    })
  }
})

export default router