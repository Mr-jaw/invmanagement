// Enhanced cache utility with aggressive caching and performance optimizations
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 10 * 60 * 1000; // 10 minutes default (increased from 5)
  private memoryCache = new Map<string, any>(); // In-memory cache for immediate access

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
    
    // Also store in memory cache for immediate access
    this.memoryCache.set(key, data);
    
    // Store in localStorage for persistence across sessions
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        expiry
      }));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  get<T>(key: string): T | null {
    // Check memory cache first (fastest)
    if (this.memoryCache.has(key)) {
      const item = this.cache.get(key);
      if (item && Date.now() <= item.expiry) {
        return this.memoryCache.get(key);
      }
    }

    // Check in-memory cache
    const item = this.cache.get(key);
    if (item && Date.now() <= item.expiry) {
      this.memoryCache.set(key, item.data);
      return item.data;
    }

    // Check localStorage cache
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const parsedItem = JSON.parse(stored);
        if (Date.now() <= parsedItem.expiry) {
          this.cache.set(key, parsedItem);
          this.memoryCache.set(key, parsedItem.data);
          return parsedItem.data;
        } else {
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    return null;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  clear(): void {
    this.cache.clear();
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Preload data in background
  async preload<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<void> {
    if (!this.has(key)) {
      try {
        const data = await fetcher();
        this.set(key, data, ttl);
      } catch (error) {
        console.warn(`Failed to preload ${key}:`, error);
      }
    }
  }

  // Cleanup expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      memorySize: this.memoryCache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }
}

// Create singleton instance
export const cache = new CacheManager();

// Cache keys for different data types
export const CACHE_KEYS = {
  // Frontend cache keys
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  FEATURED_PRODUCTS: 'featured_products',
  PRODUCT_DETAIL: (id: string) => `product_${id}`,
  PRODUCT_REVIEWS: (id: string) => `product_reviews_${id}`,
  RELATED_PRODUCTS: (categoryId: string) => `related_products_${categoryId}`,
  
  // Admin cache keys
  ADMIN_PRODUCTS: 'admin_products',
  ADMIN_CATEGORIES: 'admin_categories',
  ADMIN_REVIEWS: 'admin_reviews',
  ADMIN_CONTACTS: 'admin_contacts',
  ADMIN_SUBSCRIBERS: 'admin_subscribers',
  ADMIN_INVENTORY: 'admin_inventory',
  ADMIN_ANALYTICS: 'admin_analytics',
  ADMIN_DASHBOARD_STATS: 'admin_dashboard_stats',
  
  // Category products
  CATEGORY_PRODUCTS: (categoryId: string) => `category_products_${categoryId}`,
} as const;

// Cache TTL configurations (in milliseconds) - More aggressive caching
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,      // 5 minutes (increased from 2)
  MEDIUM: 15 * 60 * 1000,    // 15 minutes (increased from 5)
  LONG: 30 * 60 * 1000,      // 30 minutes (increased from 15)
  VERY_LONG: 2 * 60 * 60 * 1000, // 2 hours (increased from 1)
} as const;

// Auto cleanup every 5 minutes (more frequent)
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Clear cache when user logs out
export const clearUserCache = () => {
  cache.clear();
};

// Cache invalidation helpers
export const invalidateCache = {
  products: () => {
    cache.delete(CACHE_KEYS.PRODUCTS);
    cache.delete(CACHE_KEYS.FEATURED_PRODUCTS);
    cache.delete(CACHE_KEYS.ADMIN_PRODUCTS);
  },
  
  categories: () => {
    cache.delete(CACHE_KEYS.CATEGORIES);
    cache.delete(CACHE_KEYS.ADMIN_CATEGORIES);
    // Clear all category products cache
    const keys = cache.getStats().keys;
    keys.forEach(key => {
      if (key.startsWith('category_products_')) {
        cache.delete(key);
      }
    });
  },
  
  reviews: () => {
    cache.delete(CACHE_KEYS.ADMIN_REVIEWS);
    // Clear all product reviews cache
    const keys = cache.getStats().keys;
    keys.forEach(key => {
      if (key.startsWith('product_reviews_')) {
        cache.delete(key);
      }
    });
  },
  
  contacts: () => {
    cache.delete(CACHE_KEYS.ADMIN_CONTACTS);
  },
  
  subscribers: () => {
    cache.delete(CACHE_KEYS.ADMIN_SUBSCRIBERS);
  },
  
  inventory: () => {
    cache.delete(CACHE_KEYS.ADMIN_INVENTORY);
  },
  
  analytics: () => {
    cache.delete(CACHE_KEYS.ADMIN_ANALYTICS);
    cache.delete(CACHE_KEYS.ADMIN_DASHBOARD_STATS);
  },
  
  all: () => {
    cache.clear();
  }
};

// Background data preloader
export const preloadCriticalData = async () => {
  // Preload essential data in background
  const preloadTasks = [
    cache.preload(CACHE_KEYS.CATEGORIES, async () => {
      const { supabase } = await import('./supabase');
      const { data } = await supabase.from('categories').select('*').order('name');
      return data || [];
    }, CACHE_TTL.LONG),
    
    cache.preload(CACHE_KEYS.FEATURED_PRODUCTS, async () => {
      const { supabase } = await import('./supabase');
      const { data } = await supabase.from('products').select('*').eq('featured', true).limit(6);
      return data || [];
    }, CACHE_TTL.MEDIUM),
  ];

  // Don't wait for preload to complete, run in background
  Promise.allSettled(preloadTasks);
};