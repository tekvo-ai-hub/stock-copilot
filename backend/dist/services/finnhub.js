"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinnhubService = void 0;
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const logger_1 = require("@/utils/logger");
const FINNHUB_CONFIG = {
    baseURL: 'https://finnhub.io/api/v1',
    apiKey: process.env.FINNHUB_API_KEY,
    timeout: 10000,
};
const StockQuoteSchema = zod_1.z.object({
    c: zod_1.z.number(),
    d: zod_1.z.number(),
    dp: zod_1.z.number(),
    h: zod_1.z.number(),
    l: zod_1.z.number(),
    o: zod_1.z.number(),
    pc: zod_1.z.number(),
    t: zod_1.z.number(),
});
const CompanyProfileSchema = zod_1.z.object({
    country: zod_1.z.string(),
    currency: zod_1.z.string(),
    exchange: zod_1.z.string(),
    ipo: zod_1.z.string(),
    marketCapitalization: zod_1.z.number(),
    name: zod_1.z.string(),
    phone: zod_1.z.string(),
    shareOutstanding: zod_1.z.number(),
    ticker: zod_1.z.string(),
    weburl: zod_1.z.string(),
    logo: zod_1.z.string(),
    finnhubIndustry: zod_1.z.string(),
});
const NewsSchema = zod_1.z.object({
    category: zod_1.z.string(),
    datetime: zod_1.z.number(),
    headline: zod_1.z.string(),
    id: zod_1.z.number(),
    image: zod_1.z.string(),
    related: zod_1.z.string(),
    source: zod_1.z.string(),
    summary: zod_1.z.string(),
    url: zod_1.z.string(),
});
const MarketStatusSchema = zod_1.z.object({
    exchange: zod_1.z.string(),
    isOpen: zod_1.z.boolean(),
    session: zod_1.z.string(),
    tz: zod_1.z.string(),
});
class FinnhubService {
    static isInitialized = false;
    static cache = new Map();
    static CACHE_TTL = 60 * 1000;
    static NEWS_CACHE_TTL = 5 * 60 * 1000;
    static async initialize() {
        try {
            if (!FINNHUB_CONFIG.apiKey) {
                throw new Error('FINNHUB_API_KEY is required');
            }
            await this.testConnection();
            this.isInitialized = true;
            logger_1.logger.info('✅ Finnhub Service initialized');
        }
        catch (error) {
            logger_1.logger.error('❌ Finnhub Service initialization failed:', error);
            throw error;
        }
    }
    static async testConnection() {
        try {
            const response = await axios_1.default.get(`${FINNHUB_CONFIG.baseURL}/quote`, {
                params: {
                    symbol: 'AAPL',
                    token: FINNHUB_CONFIG.apiKey,
                },
                timeout: 5000,
            });
            if (response.status !== 200) {
                throw new Error(`API test failed with status: ${response.status}`);
            }
        }
        catch (error) {
            throw new Error(`Finnhub API connection failed: ${error}`);
        }
    }
    static async getQuote(symbol) {
        try {
            const cacheKey = `quote_${symbol}`;
            const cached = this.getCachedData(cacheKey);
            if (cached)
                return cached;
            const response = await axios_1.default.get(`${FINNHUB_CONFIG.baseURL}/quote`, {
                params: {
                    symbol: symbol.toUpperCase(),
                    token: FINNHUB_CONFIG.apiKey,
                },
                timeout: FINNHUB_CONFIG.timeout,
            });
            const quote = StockQuoteSchema.parse(response.data);
            this.setCachedData(cacheKey, quote);
            return {
                symbol: symbol.toUpperCase(),
                currentPrice: quote.c,
                change: quote.d,
                changePercent: quote.dp,
                high: quote.h,
                low: quote.l,
                open: quote.o,
                previousClose: quote.pc,
                timestamp: quote.t * 1000,
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get quote for ${symbol}:`, error);
            throw new Error(`Failed to get quote for ${symbol}`);
        }
    }
    static async getCompanyProfile(symbol) {
        try {
            const cacheKey = `profile_${symbol}`;
            const cached = this.getCachedData(cacheKey, 24 * 60 * 60 * 1000);
            if (cached)
                return cached;
            const response = await axios_1.default.get(`${FINNHUB_CONFIG.baseURL}/stock/profile2`, {
                params: {
                    symbol: symbol.toUpperCase(),
                    token: FINNHUB_CONFIG.apiKey,
                },
                timeout: FINNHUB_CONFIG.timeout,
            });
            const profile = CompanyProfileSchema.parse(response.data);
            this.setCachedData(cacheKey, profile, 24 * 60 * 60 * 1000);
            return {
                symbol: profile.ticker,
                name: profile.name,
                country: profile.country,
                currency: profile.currency,
                exchange: profile.exchange,
                ipo: profile.ipo,
                marketCap: profile.marketCapitalization,
                phone: profile.phone,
                sharesOutstanding: profile.shareOutstanding,
                website: profile.weburl,
                logo: profile.logo,
                industry: profile.finnhubIndustry,
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get company profile for ${symbol}:`, error);
            throw new Error(`Failed to get company profile for ${symbol}`);
        }
    }
    static async searchStocks(query, limit = 10) {
        try {
            const cacheKey = `search_${query}_${limit}`;
            const cached = this.getCachedData(cacheKey, 5 * 60 * 1000);
            if (cached)
                return cached;
            const response = await axios_1.default.get(`${FINNHUB_CONFIG.baseURL}/search`, {
                params: {
                    q: query,
                    token: FINNHUB_CONFIG.apiKey,
                },
                timeout: FINNHUB_CONFIG.timeout,
            });
            const results = response.data.result || [];
            const limitedResults = results.slice(0, limit).map((stock) => ({
                symbol: stock.symbol,
                name: stock.description,
                exchange: stock.type,
                displaySymbol: stock.displaySymbol,
            }));
            this.setCachedData(cacheKey, limitedResults, 5 * 60 * 1000);
            return limitedResults;
        }
        catch (error) {
            logger_1.logger.error(`Failed to search stocks for query "${query}":`, error);
            throw new Error(`Failed to search stocks for query "${query}"`);
        }
    }
    static async getMarketNews(category = 'general', limit = 20) {
        try {
            const cacheKey = `news_${category}_${limit}`;
            const cached = this.getCachedData(cacheKey, this.NEWS_CACHE_TTL);
            if (cached)
                return cached;
            const response = await axios_1.default.get(`${FINNHUB_CONFIG.baseURL}/news`, {
                params: {
                    category: category,
                    token: FINNHUB_CONFIG.apiKey,
                },
                timeout: FINNHUB_CONFIG.timeout,
            });
            const news = response.data.slice(0, limit).map((article) => ({
                id: article.id,
                headline: article.headline,
                summary: article.summary,
                source: article.source,
                category: article.category,
                image: article.image,
                url: article.url,
                publishedAt: new Date(article.datetime * 1000).toISOString(),
                related: article.related,
            }));
            this.setCachedData(cacheKey, news, this.NEWS_CACHE_TTL);
            return news;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get market news for category "${category}":`, error);
            throw new Error(`Failed to get market news for category "${category}"`);
        }
    }
    static async getCompanyNews(symbol, from, to, limit = 20) {
        try {
            const cacheKey = `company_news_${symbol}_${from}_${to}`;
            const cached = this.getCachedData(cacheKey, this.NEWS_CACHE_TTL);
            if (cached)
                return cached;
            const response = await axios_1.default.get(`${FINNHUB_CONFIG.baseURL}/company-news`, {
                params: {
                    symbol: symbol.toUpperCase(),
                    from: from,
                    to: to,
                    token: FINNHUB_CONFIG.apiKey,
                },
                timeout: FINNHUB_CONFIG.timeout,
            });
            const news = response.data.slice(0, limit).map((article) => ({
                id: article.id,
                headline: article.headline,
                summary: article.summary,
                source: article.source,
                image: article.image,
                url: article.url,
                publishedAt: new Date(article.datetime * 1000).toISOString(),
                related: article.related,
            }));
            this.setCachedData(cacheKey, news, this.NEWS_CACHE_TTL);
            return news;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get company news for ${symbol}:`, error);
            throw new Error(`Failed to get company news for ${symbol}`);
        }
    }
    static async getMarketStatus() {
        try {
            const cacheKey = 'market_status';
            const cached = this.getCachedData(cacheKey, 60 * 1000);
            if (cached)
                return cached;
            const response = await axios_1.default.get(`${FINNHUB_CONFIG.baseURL}/stock/market-status`, {
                params: {
                    exchange: 'US',
                    token: FINNHUB_CONFIG.apiKey,
                },
                timeout: FINNHUB_CONFIG.timeout,
            });
            const status = MarketStatusSchema.parse(response.data);
            this.setCachedData(cacheKey, status, 60 * 1000);
            return {
                exchange: status.exchange,
                isOpen: status.isOpen,
                session: status.session,
                timezone: status.tz,
                lastUpdated: new Date().toISOString(),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get market status:', error);
            throw new Error('Failed to get market status');
        }
    }
    static async getStockCandles(symbol, resolution, from, to) {
        try {
            const cacheKey = `candles_${symbol}_${resolution}_${from}_${to}`;
            const cached = this.getCachedData(cacheKey, 5 * 60 * 1000);
            if (cached)
                return cached;
            const response = await axios_1.default.get(`${FINNHUB_CONFIG.baseURL}/stock/candle`, {
                params: {
                    symbol: symbol.toUpperCase(),
                    resolution: resolution,
                    from: from,
                    to: to,
                    token: FINNHUB_CONFIG.apiKey,
                },
                timeout: FINNHUB_CONFIG.timeout,
            });
            const data = response.data;
            if (data.s === 'no_data') {
                return [];
            }
            const candles = data.t.map((timestamp, index) => ({
                timestamp: timestamp * 1000,
                open: data.o[index],
                high: data.h[index],
                low: data.l[index],
                close: data.c[index],
                volume: data.v[index],
            }));
            this.setCachedData(cacheKey, candles, 5 * 60 * 1000);
            return candles;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get stock candles for ${symbol}:`, error);
            throw new Error(`Failed to get stock candles for ${symbol}`);
        }
    }
    static async getTechnicalIndicators(symbol, resolution, from, to) {
        try {
            const cacheKey = `indicators_${symbol}_${resolution}_${from}_${to}`;
            const cached = this.getCachedData(cacheKey, 5 * 60 * 1000);
            if (cached)
                return cached;
            const candles = await this.getStockCandles(symbol, resolution, from, to);
            if (candles.length === 0) {
                return {};
            }
            const indicators = this.calculateTechnicalIndicators(candles);
            this.setCachedData(cacheKey, indicators, 5 * 60 * 1000);
            return indicators;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get technical indicators for ${symbol}:`, error);
            throw new Error(`Failed to get technical indicators for ${symbol}`);
        }
    }
    static async getMarketMovers(type = 'gainers', limit = 10) {
        try {
            const cacheKey = `movers_${type}_${limit}`;
            const cached = this.getCachedData(cacheKey, 2 * 60 * 1000);
            if (cached)
                return cached;
            const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC'];
            const quotes = await Promise.all(popularStocks.map(async (symbol) => {
                try {
                    const quote = await this.getQuote(symbol);
                    return {
                        symbol: quote.symbol,
                        name: symbol,
                        price: quote.currentPrice,
                        change: quote.change,
                        changePercent: quote.changePercent,
                        volume: 0,
                    };
                }
                catch (error) {
                    return null;
                }
            }));
            const validQuotes = quotes.filter(quote => quote !== null);
            const sortedQuotes = validQuotes.sort((a, b) => {
                if (type === 'gainers')
                    return b.changePercent - a.changePercent;
                if (type === 'losers')
                    return a.changePercent - b.changePercent;
                return 0;
            });
            const movers = sortedQuotes.slice(0, limit);
            this.setCachedData(cacheKey, movers, 2 * 60 * 1000);
            return movers;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get market movers for type "${type}":`, error);
            throw new Error(`Failed to get market movers for type "${type}"`);
        }
    }
    static async getSectorPerformance() {
        try {
            const cacheKey = 'sector_performance';
            const cached = this.getCachedData(cacheKey, 10 * 60 * 1000);
            if (cached)
                return cached;
            const sectors = [
                { sector: 'Technology', change: 1.2, changePercent: 0.8 },
                { sector: 'Healthcare', change: 0.8, changePercent: 0.5 },
                { sector: 'Energy', change: 2.1, changePercent: 1.3 },
                { sector: 'Financials', change: -0.3, changePercent: -0.2 },
                { sector: 'Consumer Discretionary', change: 0.9, changePercent: 0.6 },
                { sector: 'Consumer Staples', change: 0.4, changePercent: 0.3 },
                { sector: 'Industrials', change: 0.6, changePercent: 0.4 },
                { sector: 'Materials', change: 1.1, changePercent: 0.7 },
                { sector: 'Utilities', change: 0.2, changePercent: 0.1 },
                { sector: 'Real Estate', change: -0.1, changePercent: -0.1 },
            ];
            this.setCachedData(cacheKey, sectors, 10 * 60 * 1000);
            return sectors;
        }
        catch (error) {
            logger_1.logger.error('Failed to get sector performance:', error);
            throw new Error('Failed to get sector performance');
        }
    }
    static getCachedData(key, ttl = this.CACHE_TTL) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data;
        }
        return null;
    }
    static setCachedData(key, data, ttl = this.CACHE_TTL) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }
    static calculateTechnicalIndicators(candles) {
        if (candles.length < 20) {
            return {};
        }
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const volumes = candles.map(c => c.volume);
        return {
            sma20: this.calculateSMA(closes, 20),
            sma50: this.calculateSMA(closes, 50),
            ema12: this.calculateEMA(closes, 12),
            ema26: this.calculateEMA(closes, 26),
            rsi: this.calculateRSI(closes, 14),
            macd: this.calculateMACD(closes),
            bollingerBands: this.calculateBollingerBands(closes, 20, 2),
            stochastic: this.calculateStochastic(highs, lows, closes, 14),
        };
    }
    static calculateSMA(prices, period) {
        if (prices.length < period)
            return null;
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }
    static calculateEMA(prices, period) {
        if (prices.length < period)
            return null;
        const multiplier = 2 / (period + 1);
        let ema = prices[0];
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        return ema;
    }
    static calculateRSI(prices, period = 14) {
        if (prices.length < period + 1)
            return null;
        let gains = 0;
        let losses = 0;
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0)
                gains += change;
            else
                losses -= change;
        }
        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0)
            return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    static calculateMACD(prices) {
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        if (!ema12 || !ema26)
            return null;
        return {
            macd: ema12 - ema26,
            signal: ema12 - ema26,
            histogram: (ema12 - ema26) - (ema12 - ema26),
        };
    }
    static calculateBollingerBands(prices, period = 20, stdDev = 2) {
        if (prices.length < period)
            return null;
        const sma = this.calculateSMA(prices, period);
        if (!sma)
            return null;
        const recentPrices = prices.slice(-period);
        const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        return {
            upper: sma + (standardDeviation * stdDev),
            middle: sma,
            lower: sma - (standardDeviation * stdDev),
        };
    }
    static calculateStochastic(highs, lows, closes, period = 14) {
        if (highs.length < period || lows.length < period || closes.length < period)
            return null;
        const recentHighs = highs.slice(-period);
        const recentLows = lows.slice(-period);
        const recentCloses = closes.slice(-period);
        const highestHigh = Math.max(...recentHighs);
        const lowestLow = Math.min(...recentLows);
        const currentClose = recentCloses[recentCloses.length - 1];
        if (highestHigh === lowestLow)
            return 50;
        const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        return k;
    }
    static isHealthy() {
        return this.isInitialized;
    }
    static clearCache() {
        this.cache.clear();
    }
}
exports.FinnhubService = FinnhubService;
//# sourceMappingURL=finnhub.js.map