/**
 * Simple in-memory cache with TTL (Time-To-Live) support.
 * Used to avoid redundant API calls for frequently accessed data.
 */

interface CacheEntry<T> {
    data: T
    expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

/**
 * Get a cached value by key.
 * Returns null if the key doesn't exist or has expired.
 */
export function getCached<T>(key: string): T | null {
    const entry = cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
        cache.delete(key)
        return null
    }

    return entry.data as T
}

/**
 * Set a value in the cache with a TTL.
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttlMs - Time-to-live in milliseconds
 */
export function setCache<T>(key: string, data: T, ttlMs: number): void {
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    })
}

/**
 * Invalidate (delete) cache entries matching a pattern.
 * Useful after mutations to ensure fresh data is fetched.
 * @param pattern - String pattern to match against cache keys
 */
export function invalidateCache(pattern: string): void {
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            cache.delete(key)
        }
    }
}

/**
 * Clear the entire cache.
 */
export function clearCache(): void {
    cache.clear()
}

/**
 * Get or fetch pattern - check cache first, fetch if not cached.
 * @param key - Cache key
 * @param fetcher - Async function to fetch data if not in cache
 * @param ttlMs - Time-to-live for cached data
 */
export async function getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
): Promise<T> {
    const cached = getCached<T>(key)
    if (cached !== null) {
        console.log(`[Cache] HIT: ${key}`)
        return cached
    }

    console.log(`[Cache] MISS: ${key}`)
    const data = await fetcher()
    setCache(key, data, ttlMs)
    return data
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    STATS: 30 * 1000,       // 30 seconds - stats don't change often
    LIST: 10 * 1000,        // 10 seconds - lists may change more frequently
    DETAIL: 60 * 1000,      // 1 minute - individual records
    DROPDOWN: 5 * 60 * 1000 // 5 minutes - dropdowns/lookup data
}
