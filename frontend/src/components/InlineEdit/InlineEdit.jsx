import React, { useState } from 'react'
import './InlineEdit.css'

const InlineEdit = ({
  value,
  onSave,
  type = 'text',
  placeholder = '',
  className = '',
  inputClassName = '',
  validate = null
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStartEdit = () => {
    setEditValue(value)
    setIsEditing(true)
    setError('')
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    setError('')
  }

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    // Validation
    if (validate) {
      const validationError = validate(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setLoading(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={`inline-edit ${className}`}>
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className={`inline-edit-input ${inputClassName} ${error ? 'error' : ''}`}
          placeholder={placeholder}
          disabled={loading}
          autoFocus
        />
        {error && <div className="inline-edit-error">{error}</div>}
        <div className="inline-edit-actions">
          <button
            className="inline-edit-btn save-btn"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '...' : '✓'}
          </button>
          <button
            className="inline-edit-btn cancel-btn"
            onClick={handleCancel}
            disabled={loading}
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`inline-edit-display ${className}`}
      onClick={handleStartEdit}
      title="Click to edit"
    >
      {value || placeholder}
      <span className="edit-indicator">✏️</span>
    </div>
  )
}

export default InlineEdit