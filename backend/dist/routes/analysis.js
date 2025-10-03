"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const stockData_1 = require("@/services/stockData");
const ai_1 = require("@/services/ai");
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
router.get('/technical/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.query)('timeframe').optional().isIn(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const timeframe = req.query.timeframe;
        const stockData = await stockData_1.StockDataService.getStockData({
            symbol: symbol.toUpperCase(),
            timeframe: '1d',
            period: mapTimeframeToPeriod(timeframe),
        });
        const indicators = await stockData_1.StockDataService.getTechnicalIndicators({
            symbol: symbol.toUpperCase(),
            indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'BB'],
            timeframe,
        });
        const aiAnalysis = await ai_1.AIService.generateAnalysis({
            symbol: symbol.toUpperCase(),
            analysis_type: 'technical',
            timeframe,
            indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'BB'],
        });
        const technicalMetrics = calculateTechnicalMetrics(stockData.data);
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                timeframe,
                priceData: stockData.data.slice(-100),
                indicators,
                aiAnalysis,
                technicalMetrics,
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Technical analysis failed:', error);
        res.status(500).json({
            error: 'Failed to perform technical analysis',
        });
    }
});
router.get('/fundamental/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const fundamentalData = await getFundamentalData(symbol.toUpperCase());
        const aiAnalysis = await ai_1.AIService.generateAnalysis({
            symbol: symbol.toUpperCase(),
            analysis_type: 'fundamental',
            timeframe: '1m',
        });
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                fundamental: fundamentalData,
                aiAnalysis,
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Fundamental analysis failed:', error);
        res.status(500).json({
            error: 'Failed to perform fundamental analysis',
        });
    }
});
router.get('/sentiment/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.query)('period').optional().isIn(['1d', '1w', '1m']).default('1w'),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const period = req.query.period;
        const sentimentData = await getSentimentData(symbol.toUpperCase(), period);
        const aiAnalysis = await ai_1.AIService.generateAnalysis({
            symbol: symbol.toUpperCase(),
            analysis_type: 'sentiment',
            timeframe: period,
        });
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                period,
                sentiment: sentimentData,
                aiAnalysis,
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Sentiment analysis failed:', error);
        res.status(500).json({
            error: 'Failed to perform sentiment analysis',
        });
    }
});
router.get('/comprehensive/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.query)('timeframe').optional().isIn(['1d', '1w', '1m', '3m']).default('1m'),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const timeframe = req.query.timeframe;
        const [technicalData, fundamentalData, sentimentData] = await Promise.all([
            stockData_1.StockDataService.getTechnicalIndicators({
                symbol: symbol.toUpperCase(),
                indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'BB', 'STOCH', 'ADX'],
                timeframe,
            }),
            getFundamentalData(symbol.toUpperCase()),
            getSentimentData(symbol.toUpperCase(), timeframe),
        ]);
        const stockData = await stockData_1.StockDataService.getStockData({
            symbol: symbol.toUpperCase(),
            timeframe: '1d',
            period: mapTimeframeToPeriod(timeframe),
        });
        const aiAnalysis = await ai_1.AIService.generateAnalysis({
            symbol: symbol.toUpperCase(),
            analysis_type: 'comprehensive',
            timeframe,
            indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'BB'],
        });
        const overallScore = calculateOverallScore(technicalData, fundamentalData, sentimentData);
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                timeframe,
                overallScore,
                technical: {
                    indicators: technicalData,
                    metrics: calculateTechnicalMetrics(stockData.data),
                },
                fundamental: fundamentalData,
                sentiment: sentimentData,
                aiAnalysis,
                priceData: stockData.data.slice(-50),
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Comprehensive analysis failed:', error);
        res.status(500).json({
            error: 'Failed to perform comprehensive analysis',
        });
    }
});
router.post('/custom', [
    (0, express_validator_1.body)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.body)('indicators').optional().isArray(),
    (0, express_validator_1.body)('timeframe').optional().isIn(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
    (0, express_validator_1.body)('analysisType').optional().isIn(['technical', 'fundamental', 'sentiment', 'comprehensive']).default('comprehensive'),
], validateRequest, async (req, res) => {
    try {
        const { symbol, indicators, timeframe, analysisType } = req.body;
        const stockData = await stockData_1.StockDataService.getStockData({
            symbol: symbol.toUpperCase(),
            timeframe: '1d',
            period: mapTimeframeToPeriod(timeframe),
        });
        let technicalData = null;
        if (indicators && indicators.length > 0) {
            technicalData = await stockData_1.StockDataService.getTechnicalIndicators({
                symbol: symbol.toUpperCase(),
                indicators,
                timeframe,
            });
        }
        const aiAnalysis = await ai_1.AIService.generateAnalysis({
            symbol: symbol.toUpperCase(),
            analysis_type: analysisType,
            timeframe,
            indicators,
        });
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                timeframe,
                analysisType,
                technical: technicalData,
                aiAnalysis,
                priceData: stockData.data.slice(-100),
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Custom analysis failed:', error);
        res.status(500).json({
            error: 'Failed to perform custom analysis',
        });
    }
});
router.get('/patterns/:symbol', [
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.query)('timeframe').optional().isIn(['1d', '1w', '1m']).default('1m'),
], validateRequest, async (req, res) => {
    try {
        const { symbol } = req.params;
        const timeframe = req.query.timeframe;
        const stockData = await stockData_1.StockDataService.getStockData({
            symbol: symbol.toUpperCase(),
            timeframe: '1d',
            period: mapTimeframeToPeriod(timeframe),
        });
        const patterns = detectChartPatterns(stockData.data);
        res.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                timeframe,
                patterns,
                priceData: stockData.data.slice(-100),
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Pattern analysis failed:', error);
        res.status(500).json({
            error: 'Failed to perform pattern analysis',
        });
    }
});
function mapTimeframeToPeriod(timeframe) {
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
function calculateTechnicalMetrics(priceData) {
    if (priceData.length === 0)
        return {};
    const latest = priceData[priceData.length - 1];
    const previous = priceData[priceData.length - 2] || latest;
    return {
        priceChange: latest.close - previous.close,
        priceChangePercent: ((latest.close - previous.close) / previous.close) * 100,
        volumeChange: latest.volume - previous.volume,
        high52Week: Math.max(...priceData.map(d => d.high)),
        low52Week: Math.min(...priceData.map(d => d.low)),
        averageVolume: priceData.reduce((sum, d) => sum + d.volume, 0) / priceData.length,
    };
}
async function getFundamentalData(symbol) {
    return {
        company: {
            name: `${symbol} Corporation`,
            sector: 'Technology',
            industry: 'Software',
            marketCap: 1000000000,
            employees: 50000,
        },
        valuation: {
            pe: 25.5,
            pb: 3.2,
            ps: 8.1,
            peg: 1.8,
            ev: 1200000000,
            evEbitda: 15.2,
        },
        financials: {
            revenue: 50000000,
            revenueGrowth: 12.5,
            netIncome: 8000000,
            netIncomeGrowth: 15.2,
            roe: 18.5,
            roa: 12.3,
            debtToEquity: 0.3,
            currentRatio: 2.1,
        },
        dividends: {
            yield: 2.5,
            payoutRatio: 0.4,
            annualDividend: 2.0,
            exDividendDate: '2024-02-15',
        },
    };
}
async function getSentimentData(symbol, period) {
    return {
        overall: {
            score: 0.65,
            label: 'Positive',
            confidence: 0.78,
        },
        sources: {
            news: {
                score: 0.7,
                articles: 25,
                positive: 18,
                negative: 7,
            },
            social: {
                score: 0.6,
                mentions: 150,
                positive: 90,
                negative: 60,
            },
            analyst: {
                score: 0.8,
                buy: 8,
                hold: 2,
                sell: 1,
                averageTarget: 200.0,
            },
        },
        trends: {
            last24h: 0.05,
            last7d: 0.12,
            last30d: -0.08,
        },
    };
}
function calculateOverallScore(technical, fundamental, sentiment) {
    const technicalScore = 0.4;
    const fundamentalScore = 0.4;
    const sentimentScore = 0.2;
    const score = (technicalScore * 0.7) + (fundamentalScore * 0.8) + (sentimentScore * 0.65);
    return {
        score: Math.round(score * 100) / 100,
        grade: score > 0.8 ? 'A' : score > 0.6 ? 'B' : score > 0.4 ? 'C' : 'D',
        recommendation: score > 0.7 ? 'Strong Buy' : score > 0.5 ? 'Buy' : score > 0.3 ? 'Hold' : 'Sell',
    };
}
function detectChartPatterns(priceData) {
    const patterns = [];
    if (priceData.length >= 20) {
        const recent = priceData.slice(-20);
        const highs = recent.map(d => d.high);
        const maxHigh = Math.max(...highs);
        const maxIndex = highs.indexOf(maxHigh);
        if (maxIndex > 5 && maxIndex < 15) {
            patterns.push({
                name: 'Head and Shoulders',
                type: 'Reversal',
                confidence: 0.75,
                description: 'Potential bearish reversal pattern detected',
            });
        }
    }
    return patterns;
}
exports.default = router;
//# sourceMappingURL=analysis.js.map