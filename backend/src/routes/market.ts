import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '@/services/database';
import { StockDataService } from '@/services/stockData';
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
 * @route GET /api/v1/market/overview
 * @desc Get market overview data
 */
router.get('/overview', async (req: express.Request, res: express.Response) => {
  try {
    // Get market indices
    const marketIndices = await DatabaseService.getMarketIndices();
    
    // Get market overview from external API
    const marketOverview = await StockDataService.getMarketOverview();

    res.json({
      success: true,
      data: {
        indices: marketIndices.map(index => ({
          symbol: index.symbol,
          name: index.name,
          price: index.price,
          change: index.change,
          changePercent: index.change_percent,
          volume: index.volume,
          marketCap: index.market_cap,
          updatedAt: index.updated_at,
        })),
        overview: marketOverview,
        marketStatus: 'Open', // Mock market status
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Market overview failed:', error);
    res.status(500).json({
      error: 'Failed to fetch market overview',
    });
  }
});

/**
 * @route GET /api/v1/market/indices
 * @desc Get market indices data
 */
router.get('/indices', async (req: express.Request, res: express.Response) => {
  try {
    const indices = await DatabaseService.getMarketIndices();

    res.json({
      success: true,
      data: indices.map(index => ({
        id: index.id,
        symbol: index.symbol,
        name: index.name,
        price: index.price,
        change: index.change,
        changePercent: index.change_percent,
        volume: index.volume,
        marketCap: index.market_cap,
        updatedAt: index.updated_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to get market indices:', error);
    res.status(500).json({
      error: 'Failed to get market indices',
    });
  }
});

/**
 * @route GET /api/v1/market/movers
 * @desc Get top movers (gainers and losers)
 */
router.get('/movers', [
  query('type').optional().isIn(['gainers', 'losers', 'most_active']).default('gainers'),
  query('limit').optional().isInt({ min: 1, max: 50 }).default(10),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { type, limit } = req.query;

    // Mock movers data - replace with real API calls
    const moversData = await getMoversData(type as string, Number(limit));

    res.json({
      success: true,
      data: {
        type,
        movers: moversData,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get movers:', error);
    res.status(500).json({
      error: 'Failed to get movers data',
    });
  }
});

/**
 * @route GET /api/v1/market/sectors
 * @desc Get sector performance
 */
router.get('/sectors', async (req: express.Request, res: express.Response) => {
  try {
    // Mock sector performance data - replace with real API calls
    const sectorPerformance = await getSectorPerformance();

    res.json({
      success: true,
      data: {
        sectors: sectorPerformance,
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
 * @route GET /api/v1/market/trending
 * @desc Get trending stocks
 */
router.get('/trending', [
  query('period').optional().isIn(['1h', '4h', '1d', '1w']).default('1d'),
  query('limit').optional().isInt({ min: 1, max: 50 }).default(20),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { period, limit } = req.query;

    // Mock trending stocks data - replace with real API calls
    const trendingStocks = await getTrendingStocks(period as string, Number(limit));

    res.json({
      success: true,
      data: {
        period,
        trending: trendingStocks,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get trending stocks:', error);
    res.status(500).json({
      error: 'Failed to get trending stocks',
    });
  }
});

/**
 * @route GET /api/v1/market/news
 * @desc Get market news
 */
router.get('/news', [
  query('category').optional().isIn(['general', 'earnings', 'mergers', 'ipo', 'crypto']).default('general'),
  query('limit').optional().isInt({ min: 1, max: 50 }).default(20),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { category, limit } = req.query;

    // Mock news data - replace with real API calls
    const newsData = await getMarketNews(category as string, Number(limit));

    res.json({
      success: true,
      data: {
        category,
        news: newsData,
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
 * @route GET /api/v1/market/economic-indicators
 * @desc Get economic indicators
 */
router.get('/economic-indicators', async (req: express.Request, res: express.Response) => {
  try {
    // Mock economic indicators data - replace with real API calls
    const economicIndicators = await getEconomicIndicators();

    res.json({
      success: true,
      data: {
        indicators: economicIndicators,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get economic indicators:', error);
    res.status(500).json({
      error: 'Failed to get economic indicators',
    });
  }
});

/**
 * @route GET /api/v1/market/volatility
 * @desc Get market volatility data
 */
router.get('/volatility', [
  query('period').optional().isIn(['1d', '1w', '1m', '3m']).default('1m'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { period } = req.query;

    // Mock volatility data - replace with real API calls
    const volatilityData = await getVolatilityData(period as string);

    res.json({
      success: true,
      data: {
        period,
        volatility: volatilityData,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get volatility data:', error);
    res.status(500).json({
      error: 'Failed to get volatility data',
    });
  }
});

/**
 * @route GET /api/v1/market/sentiment
 * @desc Get market sentiment data
 */
router.get('/sentiment', async (req: express.Request, res: express.Response) => {
  try {
    // Mock sentiment data - replace with real API calls
    const sentimentData = await getMarketSentiment();

    res.json({
      success: true,
      data: {
        sentiment: sentimentData,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get market sentiment:', error);
    res.status(500).json({
      error: 'Failed to get market sentiment',
    });
  }
});

/**
 * @route GET /api/v1/market/calendar
 * @desc Get market calendar events
 */
router.get('/calendar', [
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('type').optional().isIn(['earnings', 'dividends', 'splits', 'ipos', 'all']).default('all'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { start_date, end_date, type } = req.query;

    // Mock calendar data - replace with real API calls
    const calendarData = await getMarketCalendar(
      start_date as string,
      end_date as string,
      type as string
    );

    res.json({
      success: true,
      data: {
        events: calendarData,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to get market calendar:', error);
    res.status(500).json({
      error: 'Failed to get market calendar',
    });
  }
});

// Helper functions for mock data
async function getMoversData(type: string, limit: number) {
  // Mock data - replace with real API calls
  const mockData = {
    gainers: [
      { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.28, change: 35.42, changePercent: 4.22, volume: 45000000 },
      { symbol: 'TSLA', name: 'Tesla, Inc.', price: 248.12, change: 8.45, changePercent: 3.53, volume: 38000000 },
      { symbol: 'AMD', name: 'Advanced Micro Devices', price: 142.56, change: 4.23, changePercent: 3.06, volume: 32000000 },
      { symbol: 'META', name: 'Meta Platforms, Inc.', price: 485.67, change: 12.34, changePercent: 2.61, volume: 28000000 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: 3.21, changePercent: 2.30, volume: 25000000 },
    ],
    losers: [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: -2.34, changePercent: -1.32, volume: 55000000 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: -3.21, changePercent: -0.84, volume: 42000000 },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 155.78, change: -1.89, changePercent: -1.20, volume: 35000000 },
      { symbol: 'NFLX', name: 'Netflix, Inc.', price: 485.67, change: -5.67, changePercent: -1.15, volume: 18000000 },
      { symbol: 'DIS', name: 'The Walt Disney Company', price: 95.43, change: -1.12, changePercent: -1.16, volume: 22000000 },
    ],
    most_active: [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: -2.34, changePercent: -1.32, volume: 55000000 },
      { symbol: 'TSLA', name: 'Tesla, Inc.', price: 248.12, change: 8.45, changePercent: 3.53, volume: 38000000 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.28, change: 35.42, changePercent: 4.22, volume: 45000000 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: -3.21, changePercent: -0.84, volume: 42000000 },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 155.78, change: -1.89, changePercent: -1.20, volume: 35000000 },
    ],
  };

  return mockData[type as keyof typeof mockData]?.slice(0, limit) || [];
}

async function getSectorPerformance() {
  // Mock sector performance data
  return [
    { sector: 'Technology', change: 1.2, changePercent: 0.8, marketCap: 12000000000000 },
    { sector: 'Healthcare', change: 0.8, changePercent: 0.5, marketCap: 8000000000000 },
    { sector: 'Energy', change: 2.1, changePercent: 1.3, marketCap: 3000000000000 },
    { sector: 'Financials', change: -0.3, changePercent: -0.2, marketCap: 6000000000000 },
    { sector: 'Consumer Discretionary', change: 0.9, changePercent: 0.6, marketCap: 5000000000000 },
    { sector: 'Consumer Staples', change: 0.4, changePercent: 0.3, marketCap: 4000000000000 },
    { sector: 'Industrials', change: 0.6, changePercent: 0.4, marketCap: 3500000000000 },
    { sector: 'Materials', change: 1.1, changePercent: 0.7, marketCap: 2000000000000 },
    { sector: 'Utilities', change: 0.2, changePercent: 0.1, marketCap: 1500000000000 },
    { sector: 'Real Estate', change: -0.1, changePercent: -0.1, marketCap: 1000000000000 },
  ];
}

async function getTrendingStocks(period: string, limit: number) {
  // Mock trending stocks data
  const trendingStocks = [
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.28, change: 35.42, changePercent: 4.22, volume: 45000000, trendScore: 95 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: 248.12, change: 8.45, changePercent: 3.53, volume: 38000000, trendScore: 88 },
    { symbol: 'AMD', name: 'Advanced Micro Devices', price: 142.56, change: 4.23, changePercent: 3.06, volume: 32000000, trendScore: 82 },
    { symbol: 'META', name: 'Meta Platforms, Inc.', price: 485.67, change: 12.34, changePercent: 2.61, volume: 28000000, trendScore: 78 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: 3.21, changePercent: 2.30, volume: 25000000, trendScore: 75 },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: -2.34, changePercent: -1.32, volume: 55000000, trendScore: 72 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: -3.21, changePercent: -0.84, volume: 42000000, trendScore: 68 },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 155.78, change: -1.89, changePercent: -1.20, volume: 35000000, trendScore: 65 },
  ];

  return trendingStocks.slice(0, limit);
}

async function getMarketNews(category: string, limit: number) {
  // Mock news data
  const newsData = [
    {
      id: '1',
      title: 'NVIDIA Reports Record Q4 Earnings, AI Demand Surges',
      summary: 'NVIDIA Corporation reported record quarterly earnings with AI chip demand driving revenue growth.',
      source: 'Reuters',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      category: 'earnings',
      sentiment: 'positive',
      impact: 'high',
    },
    {
      id: '2',
      title: 'Federal Reserve Holds Interest Rates Steady',
      summary: 'The Federal Reserve maintained current interest rates amid inflation concerns and economic uncertainty.',
      source: 'Bloomberg',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      category: 'general',
      sentiment: 'neutral',
      impact: 'medium',
    },
    {
      id: '3',
      title: 'Tesla Announces New Gigafactory in Texas',
      summary: 'Tesla Inc. announced plans to build a new Gigafactory in Texas to meet growing demand for electric vehicles.',
      source: 'CNBC',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      category: 'general',
      sentiment: 'positive',
      impact: 'medium',
    },
  ];

  return category === 'all' ? newsData : newsData.filter(news => news.category === category);
}

async function getEconomicIndicators() {
  // Mock economic indicators data
  return [
    {
      name: 'GDP Growth Rate',
      value: '2.1%',
      change: 0.2,
      changePercent: 10.5,
      period: 'Q4 2023',
      impact: 'positive',
    },
    {
      name: 'Inflation Rate (CPI)',
      value: '3.2%',
      change: -0.1,
      changePercent: -3.0,
      period: 'January 2024',
      impact: 'positive',
    },
    {
      name: 'Unemployment Rate',
      value: '3.7%',
      change: 0.1,
      changePercent: 2.8,
      period: 'January 2024',
      impact: 'negative',
    },
    {
      name: 'Federal Funds Rate',
      value: '5.25%',
      change: 0.0,
      changePercent: 0.0,
      period: 'Current',
      impact: 'neutral',
    },
  ];
}

async function getVolatilityData(period: string) {
  // Mock volatility data
  return {
    vix: {
      current: 18.5,
      change: -1.2,
      changePercent: -6.1,
      level: 'Low',
    },
    historical: [
      { date: '2024-01-01', vix: 20.1 },
      { date: '2024-01-02', vix: 19.8 },
      { date: '2024-01-03', vix: 18.9 },
      { date: '2024-01-04', vix: 18.5 },
    ],
    sectorVolatility: [
      { sector: 'Technology', volatility: 0.25 },
      { sector: 'Healthcare', volatility: 0.18 },
      { sector: 'Energy', volatility: 0.32 },
      { sector: 'Financials', volatility: 0.22 },
    ],
  };
}

async function getMarketSentiment() {
  // Mock sentiment data
  return {
    overall: {
      score: 0.65,
      label: 'Bullish',
      confidence: 0.78,
    },
    fearGreedIndex: {
      value: 65,
      label: 'Greed',
      description: 'Market showing signs of greed',
    },
    putCallRatio: {
      value: 0.85,
      label: 'Bullish',
      description: 'More calls than puts being traded',
    },
    insiderTrading: {
      buyRatio: 0.35,
      sellRatio: 0.65,
      sentiment: 'Bearish',
    },
  };
}

async function getMarketCalendar(startDate?: string, endDate?: string, type?: string) {
  // Mock calendar data
  const events = [
    {
      id: '1',
      type: 'earnings',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      event: 'Q4 2023 Earnings',
      date: '2024-02-01T16:00:00Z',
      impact: 'high',
    },
    {
      id: '2',
      type: 'earnings',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      event: 'Q4 2023 Earnings',
      date: '2024-02-02T16:00:00Z',
      impact: 'high',
    },
    {
      id: '3',
      type: 'dividends',
      symbol: 'JNJ',
      name: 'Johnson & Johnson',
      event: 'Dividend Payment',
      date: '2024-02-15T00:00:00Z',
      impact: 'low',
    },
    {
      id: '4',
      type: 'ipo',
      symbol: 'NEWCO',
      name: 'New Company Inc.',
      event: 'IPO Launch',
      date: '2024-02-20T00:00:00Z',
      impact: 'medium',
    },
  ];

  return type === 'all' ? events : events.filter(event => event.type === type);
}

export default router;
