# Redis Implementation Report for KripaConnect

## 1. Introduction

Redis has been implemented in the KripaConnect backend as a caching layer to improve API response time and reduce repeated MongoDB queries. The project still uses MongoDB as the main database and source of truth. Redis is only used to store temporary copies of frequently requested data, such as categories, products, user cart data, favorites, user profile data, and admin analytics.

This design improves performance without making the application dependent on Redis for correctness. If Redis is unavailable, the backend falls back to MongoDB and continues working.

## 2. Redis Dependency and Environment Setup

Redis is added in the backend through the `ioredis` package in `backend/package.json`.

The Redis connection URL is configured through the environment variable:

```env
REDIS_URL=redis://localhost:6379
```

This value is also included in `backend/.env.example`, which makes the Redis requirement clear for local development or deployment.

## 3. Redis Client Initialization

Redis is initialized in `backend/src/server.js` by importing and calling `createRedisClient()` from `backend/src/config/redis.js`.

The Redis client is created using `ioredis`:

```javascript
redisClient = new Redis(redisUrl, {
  enableReadyCheck: true,
  connectTimeout: 10_000,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (!isProd && times >= 5) return null;
    return Math.min(times * 100, 2000);
  },
  ...(usesTls ? { tls: { rejectUnauthorized: false } } : {})
});
```

Important implementation points:

- Redis URL is read from `process.env.REDIS_URL`.
- If `REDIS_URL` is missing, caching is disabled gracefully.
- The connection uses a 10 second timeout.
- `maxRetriesPerRequest: 1` makes cache requests fail fast.
- `enableOfflineQueue: false` prevents Redis commands from waiting in a queue when Redis is down.
- `rediss://` URLs automatically enable TLS support for managed Redis providers.
- Connection events update an internal `isConnected` flag.
- In development, repeated Redis failures disable Redis for the current process to avoid constant retry noise.

This means Redis improves performance when available, but the backend does not crash if Redis is missing or temporarily unavailable.

## 4. Cache Utility Layer

The main Redis logic is centralized in `backend/src/utils/cacheUtils.js`. This file provides reusable helper functions so controllers do not directly deal with low-level Redis commands.

The most important helper is `getOrSetCache(key, ttl, fetchFn, logHitMiss)`.

Its flow is:

1. Check whether Redis is available.
2. If Redis is unavailable, directly execute `fetchFn()` and return fresh MongoDB data.
3. If Redis is available, try `redis.get(key)`.
4. If cached data exists, parse it from JSON and return it.
5. If the cache is empty, fetch fresh data from MongoDB.
6. Store the fresh result in Redis using `setex(key, ttl, JSON.stringify(data))`.
7. Return the fresh result.

Other helpers include:

- `getCache(key)` for direct Redis reads.
- `setCache(key, data, ttl)` for direct Redis writes with expiry.
- `invalidateCache(key)` for deleting one cache key.
- `invalidateMultipleKeys(keys)` for deleting multiple keys together.
- `invalidatePattern(pattern)` for deleting all keys matching a Redis pattern.
- `hashQueryParams(params)` for creating consistent product-list cache keys from query filters.

This helper layer keeps the caching implementation consistent across the backend.

## 5. Areas Where Redis Is Implemented

### 5.1 Categories Cache

File: `backend/src/controllers/categoryController.js`

Endpoint:

```http
GET /api/categories
```

Cache key:

```text
categories:all
```

TTL:

```text
86400 seconds, or 24 hours
```

The category list is a good cache target because categories do not change frequently but are needed often by the frontend for navigation, filters, and product browsing.

Whenever a category is created, updated, deleted, or its status changes, the `categories:all` cache is invalidated.

Performance improvement:

- Reduces repeated category queries.
- Makes category menus and filters load faster.
- Helps most pages that depend on category data.

### 5.2 Product List Cache

File: `backend/src/controllers/productController.js`

Endpoint:

```http
GET /api/products
```

Cache key pattern:

