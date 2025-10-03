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
 * @route GET /api/v1/stocks/search
 * @desc Search for stocks
 */
router.get('/search', [
  query('q').isString().isLength({ min: 1, max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).default(10),
  query('type').optional().isIn(['symbol', 'name', 'both']).default('both'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { q, limit, type } = req.query;

    // Search stocks using StockDataService
    const searchResults = await StockDataService.searchStocks({
      query: q as string,
      limit: Number(limit),
    });

    // Filter results based on type
    let filteredResults = searchResults;
    if (type === 'symbol') {
      filteredResults = searchResults.filter(stock => 
        stock.symbol.toLowerCase().includes((q as string).toLowerCase())
      );
    } else if (type === 'name') {
      filteredResults = searchResults.filter(stock => 
        stock.name.toLowerCase().includes((q as string).toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        query: q,
        results: filteredResults.slice(0, Number(limit)),
        total: filteredResults.length,
      },
    });
  } catch (error) {
    logger.error('Stock search failed:', error);
    res.status(500).json({
      error: 'Failed to search stocks',
    });
  }
});

/**
 * @route GET /api/v1/stocks/:symbol
 * @desc Get stock details
 */
router.get('/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('timeframe').optional().isIn(['1m', '5m', '15m', '1h', '1d', '1w', '1M']).default('1d'),
  query('period').optional().isIn(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']).default('1mo'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const { timeframe, period } = req.query;

    // Get stock data
    const stockData = await StockDataService.getStockData({
      symbol: symbol.toUpperCase(),
      timeframe: timeframe as string,
      period: period as string,
    });

    // Get technical indicators
    const indicators = await StockDataService.getTechnicalIndicators({
      symbol: symbol.toUpperCase(),
      indicators: ['RSI', 'MACD', 'SMA', 'EMA', 'BB'],
      timeframe: '1m',
    });

    // Get company information (mock for now)
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
  } catch (error) {
    logger.error('Failed to get stock details:', error);
    res.status(500).json({
      error: 'Failed to get stock details',
    });
  }
});

/**
 * @route GET /api/v1/stocks/:symbol/quote
 * @desc Get real-time stock quote
 */
router.get('/:symbol/quote', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;

    // Get current stock data
    const stockData = await StockDataService.getStockData({
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
  } catch (error) {
    logger.error('Failed to get stock quote:', error);
    res.status(500).json({
      error: 'Failed to get stock quote',
    });
  }
});

/**
 * @route GET /api/v1/stocks/:symbol/history
 * @desc Get historical stock data
 */
router.get('/:symbol/history', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('interval').optional().isIn(['1m', '5m', '15m', '1h', '1d', '1w', '1M']).default('1d'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const { start_date, end_date, interval } = req.query;

    // Calculate period based on date range
    let period = '1mo';
    if (start_date && end_date) {
      const start = new Date(start_date as string);
      const end = new Date(end_date as string);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 5) period = '5d';
      else if (daysDiff <= 30) period = '1mo';
      else if (daysDiff <= 90) period = '3mo';
      else if (daysDiff <= 365) period = '1y';
      else period = 'max';
    }

    // Get historical data
    const stockData = await StockDataService.getStockData({
      symbol: symbol.toUpperCase(),
      timeframe: interval as string,
      period,
    });

    // Filter by date range if provided
    let filteredData = stockData.data;
    if (start_date && end_date) {
      const start = new Date(start_date as string);
      const end = new Date(end_date as string);
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
  } catch (error) {
    logger.error('Failed to get historical data:', error);
    res.status(500).json({
      error: 'Failed to get historical data',
    });
  }
});

/**
 * @route GET /api/v1/stocks/:symbol/indicators
 * @desc Get technical indicators for a stock
 */
router.get('/:symbol/indicators', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('indicators').optional().isString(),
  query('timeframe').optional().isIn(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;
    const { indicators, timeframe } = req.query;

    // Parse indicators from query string
    const indicatorList = indicators 
      ? (indicators as string).split(',').map(i => i.trim().toUpperCase())
      : ['RSI', 'MACD', 'SMA', 'EMA', 'BB', 'STOCH', 'ADX', 'CCI', 'WILLR', 'MOM'];

    // Get technical indicators
    const technicalIndicators = await StockDataService.getTechnicalIndicators({
      symbol: symbol.toUpperCase(),
      indicators: indicatorList,
      timeframe: timeframe as string,
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
  } catch (error) {
    logger.error('Failed to get technical indicators:', error);
    res.status(500).json({
      error: 'Failed to get technical indicators',
    });
  }
});

/**
 * @route GET /api/v1/stocks/:symbol/company
 * @desc Get company information
 */
router.get('/:symbol/company', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;

    // Get company information
    const companyInfo = await getCompanyInfo(symbol.toUpperCase());

    res.json({
      success: true,
      data: companyInfo,
    });
  } catch (error) {
    logger.error('Failed to get company info:', error);
    res.status(500).json({
      error: 'Failed to get company information',
    });
  }
});

/**
 * @route GET /api/v1/stocks/:symbol/peers
 * @desc Get peer companies
 */
router.get('/:symbol/peers', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;

    // Get peer companies (mock for now)
    const peers = await getPeerCompanies(symbol.toUpperCase());

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        peers,
      },
    });
  } catch (error) {
    logger.error('Failed to get peer companies:', error);
    res.status(500).json({
      error: 'Failed to get peer companies',
    });
  }
});

/**
 * @route GET /api/v1/stocks/:symbol/analysts
 * @desc Get analyst recommendations
 */
router.get('/:symbol/analysts', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;

    // Get analyst recommendations (mock for now)
    const analystData = await getAnalystRecommendations(symbol.toUpperCase());

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        recommendations: analystData,
      },
    });
  } catch (error) {
    logger.error('Failed to get analyst recommendations:', error);
    res.status(500).json({
      error: 'Failed to get analyst recommendations',
    });
  }
});

/**
 * @route GET /api/v1/stocks/:symbol/insights
 * @desc Get stock insights and analysis
 */
router.get('/:symbol/insights', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { symbol } = req.params;

    // Get stock insights (mock for now)
    const insights = await getStockInsights(symbol.toUpperCase());

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        insights,
      },
    });
  } catch (error) {
    logger.error('Failed to get stock insights:', error);
    res.status(500).json({
      error: 'Failed to get stock insights',
    });
  }
});

// Helper functions
async function getCompanyInfo(symbol: string) {
  // Mock company information - replace with real API calls
  const mockCompanies: { [key: string]: any } = {
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

async function getPeerCompanies(symbol: string) {
  // Mock peer companies data
  const peerGroups: { [key: string]: any[] } = {
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

async function getAnalystRecommendations(symbol: string) {
  // Mock analyst recommendations
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

async function getStockInsights(symbol: string) {
  // Mock stock insights
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

export default router;
