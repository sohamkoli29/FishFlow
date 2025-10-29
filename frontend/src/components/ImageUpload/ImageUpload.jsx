import React, { useState, useRef } from 'react'
import { api } from '../../utils/api'
import './ImageUpload.css'

const ImageUpload = ({ 
  currentImage = '', 
  onImageChange, 
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showCameraModal, setShowCameraModal] = useState(false)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleImageUpload = async (file) => {
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file)
      
      // Upload to server
      const result = await api.uploadImage(base64, file.name)
      
      if (result.success) {
        onImageChange(result.data.imageUrl)
      } else {
        setError(result.error || 'Failed to upload image')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (disabled || uploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files[0])
    }
  }

  const handleRemoveImage = () => {
    onImageChange('')
  }

  const handleClickUpload = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }

  // Camera functions
  const startCamera = async () => {
    try {
      setShowCameraModal(true)
      
      // Wait for modal to show before starting camera
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment', // Prefer rear camera on mobile
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          })
          
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        } catch (err) {
          console.error('Error accessing camera:', err)
          setError('Cannot access camera. Please check permissions.')
          setShowCameraModal(false)
        }
      }, 100)
    } catch (err) {
      console.error('Error starting camera:', err)
      setError('Camera not supported on this device')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCameraModal(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob and create file
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        })
        
        stopCamera()
        await handleImageUpload(file)
      }
    }, 'image/jpeg', 0.8) // 80% quality
  }

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const hasCamera = () => {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  }

  return (
    <div className="image-upload">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="file-input"
        disabled={disabled || uploading}
        capture="environment" // This enables camera on mobile when file input is clicked
      />
      
      {currentImage ? (
        <div className="image-preview">
          <img src={currentImage} alt="Product preview" className="preview-image" />
          <div className="image-actions">
            <button
              type="button"
              className="btn btn-small btn-secondary"
              onClick={handleClickUpload}
              disabled={disabled || uploading}
            >
              {uploading ? 'Uploading...' : 'Change'}
            </button>
            {isMobile() && hasCamera() && (
              <button
                type="button"
                className="btn btn-small btn-primary"
                onClick={startCamera}
                disabled={disabled || uploading}
              >
                📷 Camera
              </button>
            )}
            <button
              type="button"
              className="btn btn-small btn-danger"
              onClick={handleRemoveImage}
              disabled={disabled || uploading}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div 
          className={`upload-area ${uploading ? 'uploading' : ''} ${error ? 'error' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="uploading-content">
              <div className="upload-spinner"></div>
              <p>Uploading image...</p>
            </div>
          ) : (
            <div className="upload-options">
              <div className="upload-option" onClick={handleClickUpload}>
                <div className="upload-icon">📁</div>
                <p>Choose from Gallery</p>
              </div>
              
              {isMobile() && hasCamera() && (
                <div className="upload-option" onClick={startCamera}>
                  <div className="upload-icon">📷</div>
                  <p>Take Photo</p>
                </div>
              )}
              
              <div className="upload-hint">
                <p>PNG, JPG up to 5MB</p>
                <p>or drag and drop</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="camera-modal-overlay">
          <div className="camera-modal">
            <div className="camera-header">
              <h3>Take Photo</h3>
              <button 
                className="close-btn"
                onClick={stopCamera}
              >
                ✕
              </button>
            </div>
            
            <div className="camera-preview">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="camera-controls">
              <button
                className="btn btn-primary capture-btn"
                onClick={capturePhoto}
              >
                📷 Capture
              </button>
              <button
                className="btn btn-secondary"
                onClick={stopCamera}
              >
                Cancel
              </button>
            </div>
            
            <div className="camera-help">
              <p>Point camera at the product and tap Capture</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload