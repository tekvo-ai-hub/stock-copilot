import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

export class RedisService {
  private static client: RedisClientType;
  private static isConnected = false;

  public static async initialize() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Redis initialization failed:', error);
      throw error;
    }
  }

  public static async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis client disconnected');
      }
    } catch (error) {
      logger.error('Redis disconnection failed:', error);
    }
  }

  public static getClient(): RedisClientType {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected');
    }
    return this.client;
  }

  public static isHealthy(): boolean {
    return this.isConnected;
  }

  // Cache operations
  public static async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error('Redis SET failed:', error);
      throw error;
    }
  }

  public static async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET failed:', error);
      throw error;
    }
  }

  public static async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL failed:', error);
      throw error;
    }
  }

  public static async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS failed:', error);
      throw error;
    }
  }

  public static async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      logger.error('Redis EXPIRE failed:', error);
      throw error;
    }
  }

  // Hash operations
  public static async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.hSet(key, field, serializedValue);
    } catch (error) {
      logger.error('Redis HSET failed:', error);
      throw error;
    }
  }

  public static async hget(key: string, field: string): Promise<any> {
    try {
      const value = await this.client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis HGET failed:', error);
      throw error;
    }
  }

  public static async hgetall(key: string): Promise<Record<string, any>> {
    try {
      const hash = await this.client.hGetAll(key);
      const result: Record<string, any> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error('Redis HGETALL failed:', error);
      throw error;
    }
  }

  // List operations
  public static async lpush(key: string, ...values: any[]): Promise<void> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      await this.client.lPush(key, serializedValues);
    } catch (error) {
      logger.error('Redis LPUSH failed:', error);
      throw error;
    }
  }

  public static async rpush(key: string, ...values: any[]): Promise<void> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      await this.client.rPush(key, serializedValues);
    } catch (error) {
      logger.error('Redis RPUSH failed:', error);
      throw error;
    }
  }

  public static async lrange(key: string, start: number, stop: number): Promise<any[]> {
    try {
      const values = await this.client.lRange(key, start, stop);
      return values.map(v => JSON.parse(v));
    } catch (error) {
      logger.error('Redis LRANGE failed:', error);
      throw error;
    }
  }

  // Set operations
  public static async sadd(key: string, ...members: any[]): Promise<void> {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      await this.client.sAdd(key, serializedMembers);
    } catch (error) {
      logger.error('Redis SADD failed:', error);
      throw error;
    }
  }

  public static async smembers(key: string): Promise<any[]> {
    try {
      const members = await this.client.sMembers(key);
      return members.map(m => JSON.parse(m));
    } catch (error) {
      logger.error('Redis SMEMBERS failed:', error);
      throw error;
    }
  }

  // Session operations
  public static async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttl);
  }

  public static async getSession(sessionId: string): Promise<any> {
    return await this.get(`session:${sessionId}`);
  }

  public static async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Cache with TTL
  public static async cache(key: string, fetcher: () => Promise<any>, ttl: number = 300): Promise<any> {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch data
      const data = await fetcher();
      
      // Store in cache
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      logger.error('Cache operation failed:', error);
      // If cache fails, still try to fetch data
      return await fetcher();
    }
  }
}
