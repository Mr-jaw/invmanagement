import { useState, useEffect, useCallback } from 'react';
import { cache, CACHE_TTL } from '../lib/cache';

interface UseCacheOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
  immediate?: boolean; // Load immediately without waiting
}

interface UseCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

export function useCache<T>({
  key,
  fetcher,
  ttl = CACHE_TTL.MEDIUM,
  enabled = true,
  immediate = true
}: UseCacheOptions<T>): UseCacheReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Check cache first
      const cachedData = cache.get<T>(key);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // If immediate is false and we have no cached data, show loading
      if (!immediate && !cachedData) {
        setLoading(true);
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the result
      cache.set(key, freshData, ttl);
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(`Cache fetch error for key ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, enabled, immediate]);

  const refetch = useCallback(async () => {
    // Clear cache and fetch fresh data
    cache.delete(key);
    setLoading(true);
    await fetchData();
  }, [key, fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    // Check cache immediately on mount
    const cachedData = cache.get<T>(key);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    // If no cached data, fetch it
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}

// Specialized hooks for common use cases with optimized caching
export function useCachedProducts() {
  return useCache({
    key: 'products',
    fetcher: async () => {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    ttl: CACHE_TTL.MEDIUM,
    immediate: true
  });
}

export function useCachedCategories() {
  return useCache({
    key: 'categories',
    fetcher: async () => {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    ttl: CACHE_TTL.LONG,
    immediate: true
  });
}

export function useCachedFeaturedProducts() {
  return useCache({
    key: 'featured_products',
    fetcher: async () => {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .limit(6);
      
      if (error) throw error;
      return data || [];
    },
    ttl: CACHE_TTL.MEDIUM,
    immediate: true
  });
}

export function useCachedProductDetail(id: string) {
  return useCache({
    key: `product_${id}`,
    fetcher: async () => {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    ttl: CACHE_TTL.MEDIUM,
    enabled: !!id,
    immediate: true
  });
}

export function useCachedProductReviews(productId: string) {
  return useCache({
    key: `product_reviews_${productId}`,
    fetcher: async () => {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('verified', true) // Only verified reviews for public display
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    ttl: CACHE_TTL.SHORT,
    enabled: !!productId,
    immediate: true
  });
}