"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const realtimeData_1 = require("@/services/realtimeData");
const finnhub_1 = require("@/services/finnhub");
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
router.get('/quote/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const quote = await realtimeData_1.RealtimeDataService.getRealTimeQuote(symbol.toUpperCase());
        res.json({
            success: true,
            data: quote,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get real-time quote:', error);
        res.status(500).json({
            error: 'Failed to get real-time quote',
        });
    }
});
router.get('/market-overview', async (req, res) => {
    try {
        const overview = await realtimeData_1.RealtimeDataService.getRealTimeMarketOverview();
        res.json({
            success: true,
            data: overview,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get market overview:', error);
        res.status(500).json({
            error: 'Failed to get market overview',
        });
    }
});
router.get('/indicators/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.query)('timeframe').optional().isIn(['1d', '1w', '1m', '3m', '6m', '1y']).default('1d'),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { timeframe } = req.query;
        const indicators = await realtimeData_1.RealtimeDataService.getRealTimeTechnicalIndicators(symbol.toUpperCase(), timeframe);
        res.json({
            success: true,
            data: indicators,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get technical indicators:', error);
        res.status(500).json({
            error: 'Failed to get technical indicators',
        });
    }
});
router.get('/news/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).default(10),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { limit } = req.query;
        const news = await realtimeData_1.RealtimeDataService.getRealTimeCompanyNews(symbol.toUpperCase(), Number(limit));
        res.json({
            success: true,
            data: news,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get company news:', error);
        res.status(500).json({
            error: 'Failed to get company news',
        });
    }
});
router.post('/subscribe', [
    (0, express_validator_1.body)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.body;
        realtimeData_1.RealtimeDataService.subscribeToSymbol(symbol.toUpperCase());
        res.json({
            success: true,
            message: `Subscribed to real-time updates for ${symbol.toUpperCase()}`,
            data: {
                symbol: symbol.toUpperCase(),
                subscribedSymbols: realtimeData_1.RealtimeDataService.getSubscribedSymbols(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to subscribe to symbol:', error);
        res.status(500).json({
            error: 'Failed to subscribe to symbol',
        });
    }
});
router.post('/unsubscribe', [
    (0, express_validator_1.body)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.body;
        realtimeData_1.RealtimeDataService.unsubscribeFromSymbol(symbol.toUpperCase());
        res.json({
            success: true,
            message: `Unsubscribed from real-time updates for ${symbol.toUpperCase()}`,
            data: {
                symbol: symbol.toUpperCase(),
                subscribedSymbols: realtimeData_1.RealtimeDataService.getSubscribedSymbols(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to unsubscribe from symbol:', error);
        res.status(500).json({
            error: 'Failed to unsubscribe from symbol',
        });
    }
});
router.get('/subscriptions', async (req, res) => {
    try {
        const subscriptions = realtimeData_1.RealtimeDataService.getSubscribedSymbols();
        res.json({
            success: true,
            data: {
                subscribedSymbols: subscriptions,
                count: subscriptions.length,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get subscriptions:', error);
        res.status(500).json({
            error: 'Failed to get subscriptions',
        });
    }
});
router.get('/status', async (req, res) => {
    try {
        const status = realtimeData_1.RealtimeDataService.getStatus();
        res.json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get service status:', error);
        res.status(500).json({
            error: 'Failed to get service status',
        });
    }
});
router.put('/frequency', [
    (0, express_validator_1.body)('frequency').isInt({ min: 1000, max: 60000 }),
], validateRequest, async (req, res) => {
    try {
        const { frequency } = req.body;
        realtimeData_1.RealtimeDataService.setUpdateFrequency(frequency);
        res.json({
            success: true,
            message: `Update frequency set to ${frequency}ms`,
            data: {
                frequency,
                status: realtimeData_1.RealtimeDataService.getStatus(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update frequency:', error);
        res.status(500).json({
            error: 'Failed to update frequency',
        });
    }
});
router.get('/market-status', async (req, res) => {
    try {
        const marketStatus = await finnhub_1.FinnhubService.getMarketStatus();
        res.json({
            success: true,
            data: marketStatus,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get market status:', error);
        res.status(500).json({
            error: 'Failed to get market status',
        });
    }
});
router.get('/movers', [
    (0, express_validator_1.query)('type').optional().isIn(['gainers', 'losers', 'most_active']).default('gainers'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).default(10),
], validateRequest, async (req, res) => {
    try {
        const { type, limit } = req.query;
        const movers = await finnhub_1.FinnhubService.getMarketMovers(type, Number(limit));
        res.json({
            success: true,
            data: {
                type,
                movers,
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get market movers:', error);
        res.status(500).json({
            error: 'Failed to get market movers',
        });
    }
});
router.get('/sectors', async (req, res) => {
    try {
        const sectors = await finnhub_1.FinnhubService.getSectorPerformance();
        res.json({
            success: true,
            data: {
                sectors,
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get sector performance:', error);
        res.status(500).json({
            error: 'Failed to get sector performance',
        });
    }
});
router.get('/news', [
    (0, express_validator_1.query)('category').optional().isIn(['general', 'earnings', 'mergers', 'ipo', 'crypto']).default('general'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).default(20),
], validateRequest, async (req, res) => {
    try {
        const { category, limit } = req.query;
        const news = await finnhub_1.FinnhubService.getMarketNews(category, Number(limit));
        res.json({
            success: true,
            data: {
                category,
                news,
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get market news:', error);
        res.status(500).json({
            error: 'Failed to get market news',
        });
    }
});
router.get('/company/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const profile = await finnhub_1.FinnhubService.getCompanyProfile(symbol.toUpperCase());
        res.json({
            success: true,
            data: profile,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get company profile:', error);
        res.status(500).json({
            error: 'Failed to get company profile',
        });
    }
});
exports.default = router;
//# sourceMappingURL=realtime.js.map