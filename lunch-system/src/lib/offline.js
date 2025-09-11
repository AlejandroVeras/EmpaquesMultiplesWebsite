// IndexedDB setup for offline functionality
import Dexie from 'dexie'

export class OfflineDB extends Dexie {
  constructor() {
    super('LunchSystemDB')
    
    this.version(1).stores({
      lunch_records: '++id, user_id, date, time, comments, created_by, synced, created_at',
      sync_queue: '++id, action, table, data, timestamp'
    })
  }
}

export const db = new OfflineDB()

// Offline sync utilities
export const addToSyncQueue = async (action, table, data) => {
  await db.sync_queue.add({
    action,
    table,
    data,
    timestamp: new Date().toISOString()
  })
}

export const syncOfflineData = async (supabase) => {
  const pendingSync = await db.sync_queue.orderBy('timestamp').toArray()
  
  for (const item of pendingSync) {
    try {
      if (item.action === 'insert' && item.table === 'lunch_records') {
        const { error } = await supabase
          .from('lunch_records')
          .insert(item.data)
        
        if (!error) {
          await db.sync_queue.delete(item.id)
          // Update local record as synced
          await db.lunch_records
            .where('id')
            .equals(item.data.id)
            .modify({ synced: true })
        }
      }
    } catch (error) {
      console.error('Sync error:', error)
    }
  }
}