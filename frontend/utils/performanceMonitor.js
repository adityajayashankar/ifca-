/**
 * Performance Monitoring Utility
 * Tracks page load metrics, API response times, and component render performance
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTimes = new Map();
  }

  /**
   * Start measuring a metric
   */
  start(label) {
    this.startTimes.set(label, performance.now());
    console.log(`⏱️ Started measuring: ${label}`);
  }

  /**
   * End measuring and log the duration
   */
  end(label) {
    if (!this.startTimes.has(label)) {
      console.warn(`⚠️ No start time found for: ${label}`);
      return null;
    }

    const duration = performance.now() - this.startTimes.get(label);
    this.startTimes.delete(label);

    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }

    this.metrics.get(label).push(duration);

    // Log if duration exceeds thresholds
    if (duration > 3000) {
      console.warn(`🚨 SLOW: ${label} took ${duration.toFixed(2)}ms`);
    } else if (duration > 1000) {
      console.warn(`⚠️ MEDIUM: ${label} took ${duration.toFixed(2)}ms`);
    } else {
      console.log(`✅ FAST: ${label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Record a single measurement (non-start/end)
   */
  record(label, duration) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label).push(duration);
  }

  /**
   * Get average duration for a metric
   */
  getAverage(label) {
    if (!this.metrics.has(label) || this.metrics.get(label).length === 0) {
      return null;
    }

    const durations = this.metrics.get(label);
    const sum = durations.reduce((a, b) => a + b, 0);
    return sum / durations.length;
  }

  /**
   * Get all metrics as a summary
   */
  getSummary() {
    const summary = {};
    
    for (const [label, durations] of this.metrics) {
      if (durations.length === 0) continue;
      
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      summary[label] = {
        count: durations.length,
        average: avg.toFixed(2) + 'ms',
        min: min.toFixed(2) + 'ms',
        max: max.toFixed(2) + 'ms'
      };
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.startTimes.clear();
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    console.group('📊 Performance Summary');
    console.table(this.getSummary());
    console.groupEnd();
  }

  /**
   * Check Web Vitals (LCP, FID, CLS)
   */
  checkWebVitals() {
    if (typeof window === 'undefined') return null;

    const vitals = {
      LCP: null, // Largest Contentful Paint
      FID: null, // First Input Delay
      CLS: null  // Cumulative Layout Shift
    };

    // LCP
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // CLS
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            vitals.CLS = clsValue;
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    return vitals;
  }
}

export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
