import { z } from 'zod';
declare const StockSearchSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
}, {
    query: string;
    limit?: number | undefined;
}>;
declare const StockDataSchema: z.ZodObject<{
    symbol: z.ZodString;
    timeframe: z.ZodDefault<z.ZodEnum<["1m", "5m", "15m", "1h", "1d", "1w", "1M"]>>;
    period: z.ZodDefault<z.ZodEnum<["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    timeframe: "1m" | "5m" | "15m" | "1h" | "1d" | "1w" | "1M";
    period: "max" | "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "10y" | "ytd";
}, {
    symbol: string;
    timeframe?: "1m" | "5m" | "15m" | "1h" | "1d" | "1w" | "1M" | undefined;
    period?: "max" | "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "10y" | "ytd" | undefined;
}>;
declare const TechnicalIndicatorsSchema: z.ZodObject<{
    symbol: z.ZodString;
    indicators: z.ZodArray<z.ZodEnum<["RSI", "MACD", "SMA", "EMA", "BB", "STOCH", "ADX", "CCI", "WILLR", "MOM"]>, "many">;
    timeframe: z.ZodDefault<z.ZodEnum<["1d", "1w", "1m", "3m", "6m", "1y"]>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    timeframe: "1m" | "1d" | "1w" | "1y" | "3m" | "6m";
    indicators: ("RSI" | "MACD" | "SMA" | "EMA" | "BB" | "STOCH" | "ADX" | "CCI" | "WILLR" | "MOM")[];
}, {
    symbol: string;
    indicators: ("RSI" | "MACD" | "SMA" | "EMA" | "BB" | "STOCH" | "ADX" | "CCI" | "WILLR" | "MOM")[];
    timeframe?: "1m" | "1d" | "1w" | "1y" | "3m" | "6m" | undefined;
}>;
export declare class StockDataService {
    private static isInitialized;
    private static cache;
    private static CACHE_TTL;
    static initialize(): Promise<void>;
    private static testAPIConnections;
    private static testAlphaVantage;
    private static testIEXCloud;
    private static testYahooFinance;
    static searchStocks(request: z.infer<typeof StockSearchSchema>): Promise<any>;
    static getStockData(request: z.infer<typeof StockDataSchema>): Promise<any>;
    static getTechnicalIndicators(request: z.infer<typeof TechnicalIndicatorsSchema>): Promise<any>;
    static getMarketOverview(): Promise<any>;
    private static searchAlphaVantage;
    private static searchYahooFinance;
    private static searchIEXCloud;
    private static getDataFromYahooFinance;
    private static getDataFromAlphaVantage;
    private static getDataFromIEXCloud;
    private static getIndexData;
    private static calculateTechnicalIndicators;
    private static calculateRSI;
    private static calculateMACD;
    private static calculateSMA;
    private static calculateEMA;
    private static calculateBollingerBands;
    private static deduplicateStocks;
    private static getFromCache;
    private static setCache;
    private static calculateFromTime;
    private static mapTimeframeToResolution;
}
export {};
//# sourceMappingURL=stockData.d.ts.map