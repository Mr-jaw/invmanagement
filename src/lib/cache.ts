// Cache utility for frontend and admin data
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
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

// Cache TTL configurations (in milliseconds)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

// Auto cleanup every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

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