import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '4rem', margin: '0', color: '#666' }}>404</h1>
      <h2 style={{ margin: '1rem 0', color: '#333' }}>Página no encontrada</h2>
      <p style={{ margin: '1rem 0', color: '#666' }}>
        La página que buscas no existe o ha sido movida.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <Link 
          to="/" 
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '1rem'
          }}
        >
          Ir al inicio
        </Link>
        <Link 
          to="/lunch-system" 
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Sistema de almuerzos
        </Link>
      </div>
    </div>
  )
}

export default NotFound