import dotenv from 'dotenv';
dotenv.config();

import { Redis } from '@upstash/redis';

let redis = null;
let redisAvailable = false;

// In-memory fallback cache when Redis is unavailable
const memoryCache = new Map();

const memoryFallback = {
  async get(key) {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value;
  },
  async set(key, value, options = {}) {
    const expiresAt = options.ex ? Date.now() + options.ex * 1000 : null;
    memoryCache.set(key, { value, expiresAt });
    return 'OK';
  },
  async del(key) {
    memoryCache.delete(key);
    return 1;
  },
  async ping() {
    return 'PONG';
  },
};

export const redisClient = () => {
  if (redisAvailable && redis) {
    return redis;
  }

  // If Redis was already attempted and failed, use memory fallback
  if (redis === false) {
    return memoryFallback;
  }

  // Check if credentials are configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('⚠️ Redis credentials not configured — using in-memory session cache');
    redis = false;
    return memoryFallback;
  }

  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    redis.ping()
      .then(() => {
        console.log('✅ Redis connected successfully');
        redisAvailable = true;
      })
      .catch((error) => {
        console.warn('⚠️ Redis connection failed — falling back to in-memory cache:', error.message);
        redis = false;
        redisAvailable = false;
      });

    // Return real redis optimistically for the first call;
    // subsequent calls will check redisAvailable flag
    return redis;
  } catch (error) {
    console.warn('⚠️ Redis init error — falling back to in-memory cache:', error.message);
    redis = false;
    return memoryFallback;
  }
};

// Initialize on import — but don't crash if it fails
const initialClient = redisClient();
export default initialClient;
