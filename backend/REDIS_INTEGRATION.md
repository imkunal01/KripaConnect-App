# Redis Caching Integration - KripaConnect Backend

## Overview

Redis has been integrated as a caching layer to improve performance and support optimistic UI patterns across the KripaConnect backend. **Redis is used as a cache only** - MongoDB remains the single source of truth.

## Architecture Principles

- **MongoDB is authoritative** - All data writes go to MongoDB first
- **Redis is cache only** - Never the primary data source
- **Graceful degradation** - If Redis fails, system falls back to MongoDB silently
- **Explicit invalidation** - Cache is invalidated on mutations, not just TTL
- **TTL required** - All cached keys have expiration times

## Setup

### Prerequisites

Redis server must be running and accessible via `REDIS_URL` environment variable.

```bash
# Add to your .env file
REDIS_URL=redis://localhost:6379
# Or for cloud Redis (e.g., Redis Cloud, Upstash)
REDIS_URL=redis://username:password@host:port
```

### Installation

The `ioredis` package is already added to `package.json`. Run:

```bash
cd backend
npm install
```

## Implementation Details

### Core Files

1. **`src/config/redis.js`** - Redis client configuration with graceful error handling
2. **`src/utils/cacheUtils.js`** - Caching utility functions (`getOrSetCache`, `invalidateCache`, etc.)

### Cached Endpoints

#### 1. Categories (`categoryController.js`)

**GET `/api/categories`**
- **Key**: `categories:all`
- **TTL**: 86400s (24 hours)
- **Invalidation**: On create/update/delete category

#### 2. Products List (`productController.js`)

**GET `/api/products`**
- **Key Pattern**: `products:list:{hash_of_query_params}`
- **TTL**: 300s (5 minutes)
- **Invalidation**: All product list caches on any product mutation
- **Note**: Query params are hashed to create unique cache keys for different filters

#### 3. Product Details (`productController.js`)

**GET `/api/products/:id`**
- **Key**: `product:{productId}`
- **TTL**: 1800s (30 minutes)
- **Invalidation**: On update/delete/image change for that product

#### 4. Cart - Redis-First Pattern (`cartController.js`)

**All `/api/cart/*` endpoints**
- **Key**: `cart:user:{userId}`
- **TTL**: 86400s (24 hours)
- **Pattern**: Redis-first with MongoDB fallback
  - Cart reads check Redis first
  - Cache miss falls back to MongoDB
  - All writes go to MongoDB then invalidate Redis
  - Cart is synced to MongoDB on checkout/order creation

#### 5. User Profile (`authController.js`)

**GET `/api/auth/profile`**
- **Key**: `user:profile:{userId}`
- **TTL**: 300s (5 minutes)
- **Invalidation**: On profile update, address update, or photo upload

#### 6. Favorites (`favoriteController.js`)

**All `/api/favorites/*` endpoints**
- **Key**: `favorites:user:{userId}`
- **TTL**: 600s (10 minutes)
- **Invalidation**: On add/remove favorite

#### 7. Admin Analytics (`analyticsControllers.js`)

**GET `/api/analytics/*`**

| Endpoint | Key | TTL |
|----------|-----|-----|
| Overview Stats | `analytics:overview` | 300s (5 min) |
| Revenue Stats | `analytics:revenue` | 300s (5 min) |
| Order Stats | `analytics:orders` | 120s (2 min) |
| Top Products | `analytics:top-products` | 300s (5 min) |
| User Growth | `analytics:user-growth` | 300s (5 min) |
| Low Stock | `analytics:low-stock` | 120s (2 min) |

**Invalidation**: Analytics caches are invalidated on order lifecycle events (create, update, cancel, delete)

## Cache Invalidation Strategy

### Order Lifecycle Events (`orderController.js`)

Cache invalidation is automatically triggered on:

1. **Order Creation** (`createOrder`)
   - Invalidates: All analytics caches + user's cart cache

2. **Order Status Update** (`updateOrderStatus`)
   - Invalidates: `analytics:overview`, `analytics:revenue`, `analytics:orders`

3. **Order Cancellation** (`cancelOrder`)
   - Invalidates: `analytics:overview`, `analytics:orders`

4. **Order Deletion** (`deleteOrder`)
   - Invalidates: `analytics:overview`, `analytics:revenue`, `analytics:orders`, `analytics:top-products`

### Product Mutations

- **Create Product**: Invalidates `products:list:*` (all list caches)
- **Update Product**: Invalidates `product:{id}` + `products:list:*`
- **Delete Product**: Invalidates `product:{id}` + `products:list:*`
- **Remove Image**: Invalidates `product:{id}`

## Cache Utility Functions

### `getOrSetCache(key, ttl, fetchFn, logHitMiss)`

Get cached data or fetch and cache it.

```javascript
const data = await getOrSetCache(
  'my:cache:key',
  300, // TTL in seconds
  async () => {
    // Fetch fresh data from database
    return await Model.find({}).lean();
  },
  true // Log cache hits/misses in dev
);
```

