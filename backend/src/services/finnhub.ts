import axios from 'axios';
import { z } from 'zod';
import { logger } from '@/utils/logger';

// Finnhub API Configuration
const FINNHUB_CONFIG = {
  baseURL: 'https://finnhub.io/api/v1',
  apiKey: process.env.FINNHUB_API_KEY,
  timeout: 10000,
};

// Validation schemas
const StockQuoteSchema = z.object({
  c: z.number(), // Current price
  d: z.number(), // Change
  dp: z.number(), // Percent change
  h: z.number(), // High price of the day
  l: z.number(), // Low price of the day
  o: z.number(), // Open price of the day
  pc: z.number(), // Previous close price
  t: z.number(), // Timestamp
});

const CompanyProfileSchema = z.object({
  country: z.string(),
  currency: z.string(),
  exchange: z.string(),
  ipo: z.string(),
  marketCapitalization: z.number(),
  name: z.string(),
  phone: z.string(),
  shareOutstanding: z.number(),
  ticker: z.string(),
  weburl: z.string(),
  logo: z.string(),
  finnhubIndustry: z.string(),
});

const NewsSchema = z.object({
  category: z.string(),
  datetime: z.number(),
  headline: z.string(),
  id: z.number(),
  image: z.string(),
  related: z.string(),
  source: z.string(),
  summary: z.string(),
  url: z.string(),
});

const MarketStatusSchema = z.object({
  exchange: z.string(),
  isOpen: z.boolean(),
  session: z.string(),
  tz: z.string(),
});

export class FinnhubService {
  private static isInitialized = false;
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_TTL = 60 * 1000; // 1 minute for real-time data
  private static NEWS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for news

  public static async initialize() {
    try {
      if (!FINNHUB_CONFIG.apiKey) {
        throw new Error('FINNHUB_API_KEY is required');
      }

      // Test API connection
      await this.testConnection();
      this.isInitialized = true;
      logger.info('✅ Finnhub Service initialized');
    } catch (error) {
      logger.error('❌ Finnhub Service initialization failed:', error);
      throw error;
    }
  }

