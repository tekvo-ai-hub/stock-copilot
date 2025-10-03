"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const database_1 = require("@/services/database");
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
router.post('/generate', [
    (0, express_validator_1.body)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.body)('timeframe').isIn(['1d', '1w', '2w', '1m', '3m']),
    (0, express_validator_1.body)('model').isIn(['lstm', 'transformer', 'ensemble', 'hybrid']),
    (0, express_validator_1.body)('confidence_threshold').optional().isFloat({ min: 0, max: 1 }).default(0.7),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { symbol, timeframe, model, confidence_threshold } = req.body;
        const stockData = await stockData_1.StockDataService.getStockData({
            symbol: symbol.toUpperCase(),
            timeframe: '1d',
            period: '1mo',
        });
        if (!stockData.data || stockData.data.length === 0) {
            return res.status(404).json({
                error: 'Stock data not found',
            });
        }
        const currentPrice = stockData.data[stockData.data.length - 1].close;
        const prediction = await ai_1.AIService.generatePrediction({
            symbol: symbol.toUpperCase(),
            timeframe,
            model,
            confidence_threshold,
        });
        const expiresAt = calculateExpirationDate(timeframe);
        const savedPrediction = await database_1.DatabaseService.createPrediction(userId, {
            symbol: symbol.toUpperCase(),
            model,
            timeframe,
            current_price: currentPrice,
            predicted_price: prediction.predicted_price.most_likely,
            confidence: prediction.confidence / 100,
            expires_at: expiresAt,
        });
        res.json({
            success: true,
            data: {
                id: savedPrediction.id,
                symbol: symbol.toUpperCase(),
                currentPrice,
                prediction: prediction.predicted_price,
                confidence: prediction.confidence,
                model,
                timeframe,
                factors: prediction.factors,
                riskLevel: prediction.risk_level,
                recommendation: prediction.recommendation,
                reasoning: prediction.reasoning,
                expiresAt: expiresAt.toISOString(),
                createdAt: savedPrediction.created_at,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Prediction generation failed:', error);
        res.status(500).json({
            error: 'Failed to generate prediction',
        });
    }
});
router.get('/', [
    (0, express_validator_1.query)('status').optional().isIn(['ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED']),
    (0, express_validator_1.query)('symbol').optional().isString(),
    (0, express_validator_1.query)('model').optional().isString(),
    (0, express_validator_1.query)('timeframe').optional().isString(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).default(20),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).default(0),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status, symbol, model, timeframe, limit, offset } = req.query;
        let predictions = await database_1.DatabaseService.getUserPredictions(userId, status);
        if (symbol) {
            predictions = predictions.filter(p => p.symbol === symbol.toString().toUpperCase());
        }
        if (model) {
            predictions = predictions.filter(p => p.model === model);
        }
        if (timeframe) {
            predictions = predictions.filter(p => p.timeframe === timeframe);
        }
        const total = predictions.length;
        const paginatedPredictions = predictions.slice(Number(offset), Number(offset) + Number(limit));
        const predictionsWithAccuracy = paginatedPredictions.map(prediction => {
            let accuracy = null;
            if (prediction.status === 'COMPLETED' && prediction.actual_price && prediction.predicted_price) {
                const actualChange = (prediction.actual_price - prediction.current_price) / prediction.current_price;
                const predictedChange = (prediction.predicted_price - prediction.current_price) / prediction.current_price;
                accuracy = 1 - Math.abs(actualChange - predictedChange) / Math.abs(actualChange);
                accuracy = Math.max(0, Math.min(1, accuracy));
            }
            return {
                id: prediction.id,
                symbol: prediction.symbol,
                model: prediction.model,
                timeframe: prediction.timeframe,
                currentPrice: prediction.current_price,
                predictedPrice: prediction.predicted_price,
                actualPrice: prediction.actual_price,
                confidence: prediction.confidence,
                accuracy,
                status: prediction.status,
                createdAt: prediction.created_at,
                updatedAt: prediction.updated_at,
                expiresAt: prediction.expires_at,
            };
        });
        res.json({
            success: true,
            data: {
                predictions: predictionsWithAccuracy,
                pagination: {
                    total,
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: Number(offset) + Number(limit) < total,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get predictions:', error);
        res.status(500).json({
            error: 'Failed to get predictions',
        });
    }
});
router.get('/:id', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const prediction = await database_1.DatabaseService.getClient().prediction.findFirst({
            where: {
                id,
                user_id: userId,
            },
        });
        if (!prediction) {
            return res.status(404).json({
                error: 'Prediction not found',
            });
        }
        let accuracy = null;
        if (prediction.status === 'COMPLETED' && prediction.actual_price && prediction.predicted_price) {
            const actualChange = (prediction.actual_price - prediction.current_price) / prediction.current_price;
            const predictedChange = (prediction.predicted_price - prediction.current_price) / prediction.current_price;
            accuracy = 1 - Math.abs(actualChange - predictedChange) / Math.abs(actualChange);
            accuracy = Math.max(0, Math.min(1, accuracy));
        }
        res.json({
            success: true,
            data: {
                id: prediction.id,
                symbol: prediction.symbol,
                model: prediction.model,
                timeframe: prediction.timeframe,
                currentPrice: prediction.current_price,
                predictedPrice: prediction.predicted_price,
                actualPrice: prediction.actual_price,
                confidence: prediction.confidence,
                accuracy,
                status: prediction.status,
                createdAt: prediction.created_at,
                updatedAt: prediction.updated_at,
                expiresAt: prediction.expires_at,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get prediction:', error);
        res.status(500).json({
            error: 'Failed to get prediction',
        });
    }
});
router.put('/:id/update', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
    (0, express_validator_1.body)('actual_price').isFloat({ min: 0 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { actual_price } = req.body;
        const prediction = await database_1.DatabaseService.getClient().prediction.findFirst({
            where: {
                id,
                user_id: userId,
            },
        });
        if (!prediction) {
            return res.status(404).json({
                error: 'Prediction not found',
            });
        }
        const actualChange = (actual_price - prediction.current_price) / prediction.current_price;
        const predictedChange = (prediction.predicted_price - prediction.current_price) / prediction.current_price;
        const accuracy = 1 - Math.abs(actualChange - predictedChange) / Math.abs(actualChange);
        const finalAccuracy = Math.max(0, Math.min(1, accuracy));
        const updatedPrediction = await database_1.DatabaseService.updatePrediction(id, {
            actual_price: actual_price,
            accuracy: finalAccuracy,
            status: 'COMPLETED',
        });
        res.json({
            success: true,
            data: {
                id: updatedPrediction.id,
                symbol: updatedPrediction.symbol,
                actualPrice: actual_price,
                accuracy: finalAccuracy,
                status: 'COMPLETED',
                updatedAt: updatedPrediction.updated_at,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update prediction:', error);
        res.status(500).json({
            error: 'Failed to update prediction',
        });
    }
});
router.delete('/:id', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const prediction = await database_1.DatabaseService.getClient().prediction.findFirst({
            where: {
                id,
                user_id: userId,
            },
        });
        if (!prediction) {
            return res.status(404).json({
                error: 'Prediction not found',
            });
        }
        await database_1.DatabaseService.updatePrediction(id, {
            status: 'CANCELLED',
        });
        res.json({
            success: true,
            message: 'Prediction cancelled successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to cancel prediction:', error);
        res.status(500).json({
            error: 'Failed to cancel prediction',
        });
    }
});
router.get('/accuracy/stats', [
    (0, express_validator_1.query)('period').optional().isIn(['7d', '30d', '90d', '1y']).default('30d'),
    (0, express_validator_1.query)('model').optional().isString(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { period, model } = req.query;
        const days = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365,
        }[period] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const accuracyData = await database_1.DatabaseService.getPredictionAccuracy(userId, days);
        const filteredData = model
            ? accuracyData.filter(p => p.model === model)
            : accuracyData;
        const stats = calculateAccuracyStats(filteredData);
        res.json({
            success: true,
            data: {
                period,
                model: model || 'all',
                totalPredictions: filteredData.length,
                completedPredictions: filteredData.filter(p => p.accuracy !== null).length,
                statistics: stats,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get accuracy stats:', error);
        res.status(500).json({
            error: 'Failed to get accuracy statistics',
        });
    }
});
router.get('/models/performance', async (req, res) => {
    try {
        const userId = req.user?.id;
        const predictions = await database_1.DatabaseService.getUserPredictions(userId, 'COMPLETED');
        const modelPerformance = predictions.reduce((acc, pred) => {
            if (!pred.accuracy)
                return acc;
            const model = pred.model;
            if (!acc[model]) {
                acc[model] = {
                    model,
                    totalPredictions: 0,
                    totalAccuracy: 0,
                    averageAccuracy: 0,
                    averageConfidence: 0,
                    totalConfidence: 0,
                };
            }
            acc[model].totalPredictions++;
            acc[model].totalAccuracy += pred.accuracy;
            acc[model].totalConfidence += pred.confidence;
            return acc;
        }, {});
        Object.values(modelPerformance).forEach((model) => {
            model.averageAccuracy = model.totalAccuracy / model.totalPredictions;
            model.averageConfidence = model.totalConfidence / model.totalPredictions;
        });
        res.json({
            success: true,
            data: {
                models: Object.values(modelPerformance),
                lastUpdated: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get model performance:', error);
        res.status(500).json({
            error: 'Failed to get model performance',
        });
    }
});
function calculateExpirationDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
        case '1d':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        case '1w':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        case '2w':
            return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        case '1m':
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        case '3m':
            return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        default:
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
}
function calculateAccuracyStats(data) {
    const completed = data.filter(p => p.accuracy !== null);
    if (completed.length === 0) {
        return {
            averageAccuracy: 0,
            medianAccuracy: 0,
            bestAccuracy: 0,
            worstAccuracy: 0,
            accuracyDistribution: {},
        };
    }
    const accuracies = completed.map(p => p.accuracy);
    const sortedAccuracies = accuracies.sort((a, b) => a - b);
    return {
        averageAccuracy: accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length,
        medianAccuracy: sortedAccuracies[Math.floor(sortedAccuracies.length / 2)],
        bestAccuracy: Math.max(...accuracies),
        worstAccuracy: Math.min(...accuracies),
        accuracyDistribution: {
            excellent: accuracies.filter(acc => acc >= 0.8).length,
            good: accuracies.filter(acc => acc >= 0.6 && acc < 0.8).length,
            fair: accuracies.filter(acc => acc >= 0.4 && acc < 0.6).length,
            poor: accuracies.filter(acc => acc < 0.4).length,
        },
    };
}
exports.default = router;
//# sourceMappingURL=predictions.js.map