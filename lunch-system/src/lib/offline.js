// IndexedDB setup for offline functionality
import Dexie from 'dexie'

export class OfflineDB extends Dexie {
  constructor() {
    super('LunchSystemDB')
    
    this.version(1).stores({
      lunch_records: '++id, user_id, date, time, comments, created_by, synced, created_at',
      sync_queue: '++id, action, table, data, timestamp, retries, last_error',
      user_cache: '++id, user_data, last_updated'
    })
  }
}

export const db = new OfflineDB()

// Constants for retry logic
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second base delay

// Offline sync utilities
export const addToSyncQueue = async (action, table, data) => {
  await db.sync_queue.add({
    action,
    table,
    data,
    timestamp: new Date().toISOString(),
    retries: 0,
    last_error: null
  })
}

// Get pending sync items with status
export const getPendingSyncItems = async () => {
  return await db.sync_queue.orderBy('timestamp').toArray()
}

// Get sync status summary
export const getSyncStatus = async () => {
  const pendingItems = await getPendingSyncItems()
  const failedItems = pendingItems.filter(item => item.retries >= MAX_RETRIES)
  
  return {
    total: pendingItems.length,
    pending: pendingItems.length - failedItems.length,
    failed: failedItems.length,
    items: pendingItems
  }
}

// Enhanced sync function with retry logic and better error handling
export const syncOfflineData = async (supabase, onProgress = null) => {
  const pendingSync = await db.sync_queue
    .where('retries')
    .below(MAX_RETRIES)
    .orderBy('timestamp')
    .toArray()
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  }

  for (let i = 0; i < pendingSync.length; i++) {
    const item = pendingSync[i]
    
    try {
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: pendingSync.length,
          item: item
        })
      }

      if (item.action === 'insert' && item.table === 'lunch_records') {
        const { error } = await supabase
          .from('lunch_records')
          .insert(item.data)
        
        if (!error) {
          // Success - remove from sync queue
          await db.sync_queue.delete(item.id)
          
          // Update local record as synced if it exists
          if (item.data.id) {
            await db.lunch_records
              .where('id')
              .equals(item.data.id)
              .modify({ synced: true })
          }
          
          results.success++
        } else {
          throw error
        }
      }
      
      // Add delay between requests to avoid rate limiting
      if (i < pendingSync.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
    } catch (error) {
      console.error('Sync error for item:', item.id, error)
      
      // Update retry count and error info
      await db.sync_queue.update(item.id, {
        retries: item.retries + 1,
        last_error: error.message || 'Error desconocido'
      })
      
      if (item.retries + 1 >= MAX_RETRIES) {
        results.failed++
        results.errors.push({
          item: item,
          error: error.message || 'Error desconocido'
        })
      } else {
        results.skipped++
      }
    }
  }

  return results
}

// Retry failed sync items (reset retry count)
export const retryFailedSync = async () => {
  const failedItems = await db.sync_queue
    .where('retries')
    .aboveOrEqual(MAX_RETRIES)
    .toArray()
  
  for (const item of failedItems) {
    await db.sync_queue.update(item.id, {
      retries: 0,
      last_error: null
    })
  }
  
  return failedItems.length
}

// Clear all sync queue items (for manual reset)
export const clearSyncQueue = async () => {
  const count = await db.sync_queue.count()
  await db.sync_queue.clear()
  return count
}

// User data caching
export const cacheUserData = async (userData) => {
  await db.user_cache.clear() // Keep only latest cache
  await db.user_cache.add({
    user_data: userData,
    last_updated: new Date().toISOString()
  })
}

export const getCachedUserData = async (maxAgeMinutes = 30) => {
  const cached = await db.user_cache.orderBy('id').last()
  
  if (!cached) return null
  
  const cacheAge = Date.now() - new Date(cached.last_updated).getTime()
  const maxAge = maxAgeMinutes * 60 * 1000
  
  if (cacheAge > maxAge) {
    await db.user_cache.clear()
    return null
  }
  
  return cached.user_data
}

// Network status helper
export const isOnline = () => navigator.onLine

// Enhanced offline storage for lunch records
export const saveLunchRecordOffline = async (recordData) => {
  const offlineRecord = {
    ...recordData,
    id: crypto.randomUUID(),
    synced: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  await db.lunch_records.add(offlineRecord)
  await addToSyncQueue('insert', 'lunch_records', recordData)
  
  return offlineRecord
}