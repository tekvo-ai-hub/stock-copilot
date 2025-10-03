"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockDataService = void 0;
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const finnhub_1 = require("./finnhub");
const logger_1 = require("@/utils/logger");
const STOCK_APIS = {
    finnhub: {
        baseURL: 'https://finnhub.io/api/v1',
        apiKey: process.env.FINNHUB_API_KEY,
    },
    alphaVantage: {
        baseURL: 'https://www.alphavantage.co/query',
        apiKey: process.env.ALPHA_VANTAGE_API_KEY,
    },
    yahooFinance: {
        baseURL: 'https://query1.finance.yahoo.com/v8/finance/chart',
    },
    iexCloud: {
        baseURL: 'https://cloud.iexapis.com/stable',
        apiKey: process.env.IEX_CLOUD_API_KEY,
    },
};
const StockSearchSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(100),
    limit: zod_1.z.number().min(1).max(50).default(10),
});
const StockDataSchema = zod_1.z.object({
    symbol: zod_1.z.string().min(1).max(10),
    timeframe: zod_1.z.enum(['1m', '5m', '15m', '1h', '1d', '1w', '1M']).default('1d'),
    period: zod_1.z.enum(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']).default('1mo'),
});
const TechnicalIndicatorsSchema = zod_1.z.object({
    symbol: zod_1.z.string().min(1).max(10),
    indicators: zod_1.z.array(zod_1.z.enum(['RSI', 'MACD', 'SMA', 'EMA', 'BB', 'STOCH', 'ADX', 'CCI', 'WILLR', 'MOM'])),
    timeframe: zod_1.z.enum(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
});
class StockDataService {
    static isInitialized = false;
    static cache = new Map();
    static CACHE_TTL = 5 * 60 * 1000;
    static async initialize() {
        try {
            await finnhub_1.FinnhubService.initialize();
            await this.testAPIConnections();
            this.isInitialized = true;
            logger_1.logger.info('✅ Stock Data Service initialized with Finnhub integration');
        }
        catch (error) {
            logger_1.logger.error('❌ Stock Data Service initialization failed:', error);
            throw error;
        }
    }
    static async testAPIConnections() {
        const tests = [];
        if (STOCK_APIS.alphaVantage.apiKey) {
            tests.push(this.testAlphaVantage());
        }
        if (STOCK_APIS.iexCloud.apiKey) {
            tests.push(this.testIEXCloud());
        }
        tests.push(this.testYahooFinance());
        await Promise.allSettled(tests);
    }
    static async testAlphaVantage() {
        try {
            const response = await axios_1.default.get(STOCK_APIS.alphaVantage.baseURL, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: 'AAPL',
                    apikey: STOCK_APIS.alphaVantage.apiKey,
                },
                timeout: 5000,
            });
            console.log('✅ Alpha Vantage API connected');
        }
        catch (error) {
            console.warn('⚠️ Alpha Vantage API connection failed:', error.message);
        }
    }
    static async testIEXCloud() {
        try {
            const response = await axios_1.default.get(`${STOCK_APIS.iexCloud.baseURL}/stock/AAPL/quote`, {
                params: { token: STOCK_APIS.iexCloud.apiKey },
                timeout: 5000,
            });
            console.log('✅ IEX Cloud API connected');
        }
        catch (error) {
            console.warn('⚠️ IEX Cloud API connection failed:', error.message);
        }
    }
    static async testYahooFinance() {
        try {
            const response = await axios_1.default.get(`${STOCK_APIS.yahooFinance.baseURL}/AAPL`, {
                params: { range: '1d', interval: '1m' },
                timeout: 5000,
            });
            console.log('✅ Yahoo Finance API connected');
        }
        catch (error) {
            console.warn('⚠️ Yahoo Finance API connection failed:', error.message);
        }
    }
    static async searchStocks(request) {
        if (!this.isInitialized) {
            throw new Error('Stock Data Service not initialized');
        }
        const validatedRequest = StockSearchSchema.parse(request);
        const cacheKey = `search:${validatedRequest.query}:${validatedRequest.limit}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const stocks = await finnhub_1.FinnhubService.searchStocks(validatedRequest.query, validatedRequest.limit);
            this.setInCache(cacheKey, stocks);
            return stocks;
        }
        catch (error) {
            logger_1.logger.error('Stock search failed:', error);
            throw new Error('Failed to search stocks');
        }
    }
    static async getStockData(request) {
        if (!this.isInitialized) {
            throw new Error('Stock Data Service not initialized');
        }
        const validatedRequest = StockDataSchema.parse(request);
        const cacheKey = `data:${validatedRequest.symbol}:${validatedRequest.timeframe}:${validatedRequest.period}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const fromTime = this.calculateFromTime(validatedRequest.period, currentTime);
            const candles = await finnhub_1.FinnhubService.getStockCandles(validatedRequest.symbol, this.mapTimeframeToResolution(validatedRequest.timeframe), fromTime, currentTime);
            const stockData = {
                symbol: validatedRequest.symbol.toUpperCase(),
                data: candles.map(candle => ({
                    timestamp: candle.timestamp,
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                    volume: candle.volume,
                })),
                metadata: {
                    timeframe: validatedRequest.timeframe,
                    period: validatedRequest.period,
                    lastUpdated: new Date().toISOString(),
                },
            };
            this.setCache(cacheKey, stockData);
            return stockData;
        }
        catch (error) {
            logger_1.logger.error('Stock data retrieval failed:', error);
            throw new Error('Failed to retrieve stock data');
        }
    }
    static async getTechnicalIndicators(request) {
        if (!this.isInitialized) {
            throw new Error('Stock Data Service not initialized');
        }
        const validatedRequest = TechnicalIndicatorsSchema.parse(request);
        const cacheKey = `indicators:${validatedRequest.symbol}:${validatedRequest.indicators.join(',')}:${validatedRequest.timeframe}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const historicalData = await this.getStockData({
                symbol: validatedRequest.symbol,
                timeframe: '1d',
                period: this.mapTimeframeToPeriod(validatedRequest.timeframe),
            });
            const indicators = this.calculateTechnicalIndicators(historicalData, validatedRequest.indicators);
            this.setCache(cacheKey, indicators);
            return indicators;
        }
        catch (error) {
            console.error('Technical indicators calculation failed:', error);
            throw new Error('Failed to calculate technical indicators');
        }
    }
    static async getMarketOverview() {
        const cacheKey = 'market:overview';
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const indices = await Promise.allSettled([
                this.getIndexData('^GSPC', 'S&P 500'),
                this.getIndexData('^DJI', 'Dow Jones'),
                this.getIndexData('^IXIC', 'NASDAQ'),
                this.getIndexData('^RUT', 'Russell 2000'),
            ]);
            const marketData = indices
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);
            this.setCache(cacheKey, marketData);
            return marketData;
        }
        catch (error) {
            console.error('Market overview retrieval failed:', error);
            throw new Error('Failed to retrieve market overview');
        }
    }
    static async searchAlphaVantage(request) {
        if (!STOCK_APIS.alphaVantage.apiKey)
            return [];
        const response = await axios_1.default.get(STOCK_APIS.alphaVantage.baseURL, {
            params: {
                function: 'SYMBOL_SEARCH',
                keywords: request.query,
                apikey: STOCK_APIS.alphaVantage.apiKey,
            },
        });
        return response.data.bestMatches?.map((match) => ({
            symbol: match['1. symbol'],
            name: match['2. name'],
            type: match['3. type'],
            region: match['4. region'],
            marketOpen: match['5. marketOpen'],
            marketClose: match['6. marketClose'],
            timezone: match['7. timezone'],
            currency: match['8. currency'],
            matchScore: parseFloat(match['9. matchScore']),
        })) || [];
    }
    static async searchYahooFinance(request) {
        return [];
    }
    static async searchIEXCloud(request) {
        if (!STOCK_APIS.iexCloud.apiKey)
            return [];
        const response = await axios_1.default.get(`${STOCK_APIS.iexCloud.baseURL}/search/${request.query}`, {
            params: { token: STOCK_APIS.iexCloud.apiKey },
        });
        return response.data.map((stock) => ({
            symbol: stock.symbol,
            name: stock.name,
            type: stock.type,
            region: stock.region,
            currency: stock.currency,
            matchScore: 1.0,
        }));
    }
    static async getDataFromYahooFinance(request) {
        const response = await axios_1.default.get(`${STOCK_APIS.yahooFinance.baseURL}/${request.symbol}`, {
            params: {
                range: request.period,
                interval: request.timeframe,
            },
        });
        const data = response.data.chart.result[0];
        const timestamps = data.timestamp;
        const quotes = data.indicators.quote[0];
        return {
            symbol: request.symbol,
            currency: data.meta.currency,
            exchange: data.meta.exchangeName,
            timezone: data.meta.timezone,
            data: timestamps.map((timestamp, index) => ({
                timestamp: timestamp * 1000,
                open: quotes.open[index],
                high: quotes.high[index],
                low: quotes.low[index],
                close: quotes.close[index],
                volume: quotes.volume[index],
            })),
        };
    }
    static async getDataFromAlphaVantage(request) {
        if (!STOCK_APIS.alphaVantage.apiKey)
            return null;
        const response = await axios_1.default.get(STOCK_APIS.alphaVantage.baseURL, {
            params: {
                function: 'TIME_SERIES_DAILY',
                symbol: request.symbol,
                outputsize: 'compact',
                apikey: STOCK_APIS.alphaVantage.apiKey,
            },
        });
        const timeSeries = response.data['Time Series (Daily)'];
        if (!timeSeries)
            return null;
        return {
            symbol: request.symbol,
            data: Object.entries(timeSeries).map(([date, values]) => ({
                timestamp: new Date(date).getTime(),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume']),
            })),
        };
    }
    static async getDataFromIEXCloud(request) {
        if (!STOCK_APIS.iexCloud.apiKey)
            return null;
        const response = await axios_1.default.get(`${STOCK_APIS.iexCloud.baseURL}/stock/${request.symbol}/chart/1m`, {
            params: { token: STOCK_APIS.iexCloud.apiKey },
        });
        return {
            symbol: request.symbol,
            data: response.data.map((item) => ({
                timestamp: new Date(item.date).getTime(),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
            })),
        };
    }
    static async getIndexData(symbol, name) {
        try {
            const response = await axios_1.default.get(`${STOCK_APIS.yahooFinance.baseURL}/${symbol}`, {
                params: { range: '1d', interval: '1d' },
            });
            const data = response.data.chart.result[0];
            const meta = data.meta;
            const quote = data.indicators.quote[0];
            return {
                symbol,
                name,
                price: meta.regularMarketPrice,
                change: meta.regularMarketPrice - meta.previousClose,
                changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                volume: quote.volume[0],
                marketCap: meta.marketCap,
                currency: meta.currency,
            };
        }
        catch (error) {
            console.error(`Failed to get ${name} data:`, error);
            return null;
        }
    }
    static calculateTechnicalIndicators(data, indicators) {
        const prices = data.data.map((d) => d.close);
        const result = {};
        indicators.forEach(indicator => {
            switch (indicator) {
                case 'RSI':
                    result.RSI = this.calculateRSI(prices);
                    break;
                case 'MACD':
                    result.MACD = this.calculateMACD(prices);
                    break;
                case 'SMA':
                    result.SMA = this.calculateSMA(prices, 20);
                    break;
                case 'EMA':
                    result.EMA = this.calculateEMA(prices, 20);
                    break;
                case 'BB':
                    result.BollingerBands = this.calculateBollingerBands(prices, 20, 2);
                    break;
            }
        });
        return result;
    }
    static calculateRSI(prices, period = 14) {
        if (prices.length < period + 1)
            return 0;
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
        const macd = ema12 - ema26;
        const signal = macd * 0.9;
        const histogram = macd - signal;
        return { macd, signal, histogram };
    }
    static calculateSMA(prices, period) {
        if (prices.length < period)
            return 0;
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }
    static calculateEMA(prices, period) {
        if (prices.length < period)
            return prices[prices.length - 1];
        const multiplier = 2 / (period + 1);
        let ema = prices[0];
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        return ema;
    }
    static calculateBollingerBands(prices, period = 20, stdDev = 2) {
        const sma = this.calculateSMA(prices, period);
        const recentPrices = prices.slice(-period);
        const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        return {
            upper: sma + (standardDeviation * stdDev),
            middle: sma,
            lower: sma - (standardDeviation * stdDev),
        };
    }
    static mapTimeframeToPeriod(timeframe) {
        const mapping = {
            '1d': '1d',
            '1w': '5d',
            '1m': '1mo',
            '3m': '3mo',
            '6m': '6mo',
            '1y': '1y',
        };
        return mapping[timeframe] || '1mo';
    }
    static deduplicateStocks(stocks) {
        const seen = new Set();
        return stocks.filter(stock => {
            const key = stock.symbol.toLowerCase();
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    }
    static getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }
    static setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }
    static calculateFromTime(period, currentTime) {
        const periods = {
            '1d': 1 * 24 * 60 * 60,
            '5d': 5 * 24 * 60 * 60,
            '1mo': 30 * 24 * 60 * 60,
            '3mo': 90 * 24 * 60 * 60,
            '6mo': 180 * 24 * 60 * 60,
            '1y': 365 * 24 * 60 * 60,
            '2y': 2 * 365 * 24 * 60 * 60,
            '5y': 5 * 365 * 24 * 60 * 60,
            '10y': 10 * 365 * 24 * 60 * 60,
            'ytd': Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 1000),
            'max': 10 * 365 * 24 * 60 * 60,
        };
        const secondsBack = periods[period] || periods['1mo'];
        return currentTime - secondsBack;
    }
    static mapTimeframeToResolution(timeframe) {
        const resolutionMap = {
            '1m': '1',
            '5m': '5',
            '15m': '15',
            '1h': '60',
            '1d': 'D',
            '1w': 'W',
            '1M': 'M',
        };
        return resolutionMap[timeframe] || 'D';
    }
    static mapTimeframeToPeriod(timeframe) {
        const periodMap = {
            '1d': '1d',
            '1w': '5d',
            '1m': '1mo',
            '3m': '3mo',
            '6m': '6mo',
            '1y': '1y',
        };
        return periodMap[timeframe] || '1mo';
    }
}
exports.StockDataService = StockDataService;
//# sourceMappingURL=stockData.js.map