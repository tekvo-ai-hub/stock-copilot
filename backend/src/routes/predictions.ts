import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '@/services/database';
import { StockDataService } from '@/services/stockData';
import { AIService } from '@/services/ai';
import { logger } from '@/utils/logger';

const router = express.Router();

// Validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * @route POST /api/v1/predictions/generate
 * @desc Generate AI prediction for a stock
 */
router.post('/generate', [
  body('symbol').isString().isLength({ min: 1, max: 10 }),
  body('timeframe').isIn(['1d', '1w', '2w', '1m', '3m']),
  body('model').isIn(['lstm', 'transformer', 'ensemble', 'hybrid']),
  body('confidence_threshold').optional().isFloat({ min: 0, max: 1 }).default(0.7),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { symbol, timeframe, model, confidence_threshold } = req.body;

    // Get current stock price
    const stockData = await StockDataService.getStockData({
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

    // Generate AI prediction
    const prediction = await AIService.generatePrediction({
      symbol: symbol.toUpperCase(),
      timeframe,
      model,
      confidence_threshold,
    });

    // Calculate expiration date
    const expiresAt = calculateExpirationDate(timeframe);

    // Save prediction to database
    const savedPrediction = await DatabaseService.createPrediction(userId, {
      symbol: symbol.toUpperCase(),
      model,
      timeframe,
      current_price: currentPrice,
      predicted_price: prediction.predicted_price.most_likely,
      confidence: prediction.confidence / 100, // Convert to 0-1 scale
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
  } catch (error) {
    logger.error('Prediction generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate prediction',
    });
  }
});

/**
 * @route GET /api/v1/predictions
 * @desc Get user's predictions
 */
router.get('/', [
  query('status').optional().isIn(['ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED']),
  query('symbol').optional().isString(),
  query('model').optional().isString(),
  query('timeframe').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }).default(20),
  query('offset').optional().isInt({ min: 0 }).default(0),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { status, symbol, model, timeframe, limit, offset } = req.query;

    // Get predictions from database
    let predictions = await DatabaseService.getUserPredictions(userId, status as string);

    // Apply filters
    if (symbol) {
      predictions = predictions.filter(p => p.symbol === symbol.toString().toUpperCase());
    }
    if (model) {
      predictions = predictions.filter(p => p.model === model);
    }
    if (timeframe) {
      predictions = predictions.filter(p => p.timeframe === timeframe);
    }

    // Apply pagination
    const total = predictions.length;
    const paginatedPredictions = predictions.slice(Number(offset), Number(offset) + Number(limit));

    // Calculate accuracy for completed predictions
    const predictionsWithAccuracy = paginatedPredictions.map(prediction => {
      let accuracy = null;
      if (prediction.status === 'COMPLETED' && prediction.actual_price && prediction.predicted_price) {
        const actualChange = (prediction.actual_price - prediction.current_price) / prediction.current_price;
        const predictedChange = (prediction.predicted_price - prediction.current_price) / prediction.current_price;
        accuracy = 1 - Math.abs(actualChange - predictedChange) / Math.abs(actualChange);
        accuracy = Math.max(0, Math.min(1, accuracy)); // Clamp between 0 and 1
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
  } catch (error) {
    logger.error('Failed to get predictions:', error);
    res.status(500).json({
      error: 'Failed to get predictions',
    });
  }
});

/**
 * @route GET /api/v1/predictions/:id
 * @desc Get specific prediction details
 */
router.get('/:id', [
  param('id').isString().isLength({ min: 1 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Get prediction from database
    const prediction = await DatabaseService.getClient().prediction.findFirst({
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

    // Calculate accuracy if completed
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
  } catch (error) {
    logger.error('Failed to get prediction:', error);
    res.status(500).json({
      error: 'Failed to get prediction',
    });
  }
});

/**
 * @route PUT /api/v1/predictions/:id/update
 * @desc Update prediction with actual price
 */
router.put('/:id/update', [
  param('id').isString().isLength({ min: 1 }),
  body('actual_price').isFloat({ min: 0 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { actual_price } = req.body;

    // Get prediction
    const prediction = await DatabaseService.getClient().prediction.findFirst({
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

    // Calculate accuracy
    const actualChange = (actual_price - prediction.current_price) / prediction.current_price;
    const predictedChange = (prediction.predicted_price - prediction.current_price) / prediction.current_price;
    const accuracy = 1 - Math.abs(actualChange - predictedChange) / Math.abs(actualChange);
    const finalAccuracy = Math.max(0, Math.min(1, accuracy));

    // Update prediction
    const updatedPrediction = await DatabaseService.updatePrediction(id, {
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
  } catch (error) {
    logger.error('Failed to update prediction:', error);
    res.status(500).json({
      error: 'Failed to update prediction',
    });
  }
});

/**
 * @route DELETE /api/v1/predictions/:id
 * @desc Cancel a prediction
 */
router.delete('/:id', [
  param('id').isString().isLength({ min: 1 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Check if prediction exists and belongs to user
    const prediction = await DatabaseService.getClient().prediction.findFirst({
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

    // Cancel prediction
    await DatabaseService.updatePrediction(id, {
      status: 'CANCELLED',
    });

    res.json({
      success: true,
      message: 'Prediction cancelled successfully',
    });
  } catch (error) {
    logger.error('Failed to cancel prediction:', error);
    res.status(500).json({
      error: 'Failed to cancel prediction',
    });
  }
});

/**
 * @route GET /api/v1/predictions/accuracy/stats
 * @desc Get prediction accuracy statistics
 */
router.get('/accuracy/stats', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).default('30d'),
  query('model').optional().isString(),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { period, model } = req.query;

    // Calculate date range
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    }[period as string] || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get accuracy data
    const accuracyData = await DatabaseService.getPredictionAccuracy(userId, days);

    // Filter by model if specified
    const filteredData = model 
      ? accuracyData.filter(p => p.model === model)
      : accuracyData;

    // Calculate statistics
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
  } catch (error) {
    logger.error('Failed to get accuracy stats:', error);
    res.status(500).json({
      error: 'Failed to get accuracy statistics',
    });
  }
});

/**
 * @route GET /api/v1/predictions/models/performance
 * @desc Get model performance comparison
 */
router.get('/models/performance', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;

    // Get predictions for all models
    const predictions = await DatabaseService.getUserPredictions(userId, 'COMPLETED');

    // Group by model and calculate performance
    const modelPerformance = predictions.reduce((acc, pred) => {
      if (!pred.accuracy) return acc;

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
    }, {} as any);

    // Calculate averages
    Object.values(modelPerformance).forEach((model: any) => {
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
  } catch (error) {
    logger.error('Failed to get model performance:', error);
    res.status(500).json({
      error: 'Failed to get model performance',
    });
  }
});

// Helper functions
function calculateExpirationDate(timeframe: string): Date {
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

function calculateAccuracyStats(data: any[]) {
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

export default router;
