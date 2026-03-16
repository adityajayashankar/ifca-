/**
 * Request Deduplication Utility
 * Prevents multiple identical API requests from running simultaneously
 */

class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Execute a request, deduplicating identical pending requests
   * @param {string} key - Unique key for the request (e.g., "feed_user123")
   * @param {Function} requestFn - Async function that returns the request promise
   * @returns {Promise} - Resolves when the request completes
   */
  async dedupe(key, requestFn) {
    // If a request with this key is already pending, return that promise
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ Deduplicating request: ${key}`);
      return this.pendingRequests.get(key);
    }

    // Create the request promise
    const requestPromise = (async () => {
      try {
        console.log(`🚀 Executing request: ${key}`);
        const result = await requestFn();
        console.log(`✅ Request completed: ${key}`);
        return result;
      } finally {
        // Remove from pending requests when complete
        this.pendingRequests.delete(key);
      }
    })();

    // Store the promise
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  /**
   * Clear a specific pending request
   */
  clear(key) {
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clearAll() {
    this.pendingRequests.clear();
  }

  /**
   * Get all pending request keys
   */
  getPendingKeys() {
    return Array.from(this.pendingRequests.keys());
  }
}

export const requestDeduplicator = new RequestDeduplicator();

export default requestDeduplicator;
