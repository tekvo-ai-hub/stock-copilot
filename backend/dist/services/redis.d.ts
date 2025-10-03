import { RedisClientType } from 'redis';
export declare class RedisService {
    private static client;
    private static isConnected;
    static initialize(): Promise<void>;
    static disconnect(): Promise<void>;
    static getClient(): RedisClientType;
    static isHealthy(): boolean;
    static set(key: string, value: any, ttl?: number): Promise<void>;
    static get(key: string): Promise<any>;
    static del(key: string): Promise<void>;
    static exists(key: string): Promise<boolean>;
    static expire(key: string, ttl: number): Promise<void>;
    static hset(key: string, field: string, value: any): Promise<void>;
    static hget(key: string, field: string): Promise<any>;
    static hgetall(key: string): Promise<Record<string, any>>;
    static lpush(key: string, ...values: any[]): Promise<void>;
    static rpush(key: string, ...values: any[]): Promise<void>;
    static lrange(key: string, start: number, stop: number): Promise<any[]>;
    static sadd(key: string, ...members: any[]): Promise<void>;
    static smembers(key: string): Promise<any[]>;
    static setSession(sessionId: string, data: any, ttl?: number): Promise<void>;
    static getSession(sessionId: string): Promise<any>;
    static deleteSession(sessionId: string): Promise<void>;
    static cache(key: string, fetcher: () => Promise<any>, ttl?: number): Promise<any>;
}
//# sourceMappingURL=redis.d.ts.map