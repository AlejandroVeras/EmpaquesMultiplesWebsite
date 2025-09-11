import React from 'react'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-container">
        <h1 style={{ color: '#116835' }}>404: Página no encontrada</h1>
        <p>La página que buscas no existe.</p>
        <Link 
          to="/" 
          className="back-link"
          style={{ 
            color: '#116835',
            textDecoration: 'none',
            padding: '10px 20px',
            border: '2px solid #116835',
            borderRadius: '5px',
            display: 'inline-block',
            marginTop: '20px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#116835';
            e.target.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#116835';
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default NotFound