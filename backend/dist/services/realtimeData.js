"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeDataService = void 0;
const finnhub_1 = require("./finnhub");
const websocket_1 = require("./websocket");
const logger_1 = require("@/utils/logger");
class RealtimeDataService {
    static isRunning = false;
    static updateInterval = null;
    static subscribedSymbols = new Set();
    static updateFrequency = 5000;
    static async initialize() {
        try {
            await finnhub_1.FinnhubService.initialize();
            this.isRunning = true;
            this.startRealTimeUpdates();
            logger_1.logger.info('✅ Realtime Data Service initialized');
        }
        catch (error) {
            logger_1.logger.error('❌ Realtime Data Service initialization failed:', error);
            throw error;
        }
    }
    static startRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(async () => {
            try {
                await this.updateSubscribedSymbols();
                await this.updateMarketData();
            }
            catch (error) {
                logger_1.logger.error('Real-time update failed:', error);
            }
        }, this.updateFrequency);
    }
    static stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isRunning = false;
    }
    static subscribeToSymbol(symbol) {
        this.subscribedSymbols.add(symbol.toUpperCase());
        logger_1.logger.info(`Subscribed to real-time updates for ${symbol}`);
    }
    static unsubscribeFromSymbol(symbol) {
        this.subscribedSymbols.delete(symbol.toUpperCase());
        logger_1.logger.info(`Unsubscribed from real-time updates for ${symbol}`);
    }
    static getSubscribedSymbols() {
        return Array.from(this.subscribedSymbols);
    }
    static async updateSubscribedSymbols() {
        if (this.subscribedSymbols.size === 0)
            return;
        const symbols = Array.from(this.subscribedSymbols);
        for (const symbol of symbols) {
            try {
                const quote = await finnhub_1.FinnhubService.getQuote(symbol);
                websocket_1.WebSocketService.broadcastMarketUpdate(symbol, {
                    type: 'quote',
                    data: quote,
                });
                try {
                    const profile = await finnhub_1.FinnhubService.getCompanyProfile(symbol);
                    websocket_1.WebSocketService.broadcastMarketUpdate(symbol, {
                        type: 'profile',
                        data: profile,
                    });
                }
                catch (error) {
                }
            }
            catch (error) {
                logger_1.logger.error(`Failed to update ${symbol}:`, error);
            }
        }
    }
    static async updateMarketData() {
        try {
            const marketStatus = await finnhub_1.FinnhubService.getMarketStatus();
            websocket_1.WebSocketService.broadcast({
                type: 'market_status',
                data: marketStatus,
            });
            const gainers = await finnhub_1.FinnhubService.getMarketMovers('gainers', 10);
            const losers = await finnhub_1.FinnhubService.getMarketMovers('losers', 10);
            const mostActive = await finnhub_1.FinnhubService.getMarketMovers('most_active', 10);
            websocket_1.WebSocketService.broadcast({
                type: 'market_movers',
                data: {
                    gainers,
                    losers,
                    mostActive,
                },
            });
            const sectors = await finnhub_1.FinnhubService.getSectorPerformance();
            websocket_1.WebSocketService.broadcast({
                type: 'sector_performance',
                data: sectors,
            });
            const news = await finnhub_1.FinnhubService.getMarketNews('general', 10);
            websocket_1.WebSocketService.broadcast({
                type: 'market_news',
                data: news,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to update market data:', error);
        }
    }
    static async getRealTimeQuote(symbol) {
        try {
            const quote = await finnhub_1.FinnhubService.getQuote(symbol);
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
        }
        catch (error) {
            logger_1.logger.error(`Failed to get real-time quote for ${symbol}:`, error);
            throw error;
        }
    }
    static async getRealTimeMarketOverview() {
        try {
            const [marketStatus, gainers, losers, mostActive, sectors, news] = await Promise.all([
                finnhub_1.FinnhubService.getMarketStatus(),
                finnhub_1.FinnhubService.getMarketMovers('gainers', 10),
                finnhub_1.FinnhubService.getMarketMovers('losers', 10),
                finnhub_1.FinnhubService.getMarketMovers('most_active', 10),
                finnhub_1.FinnhubService.getSectorPerformance(),
                finnhub_1.FinnhubService.getMarketNews('general', 10),
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get real-time market overview:', error);
            throw error;
        }
    }
    static async getRealTimeTechnicalIndicators(symbol, timeframe = '1d') {
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const fromTime = this.calculateFromTime(timeframe, currentTime);
            const indicators = await finnhub_1.FinnhubService.getTechnicalIndicators(symbol, this.mapTimeframeToResolution(timeframe), fromTime, currentTime);
            return {
                symbol: symbol.toUpperCase(),
                timeframe,
                indicators,
                lastUpdated: new Date().toISOString(),
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get technical indicators for ${symbol}:`, error);
            throw error;
        }
    }
    static async getRealTimeCompanyNews(symbol, limit = 10) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const news = await finnhub_1.FinnhubService.getCompanyNews(symbol, weekAgo, today, limit);
            return {
                symbol: symbol.toUpperCase(),
                news,
                lastUpdated: new Date().toISOString(),
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to get company news for ${symbol}:`, error);
            throw error;
        }
    }
    static setUpdateFrequency(frequency) {
        this.updateFrequency = Math.max(1000, frequency);
        if (this.isRunning) {
            this.startRealTimeUpdates();
        }
    }
    static getStatus() {
        return {
            isRunning: this.isRunning,
            subscribedSymbols: this.getSubscribedSymbols(),
            updateFrequency: this.updateFrequency,
            lastUpdate: new Date().toISOString(),
        };
    }
    static calculateFromTime(timeframe, currentTime) {
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
    static mapTimeframeToResolution(timeframe) {
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
    static isHealthy() {
        return this.isRunning && finnhub_1.FinnhubService.isHealthy();
    }
}
exports.RealtimeDataService = RealtimeDataService;
//# sourceMappingURL=realtimeData.js.map