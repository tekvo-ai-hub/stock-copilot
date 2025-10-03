export declare class RealtimeDataService {
    private static isRunning;
    private static updateInterval;
    private static subscribedSymbols;
    private static updateFrequency;
    static initialize(): Promise<void>;
    static startRealTimeUpdates(): void;
    static stopRealTimeUpdates(): void;
    static subscribeToSymbol(symbol: string): void;
    static unsubscribeFromSymbol(symbol: string): void;
    static getSubscribedSymbols(): string[];
    private static updateSubscribedSymbols;
    private static updateMarketData;
    static getRealTimeQuote(symbol: string): Promise<{
        symbol: any;
        price: any;
        change: any;
        changePercent: any;
        high: any;
        low: any;
        open: any;
        previousClose: any;
        timestamp: any;
        lastUpdated: string;
    }>;
    static getRealTimeMarketOverview(): Promise<{
        marketStatus: any;
        movers: {
            gainers: any;
            losers: any;
            mostActive: any;
        };
        sectors: any;
        news: any;
        lastUpdated: string;
    }>;
    static getRealTimeTechnicalIndicators(symbol: string, timeframe?: string): Promise<{
        symbol: string;
        timeframe: string;
        indicators: any;
        lastUpdated: string;
    }>;
    static getRealTimeCompanyNews(symbol: string, limit?: number): Promise<{
        symbol: string;
        news: any;
        lastUpdated: string;
    }>;
    static setUpdateFrequency(frequency: number): void;
    static getStatus(): {
        isRunning: boolean;
        subscribedSymbols: string[];
        updateFrequency: number;
        lastUpdate: string;
    };
    private static calculateFromTime;
    private static mapTimeframeToResolution;
    static isHealthy(): boolean;
}
//# sourceMappingURL=realtimeData.d.ts.map