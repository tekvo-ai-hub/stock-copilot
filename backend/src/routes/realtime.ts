import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { RealtimeDataService } from '@/services/realtimeData';
import { FinnhubService } from '@/services/finnhub';
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
 * @route GET /api/v1/realtime/quote/:symbol
 * @desc Get real-time stock quote
 */
router.get('/quote/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const quote = await RealtimeDataService.getRealTimeQuote(symbol.toUpperCase());

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    logger.error('Failed to get real-time quote:', error);
    res.status(500).json({
      error: 'Failed to get real-time quote',
    });
  }
});

/**
 * @route GET /api/v1/realtime/market-overview
 * @desc Get real-time market overview
 */
router.get('/market-overview', async (req: express.Request, res: express.Response) => {
  try {
    const overview = await RealtimeDataService.getRealTimeMarketOverview();

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    logger.error('Failed to get market overview:', error);
    res.status(500).json({
      error: 'Failed to get market overview',
    });
  }
});

/**
 * @route GET /api/v1/realtime/indicators/:symbol
 * @desc Get real-time technical indicators
 */
router.get('/indicators/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('timeframe').optional().isIn(['1d', '1w', '1m', '3m', '6m', '1y']).default('1d'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const { timeframe } = req.query;

    const indicators = await RealtimeDataService.getRealTimeTechnicalIndicators(
      symbol.toUpperCase(),
      timeframe as string
    );

    res.json({
      success: true,
      data: indicators,
    });
  } catch (error) {
    logger.error('Failed to get technical indicators:', error);
    res.status(500).json({
      error: 'Failed to get technical indicators',
    });
  }
});

/**
 * @route GET /api/v1/realtime/news/:symbol
 * @desc Get real-time company news
 */
router.get('/news/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).default(10),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const { limit } = req.query;

    const news = await RealtimeDataService.getRealTimeCompanyNews(
      symbol.toUpperCase(),
      Number(limit)
    );

    res.json({
      success: true,
      data: news,
    });
  } catch (error) {
    logger.error('Failed to get company news:', error);
    res.status(500).json({
      error: 'Failed to get company news',
    });
  }
});

/**
 * @route POST /api/v1/realtime/subscribe
 * @desc Subscribe to real-time updates for a symbol
 */
router.post('/subscribe', [
  body('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.body;
    RealtimeDataService.subscribeToSymbol(symbol.toUpperCase());

    res.json({
      success: true,
      message: `Subscribed to real-time updates for ${symbol.toUpperCase()}`,
      data: {
        symbol: symbol.toUpperCase(),
        subscribedSymbols: RealtimeDataService.getSubscribedSymbols(),
      },
    });
  } catch (error) {
    logger.error('Failed to subscribe to symbol:', error);
    res.status(500).json({
      error: 'Failed to subscribe to symbol',
    });
  }
});

/**
 * @route POST /api/v1/realtime/unsubscribe
 * @desc Unsubscribe from real-time updates for a symbol
 */
router.post('/unsubscribe', [
  body('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.body;
    RealtimeDataService.unsubscribeFromSymbol(symbol.toUpperCase());

    res.json({
      success: true,
      message: `Unsubscribed from real-time updates for ${symbol.toUpperCase()}`,
      data: {
        symbol: symbol.toUpperCase(),
        subscribedSymbols: RealtimeDataService.getSubscribedSymbols(),
      },
    });
  } catch (error) {
    logger.error('Failed to unsubscribe from symbol:', error);
    res.status(500).json({
      error: 'Failed to unsubscribe from symbol',
    });
  }
});

/**
 * @route GET /api/v1/realtime/subscriptions
 * @desc Get current subscriptions
 */
router.get('/subscriptions', async (req: express.Request, res: express.Response) => {
  try {
    const subscriptions = RealtimeDataService.getSubscribedSymbols();

    res.json({
      success: true,
      data: {
        subscribedSymbols: subscriptions,
        count: subscriptions.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get subscriptions:', error);
    res.status(500).json({
      error: 'Failed to get subscriptions',
    });
  }
});

/**
 * @route GET /api/v1/realtime/status
 * @desc Get real-time service status
 */
router.get('/status', async (req: express.Request, res: express.Response) => {
  try {
    const status = RealtimeDataService.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Failed to get service status:', error);
    res.status(500).json({
      error: 'Failed to get service status',
    });
  }
});

/**
 * @route PUT /api/v1/realtime/frequency
 * @desc Update real-time update frequency
 */
router.put('/frequency', [
  body('frequency').isInt({ min: 1000, max: 60000 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { frequency } = req.body;
    RealtimeDataService.setUpdateFrequency(frequency);

    res.json({
      success: true,
      message: `Update frequency set to ${frequency}ms`,
      data: {
        frequency,
        status: RealtimeDataService.getStatus(),
      },
    });
  } catch (error) {
    logger.error('Failed to update frequency:', error);
    res.status(500).json({
      error: 'Failed to update frequency',
    });
  }
});

/**
 * @route GET /api/v1/realtime/market-status
 * @desc Get real-time market status
 */
router.get('/market-status', async (req: express.Request, res: express.Response) => {
  try {
    const marketStatus = await FinnhubService.getMarketStatus();

    res.json({
      success: true,
      data: marketStatus,
    });
  } catch (error) {
    logger.error('Failed to get market status:', error);
    res.status(500).json({
      error: 'Failed to get market status',
    });
  }
});

/**
 * @route GET /api/v1/realtime/movers
 * @desc Get real-time market movers
 */
router.get('/movers', [
  query('type').optional().isIn(['gainers', 'losers', 'most_active']).default('gainers'),
  query('limit').optional().isInt({ min: 1, max: 50 }).default(10),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { type, limit } = req.query;
    const movers = await FinnhubService.getMarketMovers(type as any, Number(limit));

    res.json({
      success: true,
      data: {
        type,
        movers,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get market movers:', error);
    res.status(500).json({
      error: 'Failed to get market movers',
    });
  }
});

/**
 * @route GET /api/v1/realtime/sectors
 * @desc Get real-time sector performance
 */
router.get('/sectors', async (req: express.Request, res: express.Response) => {
  try {
    const sectors = await FinnhubService.getSectorPerformance();

    res.json({
      success: true,
      data: {
        sectors,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get sector performance:', error);
    res.status(500).json({
      error: 'Failed to get sector performance',
    });
  }
});

/**
 * @route GET /api/v1/realtime/news
 * @desc Get real-time market news
 */
router.get('/news', [
  query('category').optional().isIn(['general', 'earnings', 'mergers', 'ipo', 'crypto']).default('general'),
  query('limit').optional().isInt({ min: 1, max: 50 }).default(20),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { category, limit } = req.query;
    const news = await FinnhubService.getMarketNews(category as string, Number(limit));

    res.json({
      success: true,
      data: {
        category,
        news,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get market news:', error);
    res.status(500).json({
      error: 'Failed to get market news',
    });
  }
});

/**
 * @route GET /api/v1/realtime/company/:symbol
 * @desc Get real-time company profile
 */
router.get('/company/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const profile = await FinnhubService.getCompanyProfile(symbol.toUpperCase());

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Failed to get company profile:', error);
    res.status(500).json({
      error: 'Failed to get company profile',
    });
  }
});

export default router;
