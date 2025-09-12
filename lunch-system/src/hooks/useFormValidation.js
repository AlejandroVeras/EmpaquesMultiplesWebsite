import { useState, useCallback } from 'react'
import { validateForm, sanitizeFormData } from '../lib/validation'

export const useFormValidation = (schema, initialData = {}) => {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touchedFields, setTouchedFields] = useState(new Set())

  // Update field value with sanitization
  const updateField = useCallback((field, value) => {
    const sanitizedValue = typeof value === 'string' ? value.trim() : value
    
    setData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }))

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // Mark field as touched for validation
  const touchField = useCallback((field) => {
    setTouchedFields(prev => new Set([...prev, field]))
  }, [])

  // Validate single field
  const validateField = useCallback((field, value) => {
    try {
      const fieldSchema = schema.pick({ [field]: true })
      fieldSchema.parse({ [field]: value })
      
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      
      return true
    } catch (error) {
      if (error.errors && error.errors.length > 0) {
        setErrors(prev => ({
          ...prev,
          [field]: error.errors[0].message
        }))
      }
      return false
    }
  }, [schema])

  // Validate all fields
  const validate = useCallback(() => {
    const sanitizedData = sanitizeFormData(data)
    const result = validateForm(schema, sanitizedData)
    
    if (!result.success) {
      setErrors(result.errors || {})
      return false
    }
    
    setErrors({})
    return true
  }, [data, schema])

  // Submit handler with validation
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true)
    
    try {
      const sanitizedData = sanitizeFormData(data)
      const result = validateForm(schema, sanitizedData)
      
      if (!result.success) {
        setErrors(result.errors || {})
        return { success: false, errors: result.errors }
      }
      
      setErrors({})
      const submitResult = await onSubmit(result.data)
      return { success: true, data: submitResult }
      
    } catch (error) {
      const errorMessage = error.message || 'Error al enviar el formulario'
      setErrors({ general: errorMessage })
      return { success: false, errors: { general: errorMessage } }
    } finally {
      setIsSubmitting(false)
    }
  }, [data, schema])

  // Reset form
  const reset = useCallback((newData = initialData) => {
    setData(newData)
    setErrors({})
    setTouchedFields(new Set())
    setIsSubmitting(false)
  }, [initialData])

  // Get field props for easy integration
  const getFieldProps = useCallback((field) => ({
    value: data[field] || '',
    onChange: (e) => {
      const value = e.target ? e.target.value : e
      updateField(field, value)
    },
    onBlur: () => {
      touchField(field)
      if (touchedFields.has(field) && data[field]) {
        validateField(field, data[field])
      }
    },
    error: errors[field],
    touched: touchedFields.has(field)
  }), [data, errors, touchedFields, updateField, touchField, validateField])

  return {
    data,
    errors,
    isSubmitting,
    touchedFields,
    updateField,
    touchField,
    validateField,
    validate,
    handleSubmit,
    reset,
    getFieldProps,
    hasErrors: Object.keys(errors).length > 0,
    isValid: Object.keys(errors).length === 0 && Object.keys(data).length > 0
  }
}