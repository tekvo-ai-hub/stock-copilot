import { FinnhubService } from './finnhub';
import { WebSocketService } from './websocket';
import { logger } from '@/utils/logger';

export class RealtimeDataService {
  private static isRunning = false;
  private static updateInterval: NodeJS.Timeout | null = null;
  private static subscribedSymbols = new Set<string>();
  private static updateFrequency = 5000; // 5 seconds

  public static async initialize() {
    try {
      await FinnhubService.initialize();
      this.isRunning = true;
      this.startRealTimeUpdates();
      logger.info('✅ Realtime Data Service initialized');
    } catch (error) {
      logger.error('❌ Realtime Data Service initialization failed:', error);
      throw error;
    }
  }

  public static startRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.updateSubscribedSymbols();
        await this.updateMarketData();
      } catch (error) {
        logger.error('Real-time update failed:', error);
      }
    }, this.updateFrequency);
  }

  public static stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
  }

  public static subscribeToSymbol(symbol: string) {
    this.subscribedSymbols.add(symbol.toUpperCase());
    logger.info(`Subscribed to real-time updates for ${symbol}`);
  }

  public static unsubscribeFromSymbol(symbol: string) {
    this.subscribedSymbols.delete(symbol.toUpperCase());
    logger.info(`Unsubscribed from real-time updates for ${symbol}`);
  }

  public static getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  private static async updateSubscribedSymbols() {
    if (this.subscribedSymbols.size === 0) return;

    const symbols = Array.from(this.subscribedSymbols);
    
    for (const symbol of symbols) {
      try {
        // Get real-time quote
        const quote = await FinnhubService.getQuote(symbol);
        
        // Broadcast to WebSocket clients
        WebSocketService.broadcastMarketUpdate(symbol, {
          type: 'quote',
          data: quote,
        });

        // Get company profile if not cached
        try {
          const profile = await FinnhubService.getCompanyProfile(symbol);
          WebSocketService.broadcastMarketUpdate(symbol, {
            type: 'profile',
            data: profile,
          });
        } catch (error) {
          // Profile might not be available, continue
        }

      } catch (error) {
        logger.error(`Failed to update ${symbol}:`, error);
      }
    }
  }

  private static async updateMarketData() {
    try {
      // Get market status
      const marketStatus = await FinnhubService.getMarketStatus();
      WebSocketService.broadcast({
        type: 'market_status',
        data: marketStatus,
      });

      // Get market movers
      const gainers = await FinnhubService.getMarketMovers('gainers', 10);
      const losers = await FinnhubService.getMarketMovers('losers', 10);
      const mostActive = await FinnhubService.getMarketMovers('most_active', 10);

      WebSocketService.broadcast({
        type: 'market_movers',
        data: {
          gainers,
          losers,
          mostActive,
        },
      });

      // Get sector performance
      const sectors = await FinnhubService.getSectorPerformance();
      WebSocketService.broadcast({
        type: 'sector_performance',
        data: sectors,
      });

      // Get market news
      const news = await FinnhubService.getMarketNews('general', 10);
      WebSocketService.broadcast({
        type: 'market_news',
        data: news,
      });

    } catch (error) {
      logger.error('Failed to update market data:', error);
    }
  }

  // Get real-time quote for a specific symbol
  public static async getRealTimeQuote(symbol: string) {
    try {
      const quote = await FinnhubService.getQuote(symbol);
      return {
        symbol: quote.symbol,
        price: quote.currentPrice,
        change: quote.change,
        changePercent: quote.changePercent,
        high: quote.high,
        low: quote.low,
        open: quote.open,
        previousClose: quote.previousClose,
        timestamp: quote.timestamp,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Failed to get real-time quote for ${symbol}:`, error);
      throw error;
    }
  }

  // Get real-time market overview
  public static async getRealTimeMarketOverview() {
    try {
      const [
        marketStatus,
        gainers,
        losers,
        mostActive,
        sectors,
        news
      ] = await Promise.all([
        FinnhubService.getMarketStatus(),
        FinnhubService.getMarketMovers('gainers', 10),
        FinnhubService.getMarketMovers('losers', 10),
        FinnhubService.getMarketMovers('most_active', 10),
        FinnhubService.getSectorPerformance(),
        FinnhubService.getMarketNews('general', 10),
      ]);

      return {
        marketStatus,
        movers: {
          gainers,
          losers,
          mostActive,
        },
        sectors,
        news,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get real-time market overview:', error);
      throw error;
    }
  }

  // Get real-time technical indicators
  public static async getRealTimeTechnicalIndicators(symbol: string, timeframe: string = '1d') {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const fromTime = this.calculateFromTime(timeframe, currentTime);
      
      const indicators = await FinnhubService.getTechnicalIndicators(
        symbol,
        this.mapTimeframeToResolution(timeframe),
        fromTime,
        currentTime
      );

      return {
        symbol: symbol.toUpperCase(),
        timeframe,
        indicators,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Failed to get technical indicators for ${symbol}:`, error);
      throw error;
    }
  }

  // Get real-time company news
  public static async getRealTimeCompanyNews(symbol: string, limit: number = 10) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const news = await FinnhubService.getCompanyNews(symbol, weekAgo, today, limit);
      
      return {
        symbol: symbol.toUpperCase(),
        news,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Failed to get company news for ${symbol}:`, error);
      throw error;
    }
  }

  // Set update frequency
  public static setUpdateFrequency(frequency: number) {
    this.updateFrequency = Math.max(1000, frequency); // Minimum 1 second
    if (this.isRunning) {
      this.startRealTimeUpdates();
    }
  }

  // Get service status
  public static getStatus() {
    return {
      isRunning: this.isRunning,
      subscribedSymbols: this.getSubscribedSymbols(),
      updateFrequency: this.updateFrequency,
      lastUpdate: new Date().toISOString(),
    };
  }

  // Helper methods
  private static calculateFromTime(timeframe: string, currentTime: number): number {
    const periods = {
      '1d': 1 * 24 * 60 * 60,
      '1w': 7 * 24 * 60 * 60,
      '1m': 30 * 24 * 60 * 60,
      '3m': 90 * 24 * 60 * 60,
      '6m': 180 * 24 * 60 * 60,
      '1y': 365 * 24 * 60 * 60,
    };
    
    const secondsBack = periods[timeframe] || periods['1d'];
    return currentTime - secondsBack;
  }

  private static mapTimeframeToResolution(timeframe: string): string {
    const resolutionMap = {
      '1d': 'D',
      '1w': 'W',
      '1m': 'M',
      '3m': 'M',
      '6m': 'M',
      '1y': 'M',
    };
    
    return resolutionMap[timeframe] || 'D';
  }

  public static isHealthy(): boolean {
    return this.isRunning && FinnhubService.isHealthy();
  }
}