### `invalidateCache(key)`

Invalidate a single cache key.

```javascript
await invalidateCache('product:123');
```

### `invalidateMultipleKeys(keys)`

Invalidate multiple cache keys at once.

```javascript
await invalidateMultipleKeys([
  'analytics:overview',
  'analytics:revenue',
  'analytics:orders'
]);
```

### `invalidatePattern(pattern)`

Invalidate all keys matching a pattern.

```javascript
await invalidatePattern('products:list:*');
```

### `hashQueryParams(params)`

Generate consistent hash from query parameters for cache keys.

```javascript
const hash = hashQueryParams(req.query);
const cacheKey = `products:list:${hash}`;
```

## Development Features

### Cache Hit/Miss Logging

When `NODE_ENV !== 'production'`, cache operations are logged to console:

- ✅ `CACHE HIT` - Data retrieved from Redis
- ❌ `CACHE MISS` - Data fetched from MongoDB
- 🗑️ `CACHE INVALIDATED` - Cache key(s) deleted
- 🔴 `CACHE DISABLED` - Redis unavailable, using MongoDB

### Testing Without Redis

The system works perfectly without Redis. If `REDIS_URL` is not configured or Redis is unavailable:

1. Warning logged on startup: `⚠️ REDIS_URL not configured - Redis caching disabled`
2. All requests fall back to MongoDB
3. No crashes or errors
4. Cache functions silently skip Redis operations

## Best Practices Followed

✅ **Do**
- Keep cache keys human-readable: `product:123`, `cart:user:456`
- Use explicit invalidation on mutations
- Set appropriate TTLs based on data volatility
- Log cache operations in development
- Handle Redis failures gracefully

❌ **Don't**
- Cache auth tokens or payment secrets
- Rely solely on TTL for invalidation
- Use Redis as primary data store
- Let Redis failures crash the server

## Performance Benefits

### Expected Improvements

1. **Categories**: 24-hour cache → ~95% reduction in DB queries
2. **Product Lists**: 5-minute cache → Significant reduction for browsing patterns
3. **Product Details**: 30-minute cache → Major improvement for popular products
4. **Cart**: Redis-first → Near-instant cart operations for active users
5. **Analytics**: 2-5 minute cache → Dashboard loads 10-50x faster
6. **User Profile**: 5-minute cache → Reduced auth overhead

### Optimistic UI Support

The Redis-first cart pattern enables:
- Instant cart updates in the UI
- Optimistic adds/removes with immediate feedback
- Reduced loading states
- Better mobile experience

## Monitoring

### Key Metrics to Watch

1. **Cache Hit Rate**: Should be >70% for frequently accessed data
2. **Redis Availability**: Monitor connection status
3. **Response Times**: Should decrease significantly for cached endpoints
4. **Memory Usage**: Monitor Redis memory consumption

### Redis CLI Commands for Debugging

```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# Check specific key
GET "categories:all"

# Check TTL
TTL "product:123"

# Delete specific key
DEL "products:list:abc123"

# Delete pattern
KEYS "products:list:*" | xargs redis-cli DEL

# Monitor real-time commands
MONITOR

# View memory usage
INFO memory
```

## Troubleshooting

### Redis Connection Issues

**Symptom**: Server starts but shows `⚠️ REDIS_URL not configured`

**Solution**: Add `REDIS_URL` to `.env` file

---

**Symptom**: `❌ Redis error: ECONNREFUSED`

**Solution**: Ensure Redis server is running
```bash
# Start Redis locally
redis-server
# Or using Docker
docker run -d -p 6379:6379 redis
```

### Cache Not Invalidating

**Issue**: Stale data being served

**Debug Steps**:
1. Check invalidation logic in controller
2. Verify cache key matches exactly
3. Use Redis CLI to manually delete: `DEL "key:name"`

### Memory Issues

**Issue**: Redis consuming too much memory

**Solutions**:
1. Reduce TTLs for large data
2. Set Redis `maxmemory` policy: `maxmemory-policy allkeys-lru`
3. Monitor key counts: `DBSIZE`

## Future Enhancements

Potential improvements:
1. **Rate limiting** - Use Redis for distributed rate limiting
2. **Session storage** - Store refresh tokens in Redis
3. **Pub/Sub** - Real-time notifications via Redis pub/sub
4. **Bull Queues** - Background jobs with Redis-backed queues
5. **Leaderboards** - Redis sorted sets for rankings

## Security Considerations

- Auth tokens are **NOT** cached
- Payment information is **NOT** cached
- User passwords are **NOT** cached
- Sensitive data has shorter TTLs
- Redis should be behind firewall (not public)

## Summary

Redis has been successfully integrated as a performance-enhancing cache layer while maintaining MongoDB as the authoritative data source. The implementation follows best practices with graceful fallback, explicit invalidation, and comprehensive logging for development and debugging.
