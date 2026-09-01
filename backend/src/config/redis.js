const { Redis } = require('@upstash/redis');

let redisClient = null;
let isConnected = false;

/**
 * Initialize Upstash Redis REST Client
 */
function createRedisClient() {
  if (redisClient) return redisClient;

  const url = String(process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();

  if (!url || !token) {
    console.warn('⚠️  UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured - Redis caching disabled');
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });

    // Test connection asynchronously
    redisClient
      .ping()
      .then((res) => {
        if (res === 'PONG' || res) {
          isConnected = true;
          console.log('✅ Upstash Redis connected successfully');
        }
      })
      .catch((err) => {
        isConnected = false;
        console.warn('⚠️  Upstash Redis connection failed:', err.message || err);
      });

    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Upstash Redis client:', error.message);
    redisClient = null;
    isConnected = false;
    return null;
  }
}

function getRedisClient() {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
}

function isRedisAvailable() {
  return redisClient !== null && isConnected;
}

async function closeRedis() {
  redisClient = null;
  isConnected = false;
  console.log('✅ Upstash Redis client closed');
}

module.exports = {
  createRedisClient,
  getRedisClient,
  isRedisAvailable,
  closeRedis
};
