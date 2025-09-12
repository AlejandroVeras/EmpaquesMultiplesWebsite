import { z } from 'zod'

// Custom error messages in Spanish
const errorMessages = {
  required: 'Este campo es obligatorio',
  invalidEmail: 'Ingresa un email válido',
  minLength: (min) => `Debe tener al menos ${min} caracteres`,
  maxLength: (max) => `Debe tener máximo ${max} caracteres`,
  invalidDate: 'Fecha inválida',
  invalidTime: 'Hora inválida',
  futureDateNotAllowed: 'No se pueden registrar fechas futuras',
  pastDateLimit: 'No se pueden registrar fechas anteriores a 30 días'
}

// Validation schema for lunch registration
export const lunchRegistrationSchema = z.object({
  user_id: z.string()
    .min(1, errorMessages.required)
    .uuid('ID de usuario inválido'),
  
  date: z.string()
    .min(1, errorMessages.required)
    .refine((dateStr) => {
      const date = new Date(dateStr)
      const today = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(today.getDate() - 30)
      
      // Reset time for comparison
      today.setHours(23, 59, 59, 999)
      thirtyDaysAgo.setHours(0, 0, 0, 0)
      
      return date <= today && date >= thirtyDaysAgo
    }, {
      message: 'La fecha debe estar entre los últimos 30 días y hoy'
    }),
  
  time: z.string()
    .min(1, errorMessages.required)
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  
  comments: z.string()
    .max(500, errorMessages.maxLength(500))
    .optional()
})

// Validation for user search
export const userSearchSchema = z.object({
  searchTerm: z.string()
    .max(100, errorMessages.maxLength(100))
    .optional()
})

// Validation for admin forms
export const userFormSchema = z.object({
  full_name: z.string()
    .min(2, errorMessages.minLength(2))
    .max(100, errorMessages.maxLength(100)),
  
  email: z.string()
    .email(errorMessages.invalidEmail),
  
  department_id: z.string()
    .optional(),
  
  role: z.enum(['user', 'admin', 'rrhh', 'recepcion'], {
    errorMap: () => ({ message: 'Rol inválido' })
  }),
  
  active: z.boolean()
})

export const departmentFormSchema = z.object({
  name: z.string()
    .min(2, errorMessages.minLength(2))
    .max(100, errorMessages.maxLength(100)),
  
  active: z.boolean()
})

// Input sanitization functions
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000) // Limit length
}

export const sanitizeFormData = (data) => {
  const sanitized = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

// Validation helper function
export const validateForm = (schema, data) => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = {}
      error.errors.forEach((err) => {
        const field = err.path.join('.')
        formattedErrors[field] = err.message
      })
      return { success: false, data: null, errors: formattedErrors }
    }
    return { success: false, data: null, errors: { general: 'Error de validación desconocido' } }
  }
}