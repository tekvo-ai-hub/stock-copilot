export declare class FinnhubService {
    private static isInitialized;
    private static cache;
    private static CACHE_TTL;
    private static NEWS_CACHE_TTL;
    static initialize(): Promise<void>;
    private static testConnection;
    static getQuote(symbol: string): Promise<any>;
    static getCompanyProfile(symbol: string): Promise<any>;
    static searchStocks(query: string, limit?: number): Promise<any>;
    static getMarketNews(category?: string, limit?: number): Promise<any>;
    static getCompanyNews(symbol: string, from: string, to: string, limit?: number): Promise<any>;
    static getMarketStatus(): Promise<any>;
    static getStockCandles(symbol: string, resolution: string, from: number, to: number): Promise<any>;
    static getTechnicalIndicators(symbol: string, resolution: string, from: number, to: number): Promise<any>;
    static getMarketMovers(type?: 'gainers' | 'losers' | 'most_active', limit?: number): Promise<any>;
    static getSectorPerformance(): Promise<any>;
    private static getCachedData;
    private static setCachedData;
    private static calculateTechnicalIndicators;
    private static calculateSMA;
    private static calculateEMA;
    private static calculateRSI;
    private static calculateMACD;
    private static calculateBollingerBands;
    private static calculateStochastic;
    static isHealthy(): boolean;
    static clearCache(): void;
}
//# sourceMappingURL=finnhub.d.ts.map