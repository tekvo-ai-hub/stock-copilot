"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const database_1 = require("@/services/database");
const logger_1 = require("@/utils/logger");
const router = express_1.default.Router();
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
        });
    }
    next();
};
router.get('/overview', async (req, res) => {
    try {
        const userId = req.user?.id;
        const portfolios = await database_1.DatabaseService.getUserPortfolios(userId);
        const totalPortfolioValue = portfolios.reduce((sum, portfolio) => {
            return sum + portfolio.holdings.reduce((holdingsSum, holding) => {
                return holdingsSum + (holding.shares * (holding.currentPrice || holding.avgPrice));
            }, 0);
        }, 0);
        const recentPredictions = await database_1.DatabaseService.getUserPredictions(userId, 'ACTIVE');
        const topPredictions = recentPredictions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);
        const marketIndices = await database_1.DatabaseService.getMarketIndices();
        const watchlist = await database_1.DatabaseService.getUserWatchlist(userId);
        const watchlistSymbols = watchlist.map(item => item.symbol);
        const chatSessions = await database_1.DatabaseService.getUserChatSessions(userId);
        const recentChats = chatSessions.slice(0, 3);
        const portfolioPerformance = {
            totalValue: totalPortfolioValue,
            dayChange: totalPortfolioValue * 0.02,
            dayChangePercent: 2.0,
            totalGain: totalPortfolioValue * 0.15,
            totalGainPercent: 15.0,
        };
        res.json({
            success: true,
            data: {
                portfolio: {
                    summary: portfolioPerformance,
                    holdings: portfolios.length,
                    totalValue: totalPortfolioValue,
                },
                predictions: {
                    active: recentPredictions.length,
                    topPredictions: topPredictions.map(pred => ({
                        symbol: pred.symbol,
                        predictedPrice: pred.predicted_price,
                        currentPrice: pred.current_price,
                        confidence: pred.confidence,
                        model: pred.model,
                        timeframe: pred.timeframe,
                    })),
                },
                market: {
                    indices: marketIndices.map(index => ({
                        symbol: index.symbol,
                        name: index.name,
                        price: index.price,
                        change: index.change,
                        changePercent: index.change_percent,
                    })),
                },
                watchlist: {
                    count: watchlist.length,
                    symbols: watchlistSymbols,
                },
                chat: {
                    recentSessions: recentChats.map(session => ({
                        id: session.id,
                        title: session.title,
                        updatedAt: session.updated_at,
                    })),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Dashboard overview failed:', error);
        res.status(500).json({
            error: 'Failed to fetch dashboard overview',
        });
    }
});
router.get('/portfolio-performance', [
    (0, express_validator_1.query)('period').optional().isIn(['1d', '1w', '1m', '3m', '1y']).default('1m'),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const period = req.query.period;
        const performanceData = await database_1.DatabaseService.getPortfolioPerformance(userId);
        const mockPerformance = generateMockPerformanceData(period);
        res.json({
            success: true,
            data: {
                period,
                performance: mockPerformance,
                portfolios: performanceData.map(portfolio => ({
                    id: portfolio.id,
                    name: portfolio.name,
                    value: portfolio.holdings.reduce((sum, holding) => sum + (holding.shares * (holding.currentPrice || holding.avgPrice)), 0),
                    holdings: portfolio.holdings.length,
                })),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Portfolio performance failed:', error);
        res.status(500).json({
            error: 'Failed to fetch portfolio performance',
        });
    }
});
router.get('/market-summary', async (req, res) => {
    try {
        const marketIndices = await database_1.DatabaseService.getMarketIndices();
        const topMovers = {
            gainers: [
                { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.28, change: 35.42, changePercent: 4.22 },
                { symbol: 'TSLA', name: 'Tesla, Inc.', price: 248.12, change: 8.45, changePercent: 3.53 },
                { symbol: 'AMD', name: 'Advanced Micro Devices', price: 142.56, change: 4.23, changePercent: 3.06 },
            ],
            losers: [
                { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: -2.34, changePercent: -1.32 },
                { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: -3.21, changePercent: -0.84 },
                { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: -1.89, changePercent: -1.31 },
            ],
        };
        const sectorPerformance = [
            { sector: 'Technology', change: 1.2, changePercent: 0.8 },
            { sector: 'Healthcare', change: 0.8, changePercent: 0.5 },
            { sector: 'Energy', change: 2.1, changePercent: 1.3 },
            { sector: 'Financials', change: -0.3, changePercent: -0.2 },
            { sector: 'Consumer Discretionary', change: 0.9, changePercent: 0.6 },
        ];
        res.json({
            success: true,
            data: {
                indices: marketIndices.map(index => ({
                    symbol: index.symbol,
                    name: index.name,
                    price: index.price,
                    change: index.change,
                    changePercent: index.change_percent,
                })),
                topMovers,
                sectorPerformance,
                marketStatus: 'Open',
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Market summary failed:', error);
        res.status(500).json({
            error: 'Failed to fetch market summary',
        });
    }
});
router.get('/quick-stats', async (req, res) => {
    try {
        const userId = req.user?.id;
        const portfolios = await database_1.DatabaseService.getUserPortfolios(userId);
        const predictions = await database_1.DatabaseService.getUserPredictions(userId);
        const watchlist = await database_1.DatabaseService.getUserWatchlist(userId);
        const chatSessions = await database_1.DatabaseService.getUserChatSessions(userId);
        const totalHoldings = portfolios.reduce((sum, portfolio) => sum + portfolio.holdings.length, 0);
        const activePredictions = predictions.filter(p => p.status === 'ACTIVE').length;
        const completedPredictions = predictions.filter(p => p.status === 'COMPLETED').length;
        const completedWithAccuracy = predictions.filter(p => p.status === 'COMPLETED' && p.accuracy !== null);
        const averageAccuracy = completedWithAccuracy.length > 0
            ? completedWithAccuracy.reduce((sum, p) => sum + (p.accuracy || 0), 0) / completedWithAccuracy.length
            : 0;
        res.json({
            success: true,
            data: {
                portfolio: {
                    totalPortfolios: portfolios.length,
                    totalHoldings,
                    totalValue: portfolios.reduce((sum, portfolio) => sum + portfolio.holdings.reduce((holdingsSum, holding) => holdingsSum + (holding.shares * (holding.currentPrice || holding.avgPrice)), 0), 0),
                },
                predictions: {
                    active: activePredictions,
                    completed: completedPredictions,
                    averageAccuracy: Math.round(averageAccuracy * 100) / 100,
                },
                watchlist: {
                    totalStocks: watchlist.length,
                },
                chat: {
                    totalSessions: chatSessions.length,
                    activeSessions: chatSessions.filter(s => s.is_active).length,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Quick stats failed:', error);
        res.status(500).json({
            error: 'Failed to fetch quick stats',
        });
    }
});
function generateMockPerformanceData(period) {
    const days = {
        '1d': 1,
        '1w': 7,
        '1m': 30,
        '3m': 90,
        '1y': 365,
    }[period] || 30;
    const data = [];
    const baseValue = 100000;
    let currentValue = baseValue;
    for (let i = 0; i < days; i++) {
        const change = (Math.random() - 0.5) * 0.05;
        currentValue *= (1 + change);
        data.push({
            date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.round(currentValue),
            change: Math.round(change * 10000) / 100,
        });
    }
    return data;
}
exports.default = router;
//# sourceMappingURL=dashboard.js.map