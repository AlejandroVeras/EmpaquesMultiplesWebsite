import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { db, addToSyncQueue, syncOfflineData } from '../lib/offline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Wifi, WifiOff, Search, User, Clock, MessageCircle, Calendar, Utensils, Edit2, Trash2 } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

function LunchRegistration() {
  const { user, profile, canViewAllRecords } = useAuth()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    user_id: '',
    menu: '',
    comments: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm')
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState([])
  const [menuTypes, setMenuTypes] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [todayRecords, setTodayRecords] = useState([])
  const [editingRecord, setEditingRecord] = useState(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineData(supabase)
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (canViewAllRecords) {
      fetchUsers()
    } else {
      // For regular users, set their own ID
      setFormData(prev => ({ ...prev, user_id: user.id }))
    }
    fetchMenuTypes()
    fetchTodayRecords()
  }, [canViewAllRecords, user])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.departments?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          departments (
            name
          )
        `)
        .eq('active', true)
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchMenuTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_types')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setMenuTypes(data || [])
    } catch (error) {
      console.error('Error fetching menu types:', error)
    }
  }

  const fetchTodayRecords = async () => {
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
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      
      setTodayRecords(data || [])
    } catch (error) {
      console.error('Error fetching today records:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate form data
      if (!formData.user_id) {
        throw new Error('Debes seleccionar un usuario')
      }

      // Check for duplicates today
      const today = format(new Date(), 'yyyy-MM-dd')
      const existingRecord = todayRecords.find(r => 
        r.user_id === formData.user_id && r.date === today
      )

      if (existingRecord) {
        throw new Error('Este usuario ya tiene un registro de almuerzo para hoy')
      }

      const recordData = {
        user_id: formData.user_id,
        date: formData.date,
        time: formData.time,
        menu: formData.menu || null,
        comments: formData.comments || null,
        created_by: user.id
      }

      if (editingRecord) {
        // Update existing record
        if (isOnline) {
          const { error } = await supabase
            .from('lunch_records')
            .update({
              date: formData.date,
              time: formData.time,
              menu: formData.menu || null,
              comments: formData.comments || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingRecord.id)

          if (error) throw error
          setSuccess('¡Registro de almuerzo actualizado exitosamente!')
        } else {
          // Offline update - add to sync queue
          await addToSyncQueue('update', 'lunch_records', {
            ...recordData,
            id: editingRecord.id
          })
          setSuccess('¡Registro actualizado offline! Se sincronizará cuando tengas conexión.')
        }
      } else {
        // Create new record
        if (isOnline) {
          // Online: save directly to Supabase
          const { error } = await supabase
            .from('lunch_records')
            .insert([recordData])

          if (error) throw error
          
          setSuccess('¡Registro de almuerzo guardado exitosamente!')
        } else {
          // Offline: save to IndexedDB
          const offlineRecord = {
            ...recordData,
            id: crypto.randomUUID(),
            synced: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          await db.lunch_records.add(offlineRecord)
          await addToSyncQueue('insert', 'lunch_records', recordData)
          
          setSuccess('¡Registro guardado offline! Se sincronizará cuando tengas conexión.')
        }
      }

      // Reset form for next entry
      if (canViewAllRecords) {
        setFormData({
          user_id: '',
          menu: '',
          comments: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          time: format(new Date(), 'HH:mm')
        })
        setSearchTerm('')
        setShowUserSearch(false)
      } else {
        setFormData(prev => ({
          ...prev,
          menu: '',
          comments: '',
          time: format(new Date(), 'HH:mm')
        }))
      }

      setEditingRecord(null)
      fetchTodayRecords()
      
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const selectUser = (user) => {
    setFormData(prev => ({ ...prev, user_id: user.id }))
    setSearchTerm(user.full_name || '')
    setShowUserSearch(false)
  }

  const editRecord = (record) => {
    setEditingRecord(record)
    setFormData({
      user_id: record.user_id,
      menu: record.menu || '',
      comments: record.comments || '',
      date: record.date,
      time: record.time
    })
    
    if (canViewAllRecords) {
      const user = users.find(u => u.id === record.user_id)
      if (user) {
        setSearchTerm(user.full_name || '')
      }
    }
  }

  const cancelEdit = () => {
    setEditingRecord(null)
    setFormData({
      user_id: canViewAllRecords ? '' : user.id,
      menu: '',
      comments: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm')
    })
    setSearchTerm('')
    setShowUserSearch(false)
  }

  const cancelRecord = async (recordId) => {
    if (!confirm('¿Estás seguro de que quieres cancelar este registro?')) {
      return
    }

    try {
      setLoading(true)
      setError('')

      if (isOnline) {
        const { error } = await supabase
          .from('lunch_records')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', recordId)

        if (error) throw error
        setSuccess('Registro cancelado exitosamente')
      } else {
        await addToSyncQueue('update', 'lunch_records', {
          id: recordId,
          status: 'cancelled'
        })
        setSuccess('Registro cancelado offline! Se sincronizará cuando tengas conexión.')
      }

      fetchTodayRecords()
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedUser = users.find(u => u.id === formData.user_id)

  if (loading && !formData.user_id) {
    return <LoadingSpinner message="Cargando formulario..." />
  }

  return (
    <div className="grid gap-6">
      {/* Connection Status */}
      <div className={`alert ${isOnline ? 'alert-success' : 'alert-warning'}`}>
        {isOnline ? (
          <>
            <Wifi size={20} />
            Conectado - Los registros se guardan inmediatamente
          </>
        ) : (
          <>
            <WifiOff size={20} />
            Sin conexión - Los registros se guardarán localmente y se sincronizarán cuando tengas conexión
          </>
        )}
      </div>

      {/* Registration Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {editingRecord ? <Edit2 size={24} /> : <Plus size={24} />}
            {editingRecord ? 'Editar Registro de Almuerzo' : 'Registrar Almuerzo'}
          </h2>
          {editingRecord && (
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={cancelEdit}
            >
              Cancelar Edición
            </button>
          )}
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={16} />
                  Fecha
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={16} />
                  Hora
                </label>
                <input
                  type="time"
                  className="form-input"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* User Selection */}
            {canViewAllRecords ? (
              <div className="form-group">
                <label className="form-label">
                  <User size={16} />
                  Usuario
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Buscar usuario..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowUserSearch(true)
                      }}
                      onFocus={() => setShowUserSearch(true)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ minWidth: 'auto', padding: '0.75rem' }}
                      onClick={() => setShowUserSearch(!showUserSearch)}
                    >
                      <Search size={16} />
                    </button>
                  </div>
                  
                  {selectedUser && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.75rem', 
                      background: 'var(--verde-claro)', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <User size={16} style={{ color: 'var(--verde)' }} />
                      <span style={{ fontWeight: '600', color: 'var(--verde-oscuro)' }}>
                        {selectedUser.full_name}
                      </span>
                      {selectedUser.departments?.name && (
                        <span style={{ 
                          background: 'var(--verde)', 
                          color: 'var(--blanco)', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '12px',
                          fontSize: '0.75rem'
                        }}>
                          {selectedUser.departments.name}
                        </span>
                      )}
                    </div>
                  )}

                  {showUserSearch && filteredUsers.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--blanco)',
                      border: '2px solid var(--borde-verde)',
                      borderRadius: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10,
                      marginTop: '0.25rem'
                    }}>
                      {filteredUsers.map(user => (
                        <div
                          key={user.id}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--borde-verde)',
                            transition: 'background 0.2s'
                          }}
                          onClick={() => selectUser(user)}
                          onMouseEnter={(e) => e.target.style.background = 'var(--verde-claro)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          <div style={{ fontWeight: '600' }}>{user.full_name}</div>
                          {user.departments?.name && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--gris-medio)' }}>
                              {user.departments.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="form-group">
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'var(--verde-claro)', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <User size={16} style={{ color: 'var(--verde)' }} />
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
                <Utensils size={16} />
                Tipo de Menú
              </label>
              <select
                className="form-select"
                value={formData.menu}
                onChange={(e) => setFormData(prev => ({ ...prev, menu: e.target.value }))}
                required
              >
                <option value="">Seleccionar tipo de menú...</option>
                {menuTypes.map(menu => (
                  <option key={menu.id} value={menu.name}>
                    {menu.name} {menu.description && `- ${menu.description}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <MessageCircle size={16} />
                Comentarios (opcional)
              </label>
              <textarea
                className="form-textarea"
                placeholder="Comentarios adicionales..."
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                rows={3}
              />
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || (!canViewAllRecords ? false : !formData.user_id) || !formData.menu}
            >
              {loading ? 'Guardando...' : editingRecord ? 'Actualizar Registro' : 'Registrar Almuerzo'}
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
          {todayRecords.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gris-medio)', padding: '2rem' }}>
              No hay registros para hoy
            </p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    {canViewAllRecords && <th>Usuario</th>}
                    {canViewAllRecords && <th>Departamento</th>}
                    <th>Menú</th>
                    <th>Comentarios</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {todayRecords.map((record) => (
                    <tr key={record.id} style={{ 
                      opacity: record.status === 'cancelled' ? 0.6 : 1 
                    }}>
                      <td>{record.time}</td>
                      {canViewAllRecords && <td>{record.profiles?.full_name || 'N/A'}</td>}
                      {canViewAllRecords && <td>{record.profiles?.departments?.name || 'N/A'}</td>}
                      <td>{record.menu || '-'}</td>
                      <td>{record.comments || '-'}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: record.status === 'cancelled' ? '#fee' : '#efe',
                          color: record.status === 'cancelled' ? '#c33' : '#393'
                        }}>
                          {record.status === 'cancelled' ? 'Cancelado' : 'Activo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {record.status !== 'cancelled' && (
                            canViewAllRecords || record.user_id === user.id
                          ) && (
                            <>
                              <button
                                className="btn btn-small btn-secondary"
                                onClick={() => editRecord(record)}
                                title="Editar registro"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => cancelRecord(record.id)}
                                title="Cancelar registro"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LunchRegistration