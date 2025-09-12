import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Log error to external service if needed
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--blanco)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          margin: '2rem auto',
          maxWidth: '600px'
        }}>
          <div style={{
            backgroundColor: 'var(--rojo-claro)',
            borderRadius: '50%',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <AlertTriangle size={48} style={{ color: 'var(--rojo)' }} />
          </div>

          <h2 style={{
            color: 'var(--gris-oscuro)',
            marginBottom: '0.5rem',
            fontSize: '1.5rem'
          }}>
            ¡Oops! Algo salió mal
          </h2>

          <p style={{
            color: 'var(--gris-medio)',
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}>
            Ha ocurrido un error inesperado. Por favor, intenta recargar la página o contacta al soporte técnico.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              backgroundColor: 'var(--gris-claro)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              width: '100%',
              maxWidth: '500px',
              textAlign: 'left'
            }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: 'var(--gris-oscuro)'
              }}>
                Detalles del error (desarrollo)
              </summary>
              
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--gris-medio)',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.errorInfo && (
                  <>
                    <br /><br />
                    <strong>Stack:</strong> {this.state.errorInfo.componentStack}
                  </>
                )}
              </div>
            </details>
          )}

          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              className="btn btn-primary"
              onClick={this.handleRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshCw size={16} />
              Intentar de nuevo
            </button>

            <button
              className="btn btn-secondary"
              onClick={this.handleGoHome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Home size={16} />
              Ir al inicio
            </button>
          </div>

          {this.state.retryCount > 0 && (
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--gris-medio)',
              marginTop: '1rem'
            }}>
              Intentos: {this.state.retryCount}
            </p>
          )}

          <div style={{
            fontSize: '0.75rem',
            color: 'var(--gris-medio)',
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'var(--gris-claro)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px'
          }}>
            <strong>Consejos:</strong>
            <ul style={{ textAlign: 'left', margin: 0, paddingLeft: '1.5rem' }}>
              <li>Recarga la página (F5 o Ctrl+R)</li>
              <li>Verifica tu conexión a internet</li>
              <li>Intenta en modo incógnito</li>
              <li>Contacta al soporte si el problema persiste</li>
            </ul>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary