import React from 'react'
import { Link } from 'react-router-dom'

const StaticWebsite = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        marginBottom: '1rem',
        color: '#2c5e2e'
      }}>
        Empaques Múltiples
      </h1>
      <p style={{ 
        fontSize: '1.2rem', 
        marginBottom: '2rem',
        maxWidth: '600px',
        color: '#666'
      }}>
        Empresa líder en productos alimentarios de calidad en Venezuela
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <a 
          href="/index-static.html" 
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#2c5e2e',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1a3a1c'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#2c5e2e'}
        >
          Ver Sitio Principal
        </a>
        
        <Link 
          to="/lunch-system" 
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            transition: 'background-color 0.3s'
          }}
        >
          Sistema de Almuerzos
        </Link>
      </div>
      
      <div style={{ 
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        maxWidth: '500px'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>Información</h3>
        <p style={{ margin: '0.5rem 0', color: '#666' }}>
          📱 <strong>Sitio Principal:</strong> Catálogo completo de productos
        </p>
        <p style={{ margin: '0.5rem 0', color: '#666' }}>
          🍽️ <strong>Sistema de Almuerzos:</strong> Registro y gestión de comidas
        </p>
      </div>
    </div>
  )
}

export default StaticWebsite