```text
products:list:{hash_of_query_params}
```

TTL:

```text
300 seconds, or 5 minutes
```

The product list endpoint supports pagination, search, category filters, subcategory filters, price filters, availability, brand/tags, and sorting. Because different query parameters produce different product lists, the implementation creates a unique cache key by hashing `req.query` using `hashQueryParams()`.

Example:

```javascript
const queryHash = hashQueryParams(req.query);
const cacheKey = `products:list:${queryHash}`;
```

When a product is created, updated, or deleted, all product list caches are invalidated using:

```javascript
invalidatePattern('products:list:*')
```

Performance improvement:

- Reduces expensive filtered product queries.
- Avoids repeated `countDocuments()` calls for the same filter.
- Improves browsing, searching, pagination, and category pages.
- Helps during high traffic because many users often request similar product lists.

### 5.3 Single Product Cache

File: `backend/src/controllers/productController.js`

Endpoint:

```http
GET /api/products/:id
```

Cache key:

```text
product:{productId}
```

TTL:

```text
1800 seconds, or 30 minutes
```

The product detail endpoint fetches a product by ID and populates category and subcategory details. This is cached because product detail pages may be visited repeatedly, especially for popular products.

The product detail cache is invalidated when:

- The product is updated.
- The product is deleted.
- A product image is removed.

Performance improvement:

- Reduces repeated product detail queries.
- Avoids repeated populate operations for the same product.
- Improves product detail page loading speed.

### 5.4 Cart Cache

File: `backend/src/controllers/cartController.js`

Endpoint group:

```http
/api/cart/*
```

Cache key:

```text
cart:user:{userId}
```

TTL:

```text
86400 seconds, or 24 hours
```

The cart uses a Redis-first read pattern:

1. `getCart()` checks Redis first using `getCache(cacheKey)`.
2. If Redis has cart data, the backend returns it immediately.
3. If Redis does not have cart data, the backend fetches the cart from MongoDB.
4. The MongoDB result is mapped into frontend-ready cart data.
5. The mapped cart is saved in Redis for future reads.

All cart writes still update MongoDB first. After add, update, or remove operations, the cart cache is invalidated:

```javascript
invalidateCache(`cart:user:${req.user._id}`)
```

Performance improvement:

- Speeds up repeated cart page loads.
- Reduces repeated user-cart population from MongoDB.
- Improves mobile user experience because cart data can be returned quickly after the first load.
- Supports smoother optimistic UI behavior on the frontend because cart mutations return updated item data directly and invalidate stale cache.

Note:

The current cart cache key uses only the user ID. Since cart display can depend on `purchaseMode`, a future improvement would be to include purchase mode in the cache key for retailer users, for example `cart:user:{userId}:{purchaseMode}`.

### 5.5 User Profile Cache

File: `backend/src/controllers/authController.js`

Endpoint:

```http
GET /api/auth/profile
```

Cache key:

```text
user:profile:{userId}
```

TTL:

```text
300 seconds, or 5 minutes
```

The profile endpoint reads the logged-in user's profile without the password field. Redis stores this profile for a short time.

The profile cache is invalidated when:

- The user updates profile details.
- The user updates address details.
- The user uploads a profile photo.

Performance improvement:

- Reduces repeated user profile reads.
- Helps pages that need user data after login.
- Keeps profile reads fast while still refreshing quickly after updates.

### 5.6 Favorites Cache

File: `backend/src/controllers/favoriteController.js`

Endpoint group:

```http
/api/favorites/*
```

Cache key:

```text
favorites:user:{userId}
```

TTL:

```text
600 seconds, or 10 minutes
```

Favorites are cached per user. The backend fetches the user favorites list, populates product details, filters deleted products, and stores the cleaned result in Redis.

The favorites cache is invalidated when:

- A favorite product is added.
- A favorite product is removed.

Performance improvement:

- Reduces repeated favorite-list population.
- Makes the favorites page faster after the first request.
- Keeps the user-specific cache isolated by user ID.

