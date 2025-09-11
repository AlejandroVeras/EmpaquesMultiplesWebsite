import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Building, UserPlus, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // User form state
  const [editingUser, setEditingUser] = useState(null)
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    department_id: '',
    role: 'user',
    active: true
  })
  
  // Department form state
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    active: true
  })

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          active,
          created_at,
          departments (
            id,
            name
          )
        `)
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Error al cargar usuarios')
    }
  }

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name')

      if (error) throw error
      setDepartments(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching departments:', error)
      setError('Error al cargar departamentos')
      setLoading(false)
    }
  }

  // User management functions
  const startEditUser = (user) => {
    setEditingUser(user.id)
    setUserForm({
      full_name: user.full_name || '',
      email: user.email || '',
      department_id: user.departments?.id || '',
      role: user.role || 'user',
      active: user.active
    })
  }

  const saveUser = async () => {
    setSaving(true)
    setError('')
    
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: userForm.full_name,
            department_id: userForm.department_id || null,
            role: userForm.role,
            active: userForm.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser)

        if (error) throw error
        setSuccess('Usuario actualizado exitosamente')
      } else {
        // Create new user (this would typically require inviting them via email)
        setError('La creación de nuevos usuarios debe hacerse mediante invitación por email')
      }
      
      setEditingUser(null)
      setUserForm({ full_name: '', email: '', department_id: '', role: 'user', active: true })
      await fetchUsers()
      
    } catch (error) {
      console.error('Error saving user:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const cancelEditUser = () => {
    setEditingUser(null)
    setUserForm({ full_name: '', email: '', department_id: '', role: 'user', active: true })
  }

  // Department management functions
  const startEditDepartment = (department) => {
    setEditingDepartment(department.id)
    setDepartmentForm({
      name: department.name,
      active: department.active
    })
  }

  const saveDepartment = async () => {
    setSaving(true)
    setError('')
    
    try {
      if (editingDepartment) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update({
            name: departmentForm.name,
            active: departmentForm.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDepartment)

        if (error) throw error
        setSuccess('Departamento actualizado exitosamente')
      } else {
        // Create new department
        const { error } = await supabase
          .from('departments')
          .insert([{
            name: departmentForm.name,
            active: departmentForm.active
          }])

        if (error) throw error
        setSuccess('Departamento creado exitosamente')
      }
      
      setEditingDepartment(null)
      setDepartmentForm({ name: '', active: true })
      await fetchDepartments()
      
    } catch (error) {
      console.error('Error saving department:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const cancelEditDepartment = () => {
    setEditingDepartment(null)
    setDepartmentForm({ name: '', active: true })
  }

  const deleteDepartment = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este departamento?')) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSuccess('Departamento eliminado exitosamente')
      await fetchDepartments()
    } catch (error) {
      console.error('Error deleting department:', error)
      setError('Error al eliminar departamento')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Cargando panel de administración..." />
  }

  return (
    <div className="grid gap-6">
      {/* Tab Navigation */}
      <div className="card">
        <div className="card-content" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={16} />
              Gestión de Usuarios
            </button>
            <button
              className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('departments')}
            >
              <Building size={16} />
              Gestión de Departamentos
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Users size={24} />
              Gestión de Usuarios
            </h2>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>Departamento</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Fecha de Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        {editingUser === user.id ? (
                          <input
                            type="text"
                            className="form-input"
                            value={userForm.full_name}
                            onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                            style={{ margin: 0 }}
                          />
                        ) : (
                          user.full_name || 'Sin nombre'
                        )}
                      </td>
                      <td>
                        {editingUser === user.id ? (
                          <select
                            className="form-select"
                            value={userForm.department_id}
                            onChange={(e) => setUserForm(prev => ({ ...prev, department_id: e.target.value }))}
                            style={{ margin: 0 }}
                          >
                            <option value="">Sin departamento</option>
                            {departments.filter(d => d.active).map(dept => (
                              <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                          </select>
                        ) : (
                          user.departments?.name || 'Sin departamento'
                        )}
                      </td>
                      <td>
                        {editingUser === user.id ? (
                          <select
                            className="form-select"
                            value={userForm.role}
                            onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                            style={{ margin: 0 }}
                          >
                            <option value="user">Usuario</option>
                            <option value="recepcion">Recepción</option>
                            <option value="rrhh">RRHH</option>
                            <option value="admin">Administrador</option>
                          </select>
                        ) : (
                          <span style={{
                            background: user.role === 'admin' ? '#dc3545' : 
                                       user.role === 'rrhh' ? '#fd7e14' :
                                       user.role === 'recepcion' ? '#0dcaf0' : 'var(--verde)',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingUser === user.id ? (
                          <input
                            type="checkbox"
                            checked={userForm.active}
                            onChange={(e) => setUserForm(prev => ({ ...prev, active: e.target.checked }))}
                          />
                        ) : (
                          <span style={{
                            background: user.active ? 'var(--success-bg)' : 'var(--error-bg)',
                            color: user.active ? 'var(--success-color)' : 'var(--error-color)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {user.active ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                      </td>
                      <td>
                        {new Date(user.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td>
                        {editingUser === user.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={saveUser}
                              className="btn btn-primary btn-small"
                              disabled={saving}
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={cancelEditUser}
                              className="btn btn-secondary btn-small"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditUser(user)}
                            className="btn btn-secondary btn-small"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="grid gap-6">
          {/* Add New Department */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Plus size={20} />
                {editingDepartment ? 'Editar Departamento' : 'Nuevo Departamento'}
              </h3>
            </div>
            <div className="card-content">
              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nombre del Departamento</label>
                  <input
                    type="text"
                    className="form-input"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre del departamento"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={departmentForm.active}
                      onChange={(e) => setDepartmentForm(prev => ({ ...prev, active: e.target.checked }))}
                    />
                    <span>Activo</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={saveDepartment}
                  className="btn btn-primary"
                  disabled={saving || !departmentForm.name.trim()}
                >
                  <Save size={16} />
                  {editingDepartment ? 'Actualizar' : 'Crear'} Departamento
                </button>
                {editingDepartment && (
                  <button
                    onClick={cancelEditDepartment}
                    className="btn btn-secondary"
                  >
                    <X size={16} />
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Departments List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Building size={20} />
                Lista de Departamentos
              </h3>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Estado</th>
                      <th>Fecha de Creación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((department) => (
                      <tr key={department.id}>
                        <td>{department.name}</td>
                        <td>
                          <span style={{
                            background: department.active ? 'var(--success-bg)' : 'var(--error-bg)',
                            color: department.active ? 'var(--success-color)' : 'var(--error-color)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {department.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          {new Date(department.created_at).toLocaleDateString('es-ES')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => startEditDepartment(department)}
                              className="btn btn-secondary btn-small"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => deleteDepartment(department.id)}
                              className="btn btn-danger btn-small"
                              disabled={saving}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel