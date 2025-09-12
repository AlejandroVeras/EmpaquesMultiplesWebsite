import React, { memo } from 'react'
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

const ConfirmDialog = memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar acción",
  message = "¿Estás seguro de que deseas continuar?",
  type = "warning", // warning, danger, info, success
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={24} style={{ color: 'var(--rojo)' }} />
      case 'success':
        return <CheckCircle size={24} style={{ color: 'var(--verde)' }} />
      case 'info':
        return <Info size={24} style={{ color: 'var(--azul)' }} />
      default:
        return <AlertTriangle size={24} style={{ color: 'var(--amarillo)' }} />
    }
  }

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn-danger'
      case 'success':
        return 'btn-success'
      case 'info':
        return 'btn-primary'
      default:
        return 'btn-warning'
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && !loading) {
      onConfirm()
    }
  }

  return (
    <div 
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="modal-content"
        style={{
          backgroundColor: 'var(--blanco)',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          animation: 'modalSlideIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            color: 'var(--gris-medio)',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--gris-oscuro)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--gris-medio)'}
          disabled={loading}
          title="Cerrar"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
            {getIcon()}
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: 0, 
              marginBottom: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--gris-oscuro)'
            }}>
              {title}
            </h3>
            
            <p style={{ 
              margin: 0,
              color: 'var(--gris-medio)',
              lineHeight: '1.5'
            }}>
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '0.75rem',
          marginTop: '1.5rem'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
            style={{ minWidth: '80px' }}
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            className={`btn ${getConfirmButtonClass()}`}
            onClick={onConfirm}
            disabled={loading}
            style={{ minWidth: '80px' }}
          >
            {loading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .btn-danger {
          background-color: var(--rojo);
          color: var(--blanco);
          border: none;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: var(--rojo-oscuro);
        }

        .btn-warning {
          background-color: var(--amarillo);
          color: var(--gris-oscuro);
          border: none;
        }

        .btn-warning:hover:not(:disabled) {
          background-color: var(--amarillo-oscuro);
        }

        .btn-success {
          background-color: var(--verde);
          color: var(--blanco);
          border: none;
        }

        .btn-success:hover:not(:disabled) {
          background-color: var(--verde-oscuro);
        }
      `}</style>
    </div>
  )
})

ConfirmDialog.displayName = 'ConfirmDialog'

export default ConfirmDialog