### 5.7 Admin Analytics Cache

File: `backend/src/controllers/analyticsControllers.js`

Endpoint group:

```http
/api/analytics/*
```

Cached analytics keys:

| Analytics data | Cache key | TTL |
| --- | --- | --- |
| Overview stats | `analytics:overview` | 300 seconds |
| Revenue stats | `analytics:revenue` | 300 seconds |
| Order status stats | `analytics:orders` | 120 seconds |
| Top products | `analytics:top-products` | 300 seconds |
| User growth | `analytics:user-growth` | 300 seconds |
| Low stock products | `analytics:low-stock` | 120 seconds |

Analytics endpoints are strong Redis candidates because they use count queries and aggregation pipelines. These operations can become expensive as orders, users, and products grow.

Order-related analytics caches are invalidated in `backend/src/controllers/orderController.js` when:

- A new order is created.
- An order status is updated.
- An order is cancelled.
- An order is deleted.

Performance improvement:

- Reduces repeated MongoDB aggregation work.
- Makes admin dashboard charts and metrics load faster.
- Prevents the dashboard from recalculating the same values on every request.

## 6. Cache Invalidation Strategy

The project uses explicit invalidation. This means cached data is deleted when the underlying MongoDB data changes.

Examples:

- Product create, update, delete: invalidate product list caches.
- Product update, delete, image removal: invalidate single product cache.
- Category create, update, delete, status update: invalidate category cache.
- Cart add, update, remove: invalidate cart cache.
- Favorite add, remove: invalidate favorites cache.
- Profile update, photo upload: invalidate user profile cache.
- Order create, status update, cancel, delete: invalidate related analytics caches.

This strategy helps prevent stale data from being served while still using TTLs as a secondary safety mechanism.

## 7. Why Redis Improves Performance in This Project

Redis improves performance mainly because it avoids repeated database work for data that is requested often but changes less frequently.

The biggest performance gains are in:

1. Product browsing and filtering
   Product list queries involve filtering, pagination, sorting, counting, and population. Redis stores repeated query results for 5 minutes, which reduces MongoDB load during browsing.

2. Product detail pages
   Popular products can be viewed many times. Redis avoids repeating the same product lookup and populate operations.

3. Categories
   Categories are needed across many frontend pages but change rarely. A 24 hour cache makes these reads very cheap.

4. Cart reads
   Cart reads require loading the user's cart and product information. Redis allows repeated cart reads to be served quickly after the first request.

5. Favorites
   Favorites require a user lookup and product population. Redis reduces repeated work for the favorites page.

6. User profile
   Profile data is requested after login and across protected pages. A short cache reduces repeated user reads.

7. Admin analytics
   Analytics queries use counts and aggregations. Redis prevents the same dashboard metrics from being recalculated on every admin request.

## 8. Reliability and Fallback Behavior

The Redis implementation is designed for graceful degradation.

If Redis is not configured or unavailable:

- The backend logs a warning.
- Cache reads are skipped.
- Cache writes and invalidations are skipped.
- Controllers fetch directly from MongoDB.
- API behavior remains correct.

This is important because Redis should improve speed, but it should not become a single point of failure.

## 9. Security Considerations

The implementation avoids caching highly sensitive data such as:

- Passwords.
- Payment secrets.
- JWT access tokens.
- Refresh tokens.

User profile data is cached without the password field, and payment/auth flows continue to rely on MongoDB and secure cookies instead of Redis.

## 10. Conclusion

Redis is implemented in KripaConnect as a performance-focused caching layer. The backend uses `ioredis` for connection management, a shared cache utility layer for reusable cache operations, and controller-level caching for high-read endpoints.

The main performance improvements are reduced MongoDB reads, faster repeated API responses, quicker product browsing, faster cart and favorites loading, and much faster admin analytics. The implementation also follows a reliable design: MongoDB remains the source of truth, Redis has TTL-based cache expiry, and important mutations explicitly invalidate affected cache keys.

