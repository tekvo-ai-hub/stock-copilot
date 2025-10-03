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
 * @route GET /api/v1/analysis/technical/:symbol
 * @desc Get technical analysis for a stock
 */
router.get('/technical/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('timeframe').optional().isIn(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const timeframe = req.query.timeframe as string;

    // Get stock data
    const stockData = await StockDataService.getStockData({
      symbol: symbol.toUpperCase(),
      timeframe: '1d',
      period: mapTimeframeToPeriod(timeframe),
    });

    // Get technical indicators
    const indicators = await StockDataService.getTechnicalIndicators({
      symbol: symbol.toUpperCase(),
      indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'BB'],
      timeframe,
    });

    // Generate AI analysis
    const aiAnalysis = await AIService.generateAnalysis({
      symbol: symbol.toUpperCase(),
      analysis_type: 'technical',
      timeframe,
      indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'BB'],
    });

    // Calculate additional technical metrics
    const technicalMetrics = calculateTechnicalMetrics(stockData.data);

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        timeframe,
        priceData: stockData.data.slice(-100), // Last 100 data points
        indicators,
        aiAnalysis,
        technicalMetrics,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Technical analysis failed:', error);
    res.status(500).json({
      error: 'Failed to perform technical analysis',
    });
  }
});

/**
 * @route GET /api/v1/analysis/fundamental/:symbol
 * @desc Get fundamental analysis for a stock
 */
router.get('/fundamental/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;

    // Get fundamental data (mock for now)
    const fundamentalData = await getFundamentalData(symbol.toUpperCase());

    // Generate AI analysis
    const aiAnalysis = await AIService.generateAnalysis({
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
  } catch (error) {
    logger.error('Fundamental analysis failed:', error);
    res.status(500).json({
      error: 'Failed to perform fundamental analysis',
    });
  }
});

/**
 * @route GET /api/v1/analysis/sentiment/:symbol
 * @desc Get sentiment analysis for a stock
 */
router.get('/sentiment/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('period').optional().isIn(['1d', '1w', '1m']).default('1w'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const period = req.query.period as string;

    // Get sentiment data (mock for now)
    const sentimentData = await getSentimentData(symbol.toUpperCase(), period);

    // Generate AI analysis
    const aiAnalysis = await AIService.generateAnalysis({
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
  } catch (error) {
    logger.error('Sentiment analysis failed:', error);
    res.status(500).json({
      error: 'Failed to perform sentiment analysis',
    });
  }
});

/**
 * @route GET /api/v1/analysis/comprehensive/:symbol
 * @desc Get comprehensive analysis for a stock
 */
router.get('/comprehensive/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('timeframe').optional().isIn(['1d', '1w', '1m', '3m']).default('1m'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const timeframe = req.query.timeframe as string;

    // Get all analysis types in parallel
    const [technicalData, fundamentalData, sentimentData] = await Promise.all([
      StockDataService.getTechnicalIndicators({
        symbol: symbol.toUpperCase(),
        indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'BB', 'STOCH', 'ADX'],
        timeframe,
      }),
      getFundamentalData(symbol.toUpperCase()),
      getSentimentData(symbol.toUpperCase(), timeframe),
    ]);

    // Get stock price data
    const stockData = await StockDataService.getStockData({
      symbol: symbol.toUpperCase(),
      timeframe: '1d',
      period: mapTimeframeToPeriod(timeframe),
    });

    // Generate comprehensive AI analysis
    const aiAnalysis = await AIService.generateAnalysis({
      symbol: symbol.toUpperCase(),
      analysis_type: 'comprehensive',
      timeframe,
      indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'BB'],
    });

    // Calculate overall score
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
        priceData: stockData.data.slice(-50), // Last 50 data points
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Comprehensive analysis failed:', error);
    res.status(500).json({
      error: 'Failed to perform comprehensive analysis',
    });
  }
});

/**
 * @route POST /api/v1/analysis/custom
 * @desc Perform custom analysis with user-defined parameters
 */
router.post('/custom', [
  body('symbol').isString().isLength({ min: 1, max: 10 }),
  body('indicators').optional().isArray(),
  body('timeframe').optional().isIn(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
  body('analysisType').optional().isIn(['technical', 'fundamental', 'sentiment', 'comprehensive']).default('comprehensive'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol, indicators, timeframe, analysisType } = req.body;

    // Get stock data
    const stockData = await StockDataService.getStockData({
      symbol: symbol.toUpperCase(),
      timeframe: '1d',
      period: mapTimeframeToPeriod(timeframe),
    });

    // Get technical indicators if requested
    let technicalData = null;
    if (indicators && indicators.length > 0) {
      technicalData = await StockDataService.getTechnicalIndicators({
        symbol: symbol.toUpperCase(),
        indicators,
        timeframe,
      });
    }

    // Generate AI analysis
    const aiAnalysis = await AIService.generateAnalysis({
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
  } catch (error) {
    logger.error('Custom analysis failed:', error);
    res.status(500).json({
      error: 'Failed to perform custom analysis',
    });
  }
});

/**
 * @route GET /api/v1/analysis/patterns/:symbol
 * @desc Get chart pattern analysis
 */
router.get('/patterns/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('timeframe').optional().isIn(['1d', '1w', '1m']).default('1m'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const timeframe = req.query.timeframe as string;

    // Get stock data
    const stockData = await StockDataService.getStockData({
      symbol: symbol.toUpperCase(),
      timeframe: '1d',
      period: mapTimeframeToPeriod(timeframe),
    });

    // Detect chart patterns (mock implementation)
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
  } catch (error) {
    logger.error('Pattern analysis failed:', error);
    res.status(500).json({
      error: 'Failed to perform pattern analysis',
    });
  }
});

// Helper functions
function mapTimeframeToPeriod(timeframe: string): string {
  const mapping: { [key: string]: string } = {
    '1d': '1d',
    '1w': '5d',
    '1m': '1mo',
    '3m': '3mo',
    '6m': '6mo',
    '1y': '1y',
  };
  return mapping[timeframe] || '1mo';
}

function calculateTechnicalMetrics(priceData: any[]) {
  if (priceData.length === 0) return {};

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

async function getFundamentalData(symbol: string) {
  // Mock fundamental data - replace with real API calls
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

async function getSentimentData(symbol: string, period: string) {
  // Mock sentiment data - replace with real API calls
  return {
    overall: {
      score: 0.65, // -1 to 1 scale
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

function calculateOverallScore(technical: any, fundamental: any, sentiment: any) {
  // Simple scoring algorithm - can be made more sophisticated
  const technicalScore = 0.4; // Weight for technical analysis
  const fundamentalScore = 0.4; // Weight for fundamental analysis
  const sentimentScore = 0.2; // Weight for sentiment analysis

  // Mock calculation - replace with real scoring logic
  const score = (technicalScore * 0.7) + (fundamentalScore * 0.8) + (sentimentScore * 0.65);
  
  return {
    score: Math.round(score * 100) / 100,
    grade: score > 0.8 ? 'A' : score > 0.6 ? 'B' : score > 0.4 ? 'C' : 'D',
    recommendation: score > 0.7 ? 'Strong Buy' : score > 0.5 ? 'Buy' : score > 0.3 ? 'Hold' : 'Sell',
  };
}

function detectChartPatterns(priceData: any[]) {
  // Mock pattern detection - replace with real pattern recognition
  const patterns = [];
  
  if (priceData.length >= 20) {
    // Simple head and shoulders detection
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

export default router;
