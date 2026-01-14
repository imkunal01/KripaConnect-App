const crypto = require('crypto');
const { getRedisClient, isRedisAvailable } = require('../config/redis');

/**
 * Get cached data or fetch and cache it
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds
 * @param {Function} fetchFn - Async function to fetch data on cache miss
 * @param {boolean} logHitMiss - Log cache hits/misses (dev only)
 * @returns {Promise<any>} - Cached or fresh data
 */
async function getOrSetCache(key, ttl, fetchFn, logHitMiss = false) {
  const redis = getRedisClient();
  
  // Fallback to direct fetch if Redis unavailable
  if (!redis || !isRedisAvailable()) {
    if (logHitMiss && process.env.NODE_ENV !== 'production') {
      console.log(`🔴 CACHE DISABLED - Key: ${key}`);
    }
    return await fetchFn();
  }

  try {
    // Try to get cached data
    const cached = await redis.get(key);
    
    if (cached) {
      if (logHitMiss && process.env.NODE_ENV !== 'production') {
        console.log(`✅ CACHE HIT - Key: ${key}`);
      }
      return JSON.parse(cached);
    }

    // Cache miss - fetch fresh data
    if (logHitMiss && process.env.NODE_ENV !== 'production') {
      console.log(`❌ CACHE MISS - Key: ${key}`);
    }
    
    const freshData = await fetchFn();
    
    // Store in cache with TTL
    if (freshData !== null && freshData !== undefined) {
      await redis.setex(key, ttl, JSON.stringify(freshData));
    }
    
    return freshData;
  } catch (error) {
    console.error(`Redis cache error for key ${key}:`, error.message);
    // Fallback to fetching fresh data
    return await fetchFn();
  }
}

/**
 * Invalidate a single cache key
 * @param {string} key - Cache key to delete
 */
async function invalidateCache(key) {
  const redis = getRedisClient();
  if (!redis || !isRedisAvailable()) return;
  
  try {
    await redis.del(key);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🗑️  CACHE INVALIDATED - Key: ${key}`);
    }
  } catch (error) {
    console.error(`Failed to invalidate cache key ${key}:`, error.message);
  }
}

/**
 * Invalidate multiple cache keys
 * @param {string[]} keys - Array of cache keys
 */
async function invalidateMultipleKeys(keys) {
  const redis = getRedisClient();
  if (!redis || !isRedisAvailable() || !keys.length) return;
  
  try {
    await redis.del(...keys);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🗑️  CACHE INVALIDATED - Keys: ${keys.join(', ')}`);
    }
  } catch (error) {
    console.error(`Failed to invalidate multiple cache keys:`, error.message);
  }
}

/**
 * Invalidate all keys matching a pattern
 * @param {string} pattern - Redis key pattern (e.g., 'products:list:*')
 */
async function invalidatePattern(pattern) {
  const redis = getRedisClient();
  if (!redis || !isRedisAvailable()) return;
  
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🗑️  CACHE PATTERN INVALIDATED - Pattern: ${pattern} (${keys.length} keys)`);
      }
    }
  } catch (error) {
    console.error(`Failed to invalidate pattern ${pattern}:`, error.message);
  }
}

/**
 * Generate a consistent hash from query parameters
 * @param {Object} params - Query parameters object
 * @returns {string} - MD5 hash of sorted params
 */
function hashQueryParams(params) {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  
  const str = JSON.stringify(sorted);
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Set data in Redis with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 */
async function setCache(key, data, ttl) {
  const redis = getRedisClient();
  if (!redis || !isRedisAvailable()) return;
  
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to set cache for key ${key}:`, error.message);
  }
}

/**
 * Get data from Redis
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached data or null
 */
async function getCache(key) {
  const redis = getRedisClient();
  if (!redis || !isRedisAvailable()) return null;
  
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error(`Failed to get cache for key ${key}:`, error.message);
    return null;
  }
}

module.exports = {
  getOrSetCache,
  invalidateCache,
  invalidateMultipleKeys,
  invalidatePattern,
  hashQueryParams,
  setCache,
  getCache
};
