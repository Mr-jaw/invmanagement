import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom fetch implementation to handle session errors
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const response = await fetch(url, options)
  
  // Check for session_not_found errors
  if (response.status === 403) {
    try {
      const body = await response.clone().text()
      const errorData = JSON.parse(body)
      
      if (errorData.code === 'session_not_found') {
        // Clear the invalid session
        await supabase.auth.signOut()
      }
    } catch (e) {
      // If we can't parse the response, continue normally
    }
  }
  
  return response
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch
  }
})

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