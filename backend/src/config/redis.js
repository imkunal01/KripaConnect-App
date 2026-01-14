const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;
let recentErrorCount = 0;
let lastErrorAt = 0;

function createRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = String(process.env.REDIS_URL || '').trim();
  
  if (!redisUrl) {
    console.warn('⚠️  REDIS_URL not configured - Redis caching disabled');
    return null;
  }

  try {
    const isProd = process.env.NODE_ENV === 'production';
    const usesTls = redisUrl.startsWith('rediss://');

    redisClient = new Redis(redisUrl, {
      enableReadyCheck: true,
      connectTimeout: 10_000,
      // Cache calls should fail fast and fall back to Mongo.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,

      // In dev, stop retrying after a few attempts to avoid log spam when Redis isn't running.
      retryStrategy(times) {
        if (!isProd && times >= 5) return null;
        const delay = Math.min(times * 100, 2000);
        return delay;
      },

      // Some managed Redis providers require TLS.
      ...(usesTls ? { tls: { rejectUnauthorized: false } } : {}),

      reconnectOnError(err) {
        const message = String(err?.message || '');
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE'];
        return targetErrors.some(target => message.includes(target));
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      const now = Date.now();
      if (now - lastErrorAt > 30_000) recentErrorCount = 0;
      lastErrorAt = now;
      recentErrorCount += 1;

      const message = err?.message || err?.code || String(err);
      console.error('❌ Redis error:', message);
      isConnected = false;

      // In dev, disable Redis entirely after repeated failures.
      if (process.env.NODE_ENV !== 'production' && recentErrorCount >= 3) {
        console.warn('⚠️  Redis unavailable; disabling cache for this process (dev).');
        try {
          redisClient.disconnect();
        } catch (_) {}
        redisClient = null;
        isConnected = false;
      }
    });

    redisClient.on('close', () => {
      console.warn('⚠️  Redis connection closed');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Redis reconnecting...');
      }
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Failed to create Redis client:', error.message);
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
  return redisClient && isConnected;
}

async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    console.log('✅ Redis connection closed gracefully');
  }
}

module.exports = {
  createRedisClient,
  getRedisClient,
  isRedisAvailable,
  closeRedis
};