  private static async testConnection() {
    try {
      const response = await axios.get(`${FINNHUB_CONFIG.baseURL}/quote`, {
        params: {
          symbol: 'AAPL',
          token: FINNHUB_CONFIG.apiKey,
        },
        timeout: 5000,
      });
      
      if (response.status !== 200) {
        throw new Error(`API test failed with status: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Finnhub API connection failed: ${error}`);
    }
  }

  // Real-time Stock Quote
  public static async getQuote(symbol: string) {
    try {
      const cacheKey = `quote_${symbol}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const response = await axios.get(`${FINNHUB_CONFIG.baseURL}/quote`, {
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
        timestamp: quote.t * 1000, // Convert to milliseconds
      };
    } catch (error) {
      logger.error(`Failed to get quote for ${symbol}:`, error);
      throw new Error(`Failed to get quote for ${symbol}`);
    }
  }

  // Company Profile
  public static async getCompanyProfile(symbol: string) {
    try {
      const cacheKey = `profile_${symbol}`;
      const cached = this.getCachedData(cacheKey, 24 * 60 * 60 * 1000); // 24 hours cache
      if (cached) return cached;

      const response = await axios.get(`${FINNHUB_CONFIG.baseURL}/stock/profile2`, {
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
    } catch (error) {
      logger.error(`Failed to get company profile for ${symbol}:`, error);
      throw new Error(`Failed to get company profile for ${symbol}`);
    }
  }

  // Stock Search
  public static async searchStocks(query: string, limit: number = 10) {
    try {
      const cacheKey = `search_${query}_${limit}`;
      const cached = this.getCachedData(cacheKey, 5 * 60 * 1000); // 5 minutes cache
      if (cached) return cached;

      const response = await axios.get(`${FINNHUB_CONFIG.baseURL}/search`, {
        params: {
          q: query,
          token: FINNHUB_CONFIG.apiKey,
        },
        timeout: FINNHUB_CONFIG.timeout,
      });

      const results = response.data.result || [];
      const limitedResults = results.slice(0, limit).map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.description,
        exchange: stock.type,
        displaySymbol: stock.displaySymbol,
      }));

      this.setCachedData(cacheKey, limitedResults, 5 * 60 * 1000);
      return limitedResults;
    } catch (error) {
      logger.error(`Failed to search stocks for query "${query}":`, error);
      throw new Error(`Failed to search stocks for query "${query}"`);
    }
  }

  // Market News
  public static async getMarketNews(category: string = 'general', limit: number = 20) {
    try {
      const cacheKey = `news_${category}_${limit}`;
      const cached = this.getCachedData(cacheKey, this.NEWS_CACHE_TTL);
      if (cached) return cached;

      const response = await axios.get(`${FINNHUB_CONFIG.baseURL}/news`, {
        params: {
          category: category,
          token: FINNHUB_CONFIG.apiKey,
        },
        timeout: FINNHUB_CONFIG.timeout,
      });

      const news = response.data.slice(0, limit).map((article: any) => ({
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
    } catch (error) {
      logger.error(`Failed to get market news for category "${category}":`, error);
      throw new Error(`Failed to get market news for category "${category}"`);
    }
  }

  // Company News
  public static async getCompanyNews(symbol: string, from: string, to: string, limit: number = 20) {
    try {
      const cacheKey = `company_news_${symbol}_${from}_${to}`;
      const cached = this.getCachedData(cacheKey, this.NEWS_CACHE_TTL);
      if (cached) return cached;

      const response = await axios.get(`${FINNHUB_CONFIG.baseURL}/company-news`, {
        params: {
          symbol: symbol.toUpperCase(),
          from: from,
          to: to,
          token: FINNHUB_CONFIG.apiKey,
        },
        timeout: FINNHUB_CONFIG.timeout,
      });

      const news = response.data.slice(0, limit).map((article: any) => ({
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
    } catch (error) {
      logger.error(`Failed to get company news for ${symbol}:`, error);
      throw new Error(`Failed to get company news for ${symbol}`);
    }
  }

  // Market Status
  public static async getMarketStatus() {
    try {
      const cacheKey = 'market_status';
      const cached = this.getCachedData(cacheKey, 60 * 1000); // 1 minute cache
      if (cached) return cached;

      const response = await axios.get(`${FINNHUB_CONFIG.baseURL}/stock/market-status`, {
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
    } catch (error) {
      logger.error('Failed to get market status:', error);
      throw new Error('Failed to get market status');
    }
  }

  // Stock Candles (Historical Data)
  public static async getStockCandles(symbol: string, resolution: string, from: number, to: number) {
    try {
      const cacheKey = `candles_${symbol}_${resolution}_${from}_${to}`;
      const cached = this.getCachedData(cacheKey, 5 * 60 * 1000); // 5 minutes cache
      if (cached) return cached;

      const response = await axios.get(`${FINNHUB_CONFIG.baseURL}/stock/candle`, {
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

      const candles = data.t.map((timestamp: number, index: number) => ({
        timestamp: timestamp * 1000, // Convert to milliseconds
        open: data.o[index],
        high: data.h[index],
        low: data.l[index],
        close: data.c[index],
        volume: data.v[index],
      }));

      this.setCachedData(cacheKey, candles, 5 * 60 * 1000);
      return candles;
    } catch (error) {
      logger.error(`Failed to get stock candles for ${symbol}:`, error);
      throw new Error(`Failed to get stock candles for ${symbol}`);
    }
  }

  // Technical Indicators
  public static async getTechnicalIndicators(symbol: string, resolution: string, from: number, to: number) {
    try {
      const cacheKey = `indicators_${symbol}_${resolution}_${from}_${to}`;
      const cached = this.getCachedData(cacheKey, 5 * 60 * 1000);
      if (cached) return cached;

      // Get stock candles first
      const candles = await this.getStockCandles(symbol, resolution, from, to);
      
      if (candles.length === 0) {
        return {};
      }

      // Calculate technical indicators
      const indicators = this.calculateTechnicalIndicators(candles);
      this.setCachedData(cacheKey, indicators, 5 * 60 * 1000);
      
      return indicators;
    } catch (error) {
      logger.error(`Failed to get technical indicators for ${symbol}:`, error);
      throw new Error(`Failed to get technical indicators for ${symbol}`);
    }
  }

  // Market Movers
  public static async getMarketMovers(type: 'gainers' | 'losers' | 'most_active' = 'gainers', limit: number = 10) {
    try {
      const cacheKey = `movers_${type}_${limit}`;
      const cached = this.getCachedData(cacheKey, 2 * 60 * 1000); // 2 minutes cache
      if (cached) return cached;

      // For Finnhub, we'll simulate market movers by getting quotes for popular stocks
      const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC'];
      const quotes = await Promise.all(
        popularStocks.map(async (symbol) => {
          try {
            const quote = await this.getQuote(symbol);
            return {
              symbol: quote.symbol,
              name: symbol, // Would need to fetch company profile for full name
              price: quote.currentPrice,
              change: quote.change,
              changePercent: quote.changePercent,
              volume: 0, // Finnhub doesn't provide volume in quote endpoint
            };
          } catch (error) {
            return null;
          }
        })
      );

      const validQuotes = quotes.filter(quote => quote !== null);
      
      // Sort by change percent
      const sortedQuotes = validQuotes.sort((a, b) => {
        if (type === 'gainers') return b.changePercent - a.changePercent;
        if (type === 'losers') return a.changePercent - b.changePercent;
        return 0; // For most_active, we'd need volume data
      });

      const movers = sortedQuotes.slice(0, limit);
      this.setCachedData(cacheKey, movers, 2 * 60 * 1000);
      
      return movers;
    } catch (error) {
      logger.error(`Failed to get market movers for type "${type}":`, error);
      throw new Error(`Failed to get market movers for type "${type}"`);
    }
  }

  // Sector Performance (simulated)
  public static async getSectorPerformance() {
    try {
      const cacheKey = 'sector_performance';
      const cached = this.getCachedData(cacheKey, 10 * 60 * 1000); // 10 minutes cache
      if (cached) return cached;

      // Finnhub doesn't have direct sector performance, so we'll simulate it
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
    } catch (error) {
      logger.error('Failed to get sector performance:', error);
      throw new Error('Failed to get sector performance');
    }
  }

  // Helper methods
  private static getCachedData(key: string, ttl: number = this.CACHE_TTL) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }

  private static setCachedData(key: string, data: any, ttl: number = this.CACHE_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private static calculateTechnicalIndicators(candles: any[]) {
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

  private static calculateSMA(prices: number[], period: number) {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private static calculateEMA(prices: number[], period: number) {
    if (prices.length < period) return null;
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  }

  private static calculateRSI(prices: number[], period: number = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private static calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (!ema12 || !ema26) return null;
    
    return {
      macd: ema12 - ema26,
      signal: ema12 - ema26, // Simplified - would need 9-period EMA of MACD
      histogram: (ema12 - ema26) - (ema12 - ema26), // Simplified
    };
  }

  private static calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    if (prices.length < period) return null;
    
    const sma = this.calculateSMA(prices, period);
    if (!sma) return null;
    
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev),
    };
  }

  private static calculateStochastic(highs: number[], lows: number[], closes: number[], period: number = 14) {
    if (highs.length < period || lows.length < period || closes.length < period) return null;
    
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const recentCloses = closes.slice(-period);
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    const currentClose = recentCloses[recentCloses.length - 1];
    
    if (highestHigh === lowestLow) return 50; // Neutral if no range
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    return k;
  }

  public static isHealthy(): boolean {
    return this.isInitialized;
  }

  public static clearCache() {
    this.cache.clear();
  }
}
