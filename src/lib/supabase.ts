import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Optimized fetch implementation with connection pooling and caching
const optimizedFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Add performance optimizations
      keepalive: true,
      headers: {
        ...options?.headers,
        'Cache-Control': 'max-age=300', // 5 minute cache
        'Connection': 'keep-alive',
      }
    });
    
    clearTimeout(timeoutId);
    
    // Check for session_not_found errors
    if (response.status === 403) {
      try {
        const body = await response.clone().text();
        const errorData = JSON.parse(body);
        
        if (errorData.code === 'session_not_found') {
          // Clear the invalid session
          await supabase.auth.signOut();
        }
      } catch (e) {
        // If we can't parse the response, continue normally
      }
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: optimizedFetch
  },
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // Disable for better performance
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Limit realtime events for better performance
    }
  }
})

// Preload critical data on module load
const preloadData = async () => {
  try {
    // Preload categories and featured products in parallel
    const [categoriesPromise, featuredPromise] = await Promise.allSettled([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('*').eq('featured', true).limit(6)
    ]);

    // Cache the results if successful
    if (categoriesPromise.status === 'fulfilled' && categoriesPromise.value.data) {
      const { cache, CACHE_KEYS, CACHE_TTL } = await import('./cache');
      cache.set(CACHE_KEYS.CATEGORIES, categoriesPromise.value.data, CACHE_TTL.LONG);
    }

    if (featuredPromise.status === 'fulfilled' && featuredPromise.value.data) {
      const { cache, CACHE_KEYS, CACHE_TTL } = await import('./cache');
      cache.set(CACHE_KEYS.FEATURED_PRODUCTS, featuredPromise.value.data, CACHE_TTL.MEDIUM);
    }
  } catch (error) {
    // Silently fail preloading to not block app startup
    console.warn('Failed to preload data:', error);
  }
};

// Start preloading immediately but don't block
preloadData();

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          category_id: string
          images: string[]
          specifications: Record<string, any>
          featured: boolean
          stock_quantity: number
          low_stock_threshold: number
          track_inventory: boolean
          sku: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          category_id: string
          images?: string[]
          specifications?: Record<string, any>
          featured?: boolean
          stock_quantity?: number
          low_stock_threshold?: number
          track_inventory?: boolean
          sku?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          category_id?: string
          images?: string[]
          specifications?: Record<string, any>
          featured?: boolean
          stock_quantity?: number
          low_stock_threshold?: number
          track_inventory?: boolean
          sku?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          image_url: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          image_url?: string
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string
          message?: string
          read?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          author_name: string
          author_email: string
          rating: number
          comment: string
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          author_name: string
          author_email: string
          rating: number
          comment: string
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          author_name?: string
          author_email?: string
          rating?: number
          comment?: string
          verified?: boolean
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          email: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          active?: boolean
          created_at?: string
        }
      }
      inventory_logs: {
        Row: {
          id: string
          product_id: string
          change_type: 'restock' | 'sale' | 'adjustment' | 'return'
          quantity_change: number
          previous_stock: number
          new_stock: number
          reason: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          change_type: 'restock' | 'sale' | 'adjustment' | 'return'
          quantity_change: number
          previous_stock: number
          new_stock: number
          reason?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          change_type?: 'restock' | 'sale' | 'adjustment' | 'return'
          quantity_change?: number
          previous_stock?: number
          new_stock?: number
          reason?: string
          created_by?: string | null
          created_at?: string
        }
      }
      low_stock_alerts: {
        Row: {
          id: string
          product_id: string
          threshold: number
          current_stock: number
          alert_sent: boolean
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          threshold: number
          current_stock: number
          alert_sent?: boolean
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          threshold?: number
          current_stock?: number
          alert_sent?: boolean
          resolved?: boolean
          created_at?: string
        }
      }
    }
  }
}