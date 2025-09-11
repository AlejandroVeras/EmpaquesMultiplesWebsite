import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Home, Plus, Settings } from 'lucide-react'

function Navigation() {
  const { profile } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="nav">
      <div className="nav-content">
        <ul className="nav-list">
          <li className="nav-item">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              <Home size={18} />
              Dashboard
            </Link>
          </li>
          
          <li className="nav-item">
            <Link 
              to="/registro" 
              className={`nav-link ${isActive('/registro') ? 'active' : ''}`}
            >
              <Plus size={18} />
              Registrar Almuerzo
            </Link>
          </li>
          
          {profile?.role === 'admin' && (
            <li className="nav-item">
              <Link 
                to="/admin" 
                className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              >
                <Settings size={18} />
                Panel de Administración
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navigation