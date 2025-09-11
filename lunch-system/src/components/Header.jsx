import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut } from 'lucide-react'

function Header() {
  const { user, profile, signOut } = useAuth()

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <img 
            src="./logo.png" 
            alt="Empaques Múltiples" 
            className="logo"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          <h1 className="app-title">Sistema de Registro de Almuerzos</h1>
        </div>
        
        <div className="user-info">
          <span className="user-name">{profile?.full_name || user?.email}</span>
          <span className="user-role">{profile?.role || 'user'}</span>
          <button 
            onClick={signOut}
            className="btn btn-secondary btn-small"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header