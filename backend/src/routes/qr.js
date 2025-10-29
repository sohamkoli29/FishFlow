import express from 'express'
import QRCode from 'qrcode'

const router = express.Router()

// GET /api/qr/menu - Generate QR code for menu page
router.get('/menu', async (req, res) => {
  try {
    const menuUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/menu`
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0ea5e9',
        light: '#ffffff'
      }
    })

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl,
        menuUrl: menuUrl
      }
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    })
  }
})

export default router