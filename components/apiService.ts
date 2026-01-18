
/**
 * ApiService manages IndexedDB persistence and real-time synchronization.
 * It provides a desktop-class storage backend capable of handling large datasets
 * beyond the limits of localStorage.
 */
const DB_NAME = 'TheDecorHub_DB';
// Incremented version to trigger onupgradeneeded for new stores
const DB_VERSION = 7; 
const SYNC_CHANNEL = 'hub_erp_sync_stream';
const broadcast = new BroadcastChannel(SYNC_CHANNEL);

export class ApiService {
  private static db: IDBDatabase | null = null;

  /**
   * Initializes the IndexedDB database and creates necessary object stores.
   */
  private static async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Added 'expenses', 'returns', 'period_summaries', and 'purchaseOrders' to the store list
        const stores = ['products', 'sales', 'customers', 'suppliers', 'logs', 'expenses', 'returns', 'period_summaries', 'purchaseOrders'];
        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store);
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        
        // Handle connection closing on version change (e.g. other tabs deleting DB)
        this.db.onversionchange = () => {
          if (this.db) {
            this.db.close();
            this.db = null;
          }
        };

        resolve(this.db!);
      };

      request.onerror = (event) => {
        console.error('IndexedDB Error:', event);
        reject('Failed to open IndexedDB');
      };
    });
  }

  /**
   * Pushes a data update to IndexedDB and broadcasts to all other instances.
   */
  static async pushUpdate(type: string, data: any) {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([type], 'readwrite');
        const store = transaction.objectStore(type);
        
        // We store the whole array under a single key 'current'
        const request = store.put(data, 'current');

        request.onsuccess = () => {
          broadcast.postMessage({
            type: 'SYNC_UPDATE',
            entity: type,
            payload: data,
            timestamp: new Date().toISOString()
          });
          resolve();
        };

        request.onerror = () => reject('Failed to save data');
      });
    } catch (e) {
      console.warn("Push update ignored - DB likely closing");
      return Promise.resolve();
    }
  }

  /**
   * Fetches the latest state from IndexedDB.
   */
  static async fetchLatest(type: string) {
    try {
      const db = await this.getDB();
      return new Promise<any>((resolve, reject) => {
        if (!db.objectStoreNames.contains(type)) {
          resolve(null);
          return;
        }

        const transaction = db.transaction([type], 'readonly');
        const store = transaction.objectStore(type);
        const request = store.get('current');

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject('Failed to fetch data');
      });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  /**
   * Listens for updates from other windows/tabs.
   */
  static onSync(callback: (entity: string, data: any) => void) {
    broadcast.onmessage = (event) => {
      if (event.data.type === 'SYNC_UPDATE') {
        callback(event.data.entity, event.data.payload);
      }
    };
  }

  /**
   * NUCLEAR OPTION: Completely deletes the database.
   * This is the only reliable way to fix "Transaction Scope" errors or
   * schema corruption during a Factory Reset.
   */
  static async clearAll() {
    // 1. Close current connection immediately to release locks
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise<void>((resolve, reject) => {
      // 2. Request database deletion
      const request = indexedDB.deleteDatabase(DB_NAME);

      request.onsuccess = () => {
        console.log("Database successfully deleted.");
        resolve();
      };

      request.onerror = (event) => {
        console.error("Error deleting database:", event);
        reject("Could not delete database.");
      };

      request.onblocked = () => {
        console.warn("Database deletion blocked by another tab. Force resolving to allow reload.");
        // We resolve anyway because the page reload (called by App.tsx) will kill this process 
        // and release the lock, allowing the pending delete operation to eventually complete.
        resolve();
      };
    });
  }

  /**
   * Estimates the size of the database in bytes.
   */
  static async getStorageSize(): Promise<number> {
    try {
      const db = await this.getDB();
      const storeNames = Array.from(db.objectStoreNames);
      if (storeNames.length === 0) return 0;
      
      const transaction = db.transaction(storeNames, 'readonly');
      let totalSize = 0;
      
      const promises = storeNames.map(storeName => new Promise<number>((resolve) => {
        try {
          const store = transaction.objectStore(storeName);
          const request = store.getAll();
          request.onsuccess = () => {
            try {
              const str = JSON.stringify(request.result);
              resolve(str ? str.length : 0);
            } catch (e) {
              resolve(0);
            }
          };
          request.onerror = () => resolve(0);
        } catch (e) {
          resolve(0);
        }
      }));

      const sizes = await Promise.all(promises);
      totalSize = sizes.reduce((acc, s) => acc + s, 0);
      return totalSize;
    } catch (error) {
      return 0;
    }
  }
}
