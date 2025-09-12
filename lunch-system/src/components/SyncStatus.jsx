import React, { useState, useEffect, memo } from 'react'
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { getSyncStatus, syncOfflineData, retryFailedSync } from '../lib/offline'
import { checkSyncRate, recordSyncAttempt, getRateLimitMessage } from '../lib/rateLimiter'
import toast from 'react-hot-toast'

const SyncStatus = memo(({ isOnline, supabase, onSyncComplete }) => {
  const [syncStatus, setSyncStatus] = useState({ total: 0, pending: 0, failed: 0, items: [] })
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [syncProgress, setSyncProgress] = useState(null)

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const status = await getSyncStatus()
      setSyncStatus(status)
    } catch (error) {
      console.error('Error fetching sync status:', error)
    }
  }

  // Auto-fetch sync status periodically
  useEffect(() => {
    fetchSyncStatus()
    const interval = setInterval(fetchSyncStatus, 5000) // Every 5 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && syncStatus.pending > 0) {
      handleSync()
    }
  }, [isOnline])

  const handleSync = async () => {
    if (!isOnline || isSyncing) return

    // Check rate limiting
    const rateCheck = checkSyncRate()
    if (rateCheck.limited) {
      toast.error(getRateLimitMessage(rateCheck.retryAfter))
      return
    }

    // Record the sync attempt
    recordSyncAttempt()

    setIsSyncing(true)
    setSyncProgress({ current: 0, total: syncStatus.pending })

    try {
      const results = await syncOfflineData(supabase, (progress) => {
        setSyncProgress(progress)
      })

      setLastSyncTime(new Date())
      await fetchSyncStatus()
      
      if (onSyncComplete) {
        onSyncComplete(results)
      }

    } catch (error) {
      console.error('Sync failed:', error)
      toast.error('Error al sincronizar: ' + error.message)
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }

  const handleRetryFailed = async () => {
    if (isSyncing) return

    try {
      const retriedCount = await retryFailedSync()
      await fetchSyncStatus()
      
      if (retriedCount > 0 && isOnline) {
        handleSync()
      }
    } catch (error) {
      console.error('Error retrying failed items:', error)
    }
  }

  const getStatusColor = () => {
    if (!isOnline) return 'var(--amarillo)'
    if (syncStatus.failed > 0) return 'var(--rojo)'
    if (syncStatus.pending > 0) return 'var(--naranja)'
    return 'var(--verde)'
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={20} />
    if (isSyncing) return <RefreshCw size={20} className="animate-spin" />
    if (syncStatus.failed > 0) return <AlertTriangle size={20} />
    if (syncStatus.pending > 0) return <Clock size={20} />
    return <CheckCircle size={20} />
  }

  const getStatusMessage = () => {
    if (!isOnline) {
      return `Sin conexión - ${syncStatus.total} elementos pendientes de sincronización`
    }
    
    if (isSyncing) {
      return syncProgress 
        ? `Sincronizando... (${syncProgress.current}/${syncProgress.total})`
        : 'Iniciando sincronización...'
    }
    
    if (syncStatus.failed > 0) {
      return `${syncStatus.failed} elementos fallaron al sincronizar`
    }
    
    if (syncStatus.pending > 0) {
      return `${syncStatus.pending} elementos pendientes de sincronización`
    }
    
    return 'Todos los datos están sincronizados'
  }

  return (
    <div 
      className="alert"
      style={{ 
        backgroundColor: getStatusColor() + '20',
        borderColor: getStatusColor(),
        color: getStatusColor(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {getStatusIcon()}
        <span>{getStatusMessage()}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Sync progress bar */}
        {isSyncing && syncProgress && (
          <div 
            style={{
              width: '100px',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${(syncProgress.current / syncProgress.total) * 100}%`,
                height: '100%',
                backgroundColor: 'currentColor',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        )}

        {/* Action buttons */}
        {isOnline && !isSyncing && (
          <>
            {syncStatus.pending > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid currentColor',
                  color: 'inherit',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem'
                }}
                onClick={handleSync}
                title="Sincronizar ahora"
              >
                <RefreshCw size={14} />
                Sincronizar
              </button>
            )}
            
            {syncStatus.failed > 0 && (
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid currentColor',
                  color: 'inherit',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem'
                }}
                onClick={handleRetryFailed}
                title="Reintentar elementos fallidos"
              >
                <RefreshCw size={14} />
                Reintentar
              </button>
            )}
          </>
        )}
      </div>

      {/* Last sync time */}
      {lastSyncTime && (
        <div 
          style={{ 
            fontSize: '0.75rem', 
            opacity: 0.8,
            position: 'absolute',
            bottom: '0.25rem',
            right: '0.5rem'
          }}
        >
          Última sincronización: {lastSyncTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
})

SyncStatus.displayName = 'SyncStatus'

export default SyncStatus