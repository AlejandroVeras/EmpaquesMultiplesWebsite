import React from 'react'

function LoadingSpinner({ message = 'Cargando...' }) {
  return (
    <div className="loading">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--verde)' }}>{message}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner