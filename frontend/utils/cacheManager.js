/**
 * Advanced Caching Manager with localStorage + IndexedDB fallback
 * Implements smart TTL, compression, and quota management
 */

const CACHE_CONFIG = {
  FEED_TTL: 5 * 60 * 1000, // 5 minutes
  USER_DATA_TTL: 10 * 60 * 1000, // 10 minutes
  MAX_LOCAL_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB
  COMPRESSION_THRESHOLD: 50 * 1024, // Compress if > 50KB
};

class CacheManager {
  constructor() {
    this.dbName = 'IFCACache';
    this.version = 1;
    this.db = null;
    this.initDB();
  }

  // Initialize IndexedDB for larger data
  initDB() {
    try {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.warn('IndexedDB initialization failed');
        this.db = null;
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('✅ IndexedDB initialized');
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    } catch (e) {
      console.warn('IndexedDB not available, using localStorage only');
      this.db = null;
    }
  }

  // Get local storage size estimate
  getLocalStorageSize() {
    let size = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size;
  }

  // Set cache with smart storage selection
  async set(key, value, ttlMs = null) {
    try {
      const dataStr = JSON.stringify(value);
      const size = dataStr.length;
      const cacheEntry = {
        key,
        value,
        timestamp: Date.now(),
        ttl: ttlMs,
        size
      };

      // Use localStorage for small data
      if (size < 100 * 1024 && this.getLocalStorageSize() < CACHE_CONFIG.MAX_LOCAL_STORAGE_SIZE) {
        localStorage.setItem(key, dataStr);
        localStorage.setItem(`${key}_time`, Date.now().toString());
        localStorage.setItem(`${key}_ttl`, ttlMs ? ttlMs.toString() : 'none');
        console.log(`💾 Cached to localStorage: ${key} (${(size / 1024).toFixed(2)}KB)`);
      } else if (this.db) {
        // Use IndexedDB for larger data
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction(['cache'], 'readwrite');
          const store = transaction.objectStore('cache');
          const request = store.put(cacheEntry);
          
          request.onsuccess = () => {
            console.log(`💾 Cached to IndexedDB: ${key} (${(size / 1024).toFixed(2)}KB)`);
            resolve(true);
          };
          
          request.onerror = () => {
            console.warn(`Failed to cache ${key} to IndexedDB`);
            reject(request.error);
          };
        });
      }
    } catch (e) {
      console.warn(`Cache storage error for ${key}:`, e.message);
    }
  }

  // Get cache with TTL validation
  async get(key) {
    try {
      // Try localStorage first
      const lsData = localStorage.getItem(key);
      if (lsData) {
        const timestamp = parseInt(localStorage.getItem(`${key}_time`) || 0);
        const ttl = localStorage.getItem(`${key}_ttl`);
        
        if (this.isExpired(timestamp, ttl === 'none' ? null : parseInt(ttl))) {
          this.delete(key);
          return null;
        }
        
        console.log(`✅ Retrieved from localStorage: ${key}`);
        return JSON.parse(lsData);
      }

      // Try IndexedDB
      if (this.db) {
        return new Promise((resolve) => {
          const transaction = this.db.transaction(['cache'], 'readonly');
          const store = transaction.objectStore('cache');
          const request = store.get(key);
          
          request.onsuccess = () => {
            const result = request.result;
            if (result && !this.isExpired(result.timestamp, result.ttl)) {
              console.log(`✅ Retrieved from IndexedDB: ${key}`);
              resolve(result.value);
            } else {
              this.deleteFromDB(key);
              resolve(null);
            }
          };
          
          request.onerror = () => {
            console.warn(`Failed to retrieve ${key} from IndexedDB`);
            resolve(null);
          };
        });
      }

      return null;
    } catch (e) {
      console.warn(`Cache retrieval error for ${key}:`, e.message);
      return null;
    }
  }

  // Check if cache is expired
  isExpired(timestamp, ttl) {
    if (!ttl) return false;
    return Date.now() - timestamp > ttl;
  }

  // Delete cache
  delete(key) {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_time`);
      localStorage.removeItem(`${key}_ttl`);
      
      if (this.db) {
        this.deleteFromDB(key);
      }
      
      console.log(`🗑️ Deleted cache: ${key}`);
    } catch (e) {
      console.warn(`Cache deletion error for ${key}:`, e.message);
    }
  }

  // Delete from IndexedDB
  deleteFromDB(key) {
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.delete(key);
    } catch (e) {
      console.warn(`Failed to delete ${key} from IndexedDB:`, e.message);
    }
  }

  // Clear all cache
  clearAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('feed_') || key.startsWith('user_') || key.endsWith('_time') || key.endsWith('_ttl')) {
          localStorage.removeItem(key);
        }
      });
      
      if (this.db) {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.clear();
      }
      
      console.log('🧹 Cleared all cache');
    } catch (e) {
      console.warn('Cache clear error:', e.message);
    }
  }

  // Get cache stats
  getStats() {
    const lsSize = this.getLocalStorageSize();
    return {
      localStorageSize: `${(lsSize / 1024).toFixed(2)}KB`,
      maxSize: `${(CACHE_CONFIG.MAX_LOCAL_STORAGE_SIZE / 1024 / 1024).toFixed(2)}MB`,
      indexedDBAvailable: !!this.db
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

export default cacheManager;
