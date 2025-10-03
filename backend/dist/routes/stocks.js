"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const stockData_1 = require("@/services/stockData");
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
router.get('/search', [
    (0, express_validator_1.query)('q').isString().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).default(10),
    (0, express_validator_1.query)('type').optional().isIn(['symbol', 'name', 'both']).default('both'),
], validateRequest, async (req, res) => {
    try {
        const { q, limit, type } = req.query;
        const searchResults = await stockData_1.StockDataService.searchStocks({
            query: q,
            limit: Number(limit),
        });
        let filteredResults = searchResults;
        if (type === 'symbol') {
            filteredResults = searchResults.filter(stock => stock.symbol.toLowerCase().includes(q.toLowerCase()));
        }
        else if (type === 'name') {
            filteredResults = searchResults.filter(stock => stock.name.toLowerCase().includes(q.toLowerCase()));
        }
        res.json({
            success: true,
            data: {
                query: q,
                results: filteredResults.slice(0, Number(limit)),
                total: filteredResults.length,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Stock search failed:', error);
        res.status(500).json({
            error: 'Failed to search stocks',
        });
    }
});
router.get('/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.query)('timeframe').optional().isIn(['1m', '5m', '15m', '1h', '1d', '1w', '1M']).default('1d'),
    (0, express_validator_1.query)('period').optional().isIn(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']).default('1mo'),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { timeframe, period } = req.query;
        const stockData = await stockData_1.StockDataService.getStockData({
            symbol: symbol.toUpperCase(),
            timeframe: timeframe,
            period: period,
        });
        const indicators = await stockData_1.StockDataService.getTechnicalIndicators({
            symbol: symbol.toUpperCase(),
            indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'BB'],
            timeframe: '1m',
        });
        const companyInfo = await getCompanyInfo(symbol.toUpperCase());
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                company: companyInfo,
                priceData: stockData.data,
                indicators,
                metadata: {
                    timeframe,
                    period,
                    lastUpdated: new Date().toISOString(),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get stock details:', error);
        res.status(500).json({
            error: 'Failed to get stock details',
        });
    }
});
router.get('/:symbol/quote', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const stockData = await stockData_1.StockDataService.getStockData({
            symbol: symbol.toUpperCase(),
            timeframe: '1d',
            period: '1d',
        });
        if (!stockData.data || stockData.data.length === 0) {
            return res.status(404).json({
                error: 'Stock data not found',
            });
        }
        const latest = stockData.data[stockData.data.length - 1];
        const previous = stockData.data[stockData.data.length - 2] || latest;
        const quote = {
            symbol: symbol.toUpperCase(),
            price: latest.close,
            change: latest.close - previous.close,
            changePercent: ((latest.close - previous.close) / previous.close) * 100,
            open: latest.open,
            high: latest.high,
            low: latest.low,
            volume: latest.volume,
            previousClose: previous.close,
            timestamp: latest.timestamp,
        };
        res.json({
            success: true,
            data: quote,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get stock quote:', error);
        res.status(500).json({
            error: 'Failed to get stock quote',
        });
    }
});
router.get('/:symbol/history', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.query)('start_date').optional().isISO8601(),
    (0, express_validator_1.query)('end_date').optional().isISO8601(),
    (0, express_validator_1.query)('interval').optional().isIn(['1m', '5m', '15m', '1h', '1d', '1w', '1M']).default('1d'),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { start_date, end_date, interval } = req.query;
        let period = '1mo';
        if (start_date && end_date) {
            const start = new Date(start_date);
            const end = new Date(end_date);
            const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff <= 5)
                period = '5d';
            else if (daysDiff <= 30)
                period = '1mo';
            else if (daysDiff <= 90)
                period = '3mo';
            else if (daysDiff <= 365)
                period = '1y';
            else
                period = 'max';
        }
        const stockData = await stockData_1.StockDataService.getStockData({
            symbol: symbol.toUpperCase(),
            timeframe: interval,
            period,
        });
        let filteredData = stockData.data;
        if (start_date && end_date) {
            const start = new Date(start_date);
            const end = new Date(end_date);
            filteredData = stockData.data.filter(d => {
                const date = new Date(d.timestamp);
                return date >= start && date <= end;
            });
        }
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                data: filteredData,
                metadata: {
                    interval,
                    startDate: start_date || 'auto',
                    endDate: end_date || 'auto',
                    totalRecords: filteredData.length,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get historical data:', error);
        res.status(500).json({
            error: 'Failed to get historical data',
        });
    }
});
router.get('/:symbol/indicators', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.query)('indicators').optional().isString(),
    (0, express_validator_1.query)('timeframe').optional().isIn(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const { indicators, timeframe } = req.query;
        const indicatorList = indicators
            ? indicators.split(',').map(i => i.trim().toUpperCase())
            : ['RSI', 'MACD', 'SMA', 'EMA', 'BB', 'STOCH', 'ADX', 'CCI', 'WILLR', 'MOM'];
        const technicalIndicators = await stockData_1.StockDataService.getTechnicalIndicators({
            symbol: symbol.toUpperCase(),
            indicators: indicatorList,
            timeframe: timeframe,
        });
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                timeframe,
                indicators: technicalIndicators,
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get technical indicators:', error);
        res.status(500).json({
            error: 'Failed to get technical indicators',
        });
    }
});
router.get('/:symbol/company', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const companyInfo = await getCompanyInfo(symbol.toUpperCase());
        res.json({
            success: true,
            data: companyInfo,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get company info:', error);
        res.status(500).json({
            error: 'Failed to get company information',
        });
    }
});
router.get('/:symbol/peers', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const peers = await getPeerCompanies(symbol.toUpperCase());
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                peers,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get peer companies:', error);
        res.status(500).json({
            error: 'Failed to get peer companies',
        });
    }
});
router.get('/:symbol/analysts', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const analystData = await getAnalystRecommendations(symbol.toUpperCase());
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                recommendations: analystData,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get analyst recommendations:', error);
        res.status(500).json({
            error: 'Failed to get analyst recommendations',
        });
    }
});
router.get('/:symbol/insights', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const insights = await getStockInsights(symbol.toUpperCase());
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                insights,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get stock insights:', error);
        res.status(500).json({
            error: 'Failed to get stock insights',
        });
    }
});
async function getCompanyInfo(symbol) {
    const mockCompanies = {
        'AAPL': {
            name: 'Apple Inc.',
            sector: 'Technology',
            industry: 'Consumer Electronics',
            marketCap: 2800000000000,
            employees: 164000,
            founded: 1976,
            headquarters: 'Cupertino, CA',
            website: 'https://www.apple.com',
            description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        },
        'MSFT': {
            name: 'Microsoft Corporation',
            sector: 'Technology',
            industry: 'Software',
            marketCap: 2800000000000,
            employees: 221000,
            founded: 1975,
            headquarters: 'Redmond, WA',
            website: 'https://www.microsoft.com',
            description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
        },
        'GOOGL': {
            name: 'Alphabet Inc.',
            sector: 'Technology',
            industry: 'Internet Content & Information',
            marketCap: 1800000000000,
            employees: 190000,
            founded: 1998,
            headquarters: 'Mountain View, CA',
            website: 'https://www.google.com',
            description: 'Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.',
        },
    };
    return mockCompanies[symbol] || {
        name: `${symbol} Corporation`,
        sector: 'Unknown',
        industry: 'Unknown',
        marketCap: 0,
        employees: 0,
        founded: 0,
        headquarters: 'Unknown',
        website: '',
        description: 'Company information not available.',
    };
}
async function getPeerCompanies(symbol) {
    const peerGroups = {
        'AAPL': [
            { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: -3.21, changePercent: -0.84 },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: 3.21, changePercent: 2.30 },
            { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 155.78, change: -1.89, changePercent: -1.20 },
            { symbol: 'META', name: 'Meta Platforms, Inc.', price: 485.67, change: 12.34, changePercent: 2.61 },
        ],
        'MSFT': [
            { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: -2.34, changePercent: -1.32 },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: 3.21, changePercent: 2.30 },
            { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 155.78, change: -1.89, changePercent: -1.20 },
            { symbol: 'ORCL', name: 'Oracle Corporation', price: 125.43, change: 1.23, changePercent: 0.99 },
        ],
    };
    return peerGroups[symbol] || [];
}
async function getAnalystRecommendations(symbol) {
    return {
        consensus: 'Buy',
        targetPrice: 200.0,
        recommendations: [
            { firm: 'Goldman Sachs', rating: 'Buy', targetPrice: 210.0, date: '2024-01-15' },
            { firm: 'Morgan Stanley', rating: 'Overweight', targetPrice: 195.0, date: '2024-01-14' },
            { firm: 'JP Morgan', rating: 'Buy', targetPrice: 205.0, date: '2024-01-13' },
            { firm: 'Deutsche Bank', rating: 'Hold', targetPrice: 180.0, date: '2024-01-12' },
        ],
        summary: {
            buy: 3,
            hold: 1,
            sell: 0,
            strongBuy: 0,
            strongSell: 0,
        },
    };
}
async function getStockInsights(symbol) {
    return {
        keyMetrics: {
            pe: 25.5,
            pb: 3.2,
            ps: 8.1,
            peg: 1.8,
            dividendYield: 0.5,
            beta: 1.2,
        },
        recentNews: [
            {
                title: 'Strong Q4 Earnings Beat Expectations',
                summary: 'Company reported better than expected quarterly earnings.',
                sentiment: 'positive',
                date: '2024-01-15',
            },
            {
                title: 'New Product Launch Announced',
                summary: 'Company announced launch of new innovative product.',
                sentiment: 'positive',
                date: '2024-01-10',
            },
        ],
        technicalAnalysis: {
            trend: 'Bullish',
            support: 170.0,
            resistance: 185.0,
            rsi: 65.4,
            macd: 'Bullish',
        },
        riskFactors: [
            'Market volatility',
            'Regulatory changes',
            'Competition',
            'Economic uncertainty',
        ],
    };
}
exports.default = router;
//# sourceMappingURL=stocks.js.map