import React, { useState, useEffect, memo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useFormValidation } from '../hooks/useFormValidation'
import { 
  db, 
  syncOfflineData, 
  saveLunchRecordOffline, 
  getCachedUserData, 
  cacheUserData 
} from '../lib/offline'
import { lunchRegistrationSchema } from '../lib/validation'
import { checkFormSubmissionRate, recordFormSubmission, getRateLimitMessage } from '../lib/rateLimiter'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Clock, MessageCircle, Calendar, CheckCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import UserSearch from '../components/UserSearch'
import SyncStatus from '../components/SyncStatus'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'

const TodayRecordsTable = memo(({ records, canViewAllRecords }) => {
  if (records.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--gris-medio)', padding: '2rem' }}>
        No hay registros para hoy
      </p>
    )
  }

  return (
    <>
      {/* Desktop/Tablet Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Hora</th>
              {canViewAllRecords && <th>Usuario</th>}
              {canViewAllRecords && <th>Departamento</th>}
              <th>Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.time}</td>
                {canViewAllRecords && <td>{record.profiles?.full_name || 'N/A'}</td>}
                {canViewAllRecords && <td>{record.profiles?.departments?.name || 'N/A'}</td>}
                <td>{record.comments || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="table-mobile">
        {records.map((record) => (
          <div key={record.id} className="table-mobile-item">
            <div className="table-mobile-row">
              <span className="table-mobile-label">Hora:</span>
              <span className="table-mobile-value">{record.time}</span>
            </div>
            
            {canViewAllRecords && (
              <>
                <div className="table-mobile-row">
                  <span className="table-mobile-label">Usuario:</span>
                  <span className="table-mobile-value">{record.profiles?.full_name || 'N/A'}</span>
                </div>
                
                <div className="table-mobile-row">
                  <span className="table-mobile-label">Departamento:</span>
                  <span className="table-mobile-value">{record.profiles?.departments?.name || 'N/A'}</span>
                </div>
              </>
            )}
            
            <div className="table-mobile-row">
              <span className="table-mobile-label">Comentarios:</span>
              <span className="table-mobile-value">{record.comments || '-'}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
})

TodayRecordsTable.displayName = 'TodayRecordsTable'

function LunchRegistration() {
  const { user, profile, canViewAllRecords } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [todayRecords, setTodayRecords] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [submissionData, setSubmissionData] = useState(null)

  // Form validation with initial data
  const initialFormData = {
    user_id: canViewAllRecords ? '' : (user?.id || ''),
    comments: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm')
  }

  const {
    data: formData,
    errors,
    isSubmitting,
    handleSubmit,
    updateField,
    reset,
    getFieldProps
  } = useFormValidation(lunchRegistrationSchema, initialFormData)

  // Network status handlers
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Conexión restaurada. Sincronizando datos...')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Sin conexión. Los datos se guardarán localmente.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load initial data
  useEffect(() => {
    if (canViewAllRecords) {
      fetchUsers()
    } else {
      // For regular users, set their own ID
      updateField('user_id', user?.id || '')
      setSelectedUser({ 
        id: user?.id, 
        full_name: profile?.full_name, 
        departments: profile?.departments 
      })
    }
    fetchTodayRecords()
  }, [canViewAllRecords, user, profile])

  // Cached user fetching with optimization
  const fetchUsers = useCallback(async () => {
    try {
      // Try to get cached data first
      const cachedUsers = await getCachedUserData(30) // 30 minutes cache
      
      if (cachedUsers && isOnline) {
        setUsers(cachedUsers)
      }

      // Always fetch fresh data if online
      if (isOnline) {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            departments (
              name
            )
          `)
          .eq('active', true)
          .order('full_name')

        if (error) throw error
        
        const userData = data || []
        setUsers(userData)
        
        // Cache the fresh data
        await cacheUserData(userData)
      } else if (cachedUsers) {
        // Use cached data when offline
        setUsers(cachedUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error al cargar usuarios: ' + error.message)
    }
  }, [isOnline])

  const fetchTodayRecords = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      
      let query = supabase
        .from('lunch_records')
        .select(`
          *,
          profiles!lunch_records_user_id_fkey (
            full_name,
            departments (
              name
            )
          )
        `)
        .eq('date', today)
        .order('time', { ascending: false })

      if (!canViewAllRecords) {
        query = query.eq('user_id', user?.id)
      }

      const { data, error } = await query
      if (error) throw error
      
      setTodayRecords(data || [])
    } catch (error) {
      console.error('Error fetching today records:', error)
      if (isOnline) {
        toast.error('Error al cargar registros: ' + error.message)
      }
    }
  }, [canViewAllRecords, user?.id, isOnline])

  const checkForDuplicates = useCallback((userId, date) => {
    return todayRecords.find(r => 
      r.user_id === userId && r.date === date
    )
  }, [todayRecords])

  const onSubmit = async (validatedData) => {
    try {
      // Check rate limiting
      const rateCheck = checkFormSubmissionRate(user.id)
      if (rateCheck.limited) {
        throw new Error(getRateLimitMessage(rateCheck.retryAfter))
      }

      // Record the submission attempt
      recordFormSubmission(user.id)

      // Check for duplicates
      const existingRecord = checkForDuplicates(validatedData.user_id, validatedData.date)
      
      if (existingRecord) {
        throw new Error('Este usuario ya tiene un registro de almuerzo para esta fecha')
      }

      const recordData = {
        ...validatedData,
        created_by: user.id
      }

      if (isOnline) {
        // Online: save directly to Supabase
        const { error } = await supabase
          .from('lunch_records')
          .insert([recordData])

        if (error) throw error
        
        toast.success('¡Registro de almuerzo guardado exitosamente!')
      } else {
        // Offline: save to IndexedDB
        await saveLunchRecordOffline(recordData)
        toast.success('¡Registro guardado offline! Se sincronizará cuando tengas conexión.')
      }

      // Reset form for next entry
      if (canViewAllRecords) {
        reset({
          user_id: '',
          comments: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          time: format(new Date(), 'HH:mm')
        })
        setSelectedUser(null)
      } else {
        reset({
          ...formData,
          comments: '',
          time: format(new Date(), 'HH:mm')
        })
      }

      await fetchTodayRecords()
      
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    // Show confirmation dialog for important submission
    setSubmissionData(formData)
    setShowConfirmDialog(true)
  }

  const handleConfirmSubmission = async () => {
    setShowConfirmDialog(false)
    
    try {
      await handleSubmit(onSubmit)
    } catch (error) {
      // Error already handled in onSubmit
    }
  }

  const handleUserSelect = useCallback((user) => {
    setSelectedUser(user)
    updateField('user_id', user.id)
  }, [updateField])

  const handleUserClear = useCallback(() => {
    setSelectedUser(null)
    updateField('user_id', '')
  }, [updateField])

  const handleSyncComplete = useCallback((results) => {
    if (results.success > 0) {
      toast.success(`${results.success} elementos sincronizados correctamente`)
      fetchTodayRecords()
    }
    
    if (results.failed > 0) {
      toast.error(`${results.failed} elementos fallaron al sincronizar`)
    }
  }, [fetchTodayRecords])

  if (loading && !formData.user_id) {
    return <LoadingSpinner message="Cargando formulario..." />
  }

  return (
    <div className="grid gap-6">
      {/* Connection and Sync Status */}
      <SyncStatus 
        isOnline={isOnline}
        supabase={supabase}
        onSyncComplete={handleSyncComplete}
      />

      {/* Registration Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Plus size={24} />
            Registrar Almuerzo
          </h2>
        </div>
        <div className="card-content">
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} />
                  Fecha <span style={{ color: 'var(--rojo)' }}>*</span>
                </label>
                <input
                  type="date"
                  className={`form-input ${errors.date ? 'error' : ''}`}
                  {...getFieldProps('date')}
                  required
                />
                {errors.date && (
                  <div className="form-error">{errors.date}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={16} />
                  Hora <span style={{ color: 'var(--rojo)' }}>*</span>
                </label>
                <input
                  type="time"
                  className={`form-input ${errors.time ? 'error' : ''}`}
                  {...getFieldProps('time')}
                  required
                />
                {errors.time && (
                  <div className="form-error">{errors.time}</div>
                )}
              </div>
            </div>

            {/* User Selection */}
            {canViewAllRecords ? (
              <UserSearch
                users={users}
                selectedUser={selectedUser}
                onSelectUser={handleUserSelect}
                onClear={handleUserClear}
                error={errors.user_id}
                required={true}
                disabled={isSubmitting}
              />
            ) : (
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} />
                  Usuario
                </label>
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'var(--verde-claro)', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={16} style={{ color: 'var(--verde)' }} />
                  <span style={{ fontWeight: '600', color: 'var(--verde-oscuro)' }}>
                    {profile?.full_name || user?.email}
                  </span>
                  {profile?.departments?.name && (
                    <span style={{ 
                      background: 'var(--verde)', 
                      color: 'var(--blanco)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '12px',
                      fontSize: '0.75rem'
                    }}>
                      {profile.departments.name}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <MessageCircle size={16} />
                Comentarios (opcional)
              </label>
              <textarea
                className={`form-textarea ${errors.comments ? 'error' : ''}`}
                placeholder="Comentarios adicionales..."
                {...getFieldProps('comments')}
                rows={3}
                maxLength={500}
              />
              {errors.comments && (
                <div className="form-error">{errors.comments}</div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--gris-medio)', marginTop: '0.25rem' }}>
                {formData.comments?.length || 0}/500 caracteres
              </div>
            </div>

            {errors.general && (
              <div className="alert alert-error">
                {errors.general}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || (!canViewAllRecords ? false : !formData.user_id)}
            >
              {isSubmitting ? 'Guardando...' : 'Registrar Almuerzo'}
            </button>
          </form>
        </div>
      </div>

      {/* Today's Records */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Registros de Hoy ({todayRecords.length})</h3>
        </div>
        <div className="card-content">
          <TodayRecordsTable 
            records={todayRecords}
            canViewAllRecords={canViewAllRecords}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmSubmission}
        title="Confirmar registro de almuerzo"
        message={`¿Confirmas el registro de almuerzo para ${selectedUser?.full_name || profile?.full_name || 'el usuario seleccionado'}?`}
        type="info"
        confirmText="Registrar"
        cancelText="Cancelar"
        loading={isSubmitting}
      />
    </div>
  )
}

export default memo(LunchRegistration)