import React, { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../hooks/useAuth'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Download, Calendar, Users, TrendingUp, Filter } from 'lucide-react'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import LoadingSpinner from '../LoadingSpinner'

function Dashboard() {
  const { profile, canViewAllRecords } = useAuth()
  const [records, setRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({
    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    department: '',
    user: ''
  })
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (canViewAllRecords) {
      fetchDepartments()
      fetchUsers()
    }
    fetchRecords()
  }, [canViewAllRecords])

  useEffect(() => {
    applyFilters()
  }, [records, filters])

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setDepartments(data || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, departments(name)')
        .eq('active', true)
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchRecords = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('lunch_records')
        .select(`
          *,
          profiles!lunch_records_user_id_fkey (
            id,
            full_name,
            departments (
              id,
              name
            )
          ),
          created_by_profile:profiles!lunch_records_created_by_fkey (
            full_name
          )
        `)
        .order('date', { ascending: false })
        .order('time', { ascending: false })

      // If not admin/rrhh/recepcion, only show own records
      if (!canViewAllRecords) {
        query = query.eq('user_id', profile.id)
      }

      // Limit to last 60 days for rrhh/recepcion as per requirements
      if (canViewAllRecords && profile.role !== 'admin') {
        const sixtyDaysAgo = format(subDays(new Date(), 60), 'yyyy-MM-dd')
        query = query.gte('date', sixtyDaysAgo)
      }

      const { data, error } = await query

      if (error) throw error
      setRecords(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = records.filter(record => {
      const recordDate = new Date(record.date)
      const fromDate = new Date(filters.dateFrom)
      const toDate = new Date(filters.dateTo)
      
      const dateMatch = recordDate >= fromDate && recordDate <= toDate
      const departmentMatch = !filters.department || 
        record.profiles?.departments?.id === filters.department
      const userMatch = !filters.user || record.user_id === filters.user
      
      return dateMatch && departmentMatch && userMatch
    })
    
    setFilteredRecords(filtered)
    calculateStats(filtered)
  }

  const calculateStats = (data) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const thisWeek = subDays(new Date(), 7)
    const thisMonth = subDays(new Date(), 30)

    const todayCount = data.filter(r => r.date === today).length
    const weekCount = data.filter(r => new Date(r.date) >= thisWeek).length
    const monthCount = data.filter(r => new Date(r.date) >= thisMonth).length

    // Daily stats for chart
    const dailyStats = {}
    data.forEach(record => {
      const date = record.date
      dailyStats[date] = (dailyStats[date] || 0) + 1
    })

    const chartData = Object.entries(dailyStats)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-30) // Last 30 days
      .map(([date, count]) => ({
        date: format(new Date(date), 'dd/MM', { locale: es }),
        count
      }))

    // Department stats
    const departmentStats = {}
    data.forEach(record => {
      const dept = record.profiles?.departments?.name || 'Sin departamento'
      departmentStats[dept] = (departmentStats[dept] || 0) + 1
    })

    setStats({
      today: todayCount,
      week: weekCount,
      month: monthCount,
      total: data.length,
      chartData,
      departmentStats: Object.entries(departmentStats).map(([name, count]) => ({
        name, count
      }))
    })
  }

  const exportToExcel = () => {
    const exportData = filteredRecords.map(record => ({
      'Fecha': record.date,
      'Hora': record.time,
      'Usuario': record.profiles?.full_name || 'N/A',
      'Departamento': record.profiles?.departments?.name || 'N/A',
      'Comentarios': record.comments || '',
      'Registrado por': record.created_by_profile?.full_name || 'N/A',
      'Fecha de registro': format(new Date(record.created_at), 'dd/MM/yyyy HH:mm')
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Registros de Almuerzo')
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    const fileName = `registros-almuerzo-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    saveAs(data, fileName)
  }

  if (loading) {
    return <LoadingSpinner message="Cargando estadísticas..." />
  }

  return (
    <div className="grid gap-6">
      {/* Stats Cards */}
      <div className="grid grid-4 gap-4">
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <Calendar size={32} style={{ color: 'var(--verde)', margin: '0 auto 0.5rem' }} />
            <h3 style={{ margin: '0', fontSize: '2rem', color: 'var(--verde)' }}>
              {stats.today}
            </h3>
            <p style={{ margin: '0', color: 'var(--gris-medio)' }}>Hoy</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <TrendingUp size={32} style={{ color: 'var(--verde)', margin: '0 auto 0.5rem' }} />
            <h3 style={{ margin: '0', fontSize: '2rem', color: 'var(--verde)' }}>
              {stats.week}
            </h3>
            <p style={{ margin: '0', color: 'var(--gris-medio)' }}>Esta semana</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <Users size={32} style={{ color: 'var(--verde)', margin: '0 auto 0.5rem' }} />
            <h3 style={{ margin: '0', fontSize: '2rem', color: 'var(--verde)' }}>
              {stats.month}
            </h3>
            <p style={{ margin: '0', color: 'var(--gris-medio)' }}>Este mes</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <Download size={32} style={{ color: 'var(--verde)', margin: '0 auto 0.5rem' }} />
            <h3 style={{ margin: '0', fontSize: '2rem', color: 'var(--verde)' }}>
              {stats.total}
            </h3>
            <p style={{ margin: '0', color: 'var(--gris-medio)' }}>Total</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Filter size={20} />
            Filtros
          </h3>
        </div>
        <div className="card-content">
          <div className="grid grid-4 gap-4">
            <div className="form-group">
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-input"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-input"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
            
            {canViewAllRecords && (
              <>
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <select
                    className="form-select"
                    value={filters.department}
                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Todos los departamentos</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Usuario</label>
                  <select
                    className="form-select"
                    value={filters.user}
                    onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                  >
                    <option value="">Todos los usuarios</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.full_name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <button onClick={exportToExcel} className="btn btn-primary">
              <Download size={16} />
              Exportar a Excel
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      {canViewAllRecords && (
        <div className="grid grid-2 gap-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Registros por día (últimos 30 días)</h3>
            </div>
            <div className="card-content">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--verde)" 
                    strokeWidth={2}
                    dot={{ fill: 'var(--verde)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Registros por departamento</h3>
            </div>
            <div className="card-content">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--verde)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Registros de Almuerzo ({filteredRecords.length})</h3>
        </div>
        <div className="card-content">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  {canViewAllRecords && <th>Usuario</th>}
                  {canViewAllRecords && <th>Departamento</th>}
                  <th>Comentarios</th>
                  <th>Registrado por</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={canViewAllRecords ? 6 : 4} style={{ textAlign: 'center', padding: '2rem' }}>
                      No hay registros para mostrar
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{format(new Date(record.date), 'dd/MM/yyyy', { locale: es })}</td>
                      <td>{record.time}</td>
                      {canViewAllRecords && <td>{record.profiles?.full_name || 'N/A'}</td>}
                      {canViewAllRecords && <td>{record.profiles?.departments?.name || 'N/A'}</td>}
                      <td>{record.comments || '-'}</td>
                      <td>{record.created_by_profile?.full_name || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard