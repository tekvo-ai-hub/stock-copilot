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
 * @route GET /api/v1/portfolio
 * @desc Get user's portfolios
 */
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const portfolios = await DatabaseService.getUserPortfolios(userId);

    // Calculate portfolio performance
    const portfoliosWithPerformance = await Promise.all(
      portfolios.map(async (portfolio) => {
        const performance = await calculatePortfolioPerformance(portfolio);
        return {
          ...portfolio,
          performance,
        };
      })
    );

    res.json({
      success: true,
      data: portfoliosWithPerformance,
    });
  } catch (error) {
    logger.error('Failed to get portfolios:', error);
    res.status(500).json({
      error: 'Failed to get portfolios',
    });
  }
});

/**
 * @route POST /api/v1/portfolio
 * @desc Create a new portfolio
 */
router.post('/', [
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('is_default').optional().isBoolean(),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { name, description, is_default } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await DatabaseService.getClient().portfolio.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }

    const portfolio = await DatabaseService.createPortfolio(userId, {
      name,
      description,
      is_default: is_default || false,
    });

    res.status(201).json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    logger.error('Failed to create portfolio:', error);
    res.status(500).json({
      error: 'Failed to create portfolio',
    });
  }
});

/**
 * @route GET /api/v1/portfolio/:id
 * @desc Get specific portfolio details
 */
router.get('/:id', [
  param('id').isString().isLength({ min: 1 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const portfolio = await DatabaseService.getClient().portfolio.findFirst({
      where: {
        id,
        user_id: userId,
      },
      include: {
        holdings: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found',
      });
    }

    // Calculate performance
    const performance = await calculatePortfolioPerformance(portfolio);

    res.json({
      success: true,
      data: {
        ...portfolio,
        performance,
      },
    });
  } catch (error) {
    logger.error('Failed to get portfolio:', error);
    res.status(500).json({
      error: 'Failed to get portfolio',
    });
  }
});

/**
 * @route PUT /api/v1/portfolio/:id
 * @desc Update portfolio
 */
router.put('/:id', [
  param('id').isString().isLength({ min: 1 }),
  body('name').optional().isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('is_default').optional().isBoolean(),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, description, is_default } = req.body;

    // Check if portfolio exists and belongs to user
    const existingPortfolio = await DatabaseService.getClient().portfolio.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!existingPortfolio) {
      return res.status(404).json({
        error: 'Portfolio not found',
      });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await DatabaseService.getClient().portfolio.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }

    // Update portfolio
    const updatedPortfolio = await DatabaseService.getClient().portfolio.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(is_default !== undefined && { is_default }),
      },
    });

    res.json({
      success: true,
      data: updatedPortfolio,
    });
  } catch (error) {
    logger.error('Failed to update portfolio:', error);
    res.status(500).json({
      error: 'Failed to update portfolio',
    });
  }
});

/**
 * @route DELETE /api/v1/portfolio/:id
 * @desc Delete portfolio
 */
router.delete('/:id', [
  param('id').isString().isLength({ min: 1 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Check if portfolio exists and belongs to user
    const portfolio = await DatabaseService.getClient().portfolio.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found',
      });
    }

    // Delete portfolio (cascade will delete holdings and transactions)
    await DatabaseService.getClient().portfolio.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete portfolio:', error);
    res.status(500).json({
      error: 'Failed to delete portfolio',
    });
  }
});

/**
 * @route POST /api/v1/portfolio/:id/holdings
 * @desc Add holding to portfolio
 */
router.post('/:id/holdings', [
  param('id').isString().isLength({ min: 1 }),
  body('symbol').isString().isLength({ min: 1, max: 10 }),
  body('shares').isFloat({ min: 0 }),
  body('avg_price').isFloat({ min: 0 }),
  body('current_price').optional().isFloat({ min: 0 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { symbol, shares, avg_price, current_price } = req.body;

    // Check if portfolio exists and belongs to user
    const portfolio = await DatabaseService.getClient().portfolio.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found',
      });
    }

    // Get current price if not provided
    let finalCurrentPrice = current_price;
    if (!finalCurrentPrice) {
      try {
        const stockData = await StockDataService.getStockData({
          symbol: symbol.toUpperCase(),
          timeframe: '1d',
          period: '1d',
        });
        finalCurrentPrice = stockData.data[stockData.data.length - 1]?.close;
      } catch (error) {
        logger.warn(`Failed to get current price for ${symbol}:`, error);
      }
    }

    // Add or update holding
    const holding = await DatabaseService.addHolding(id, {
      symbol: symbol.toUpperCase(),
      shares,
      avgPrice: avg_price,
      currentPrice: finalCurrentPrice,
    });

    res.status(201).json({
      success: true,
      data: holding,
    });
  } catch (error) {
    logger.error('Failed to add holding:', error);
    res.status(500).json({
      error: 'Failed to add holding',
    });
  }
});

/**
 * @route PUT /api/v1/portfolio/:id/holdings/:symbol
 * @desc Update holding in portfolio
 */
router.put('/:id/holdings/:symbol', [
  param('id').isString().isLength({ min: 1 }),
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  body('shares').optional().isFloat({ min: 0 }),
  body('avg_price').optional().isFloat({ min: 0 }),
  body('current_price').optional().isFloat({ min: 0 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id, symbol } = req.params;
    const { shares, avg_price, current_price } = req.body;

    // Check if portfolio exists and belongs to user
    const portfolio = await DatabaseService.getClient().portfolio.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found',
      });
    }

    // Get existing holding
    const existingHolding = await DatabaseService.getClient().portfolioHolding.findFirst({
      where: {
        portfolio_id: id,
        symbol: symbol.toUpperCase(),
      },
    });

    if (!existingHolding) {
      return res.status(404).json({
        error: 'Holding not found',
      });
    }

    // Update holding
    const updatedHolding = await DatabaseService.getClient().portfolioHolding.update({
      where: {
        portfolioId_symbol: {
          portfolioId: id,
          symbol: symbol.toUpperCase(),
        },
      },
      data: {
        ...(shares !== undefined && { shares }),
        ...(avg_price !== undefined && { avg_price }),
        ...(current_price !== undefined && { current_price }),
      },
    });

    res.json({
      success: true,
      data: updatedHolding,
    });
  } catch (error) {
    logger.error('Failed to update holding:', error);
    res.status(500).json({
      error: 'Failed to update holding',
    });
  }
});

/**
 * @route DELETE /api/v1/portfolio/:id/holdings/:symbol
 * @desc Remove holding from portfolio
 */
router.delete('/:id/holdings/:symbol', [
  param('id').isString().isLength({ min: 1 }),
  param('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id, symbol } = req.params;

    // Check if portfolio exists and belongs to user
    const portfolio = await DatabaseService.getClient().portfolio.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found',
      });
    }

    // Remove holding
    await DatabaseService.getClient().portfolioHolding.delete({
      where: {
        portfolioId_symbol: {
          portfolioId: id,
          symbol: symbol.toUpperCase(),
        },
      },
    });

    res.json({
      success: true,
      message: 'Holding removed successfully',
    });
  } catch (error) {
    logger.error('Failed to remove holding:', error);
    res.status(500).json({
      error: 'Failed to remove holding',
    });
  }
});

/**
 * @route POST /api/v1/portfolio/:id/transactions
 * @desc Add transaction to portfolio
 */
router.post('/:id/transactions', [
  param('id').isString().isLength({ min: 1 }),
  body('symbol').isString().isLength({ min: 1, max: 10 }),
  body('type').isIn(['BUY', 'SELL', 'DIVIDEND', 'SPLIT']),
  body('shares').isFloat({ min: 0 }),
  body('price').isFloat({ min: 0 }),
  body('fees').optional().isFloat({ min: 0 }).default(0),
  body('notes').optional().isString().isLength({ max: 500 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { symbol, type, shares, price, fees, notes } = req.body;

    // Check if portfolio exists and belongs to user
    const portfolio = await DatabaseService.getClient().portfolio.findFirst({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found',
      });
    }

    // Calculate total
    const total = shares * price + (fees || 0);

    // Create transaction
    const transaction = await DatabaseService.getClient().transaction.create({
      data: {
        portfolio_id: id,
        symbol: symbol.toUpperCase(),
        type: type as any,
        shares,
        price,
        fees: fees || 0,
        total,
        notes,
      },
    });

    // Update holding if it's a buy or sell
    if (type === 'BUY' || type === 'SELL') {
      const existingHolding = await DatabaseService.getClient().portfolioHolding.findFirst({
        where: {
          portfolio_id: id,
          symbol: symbol.toUpperCase(),
        },
      });

      if (existingHolding) {
        const newShares = type === 'BUY' 
          ? existingHolding.shares + shares
          : existingHolding.shares - shares;

        if (newShares <= 0) {
          // Remove holding if no shares left
          await DatabaseService.getClient().portfolioHolding.delete({
            where: {
              portfolioId_symbol: {
                portfolioId: id,
                symbol: symbol.toUpperCase(),
              },
            },
          });
        } else {
          // Update average price for buy transactions
          let newAvgPrice = existingHolding.avg_price;
          if (type === 'BUY') {
            const totalCost = (existingHolding.shares * existingHolding.avg_price) + (shares * price);
            newAvgPrice = totalCost / newShares;
          }

          await DatabaseService.getClient().portfolioHolding.update({
            where: {
              portfolioId_symbol: {
                portfolioId: id,
                symbol: symbol.toUpperCase(),
              },
            },
            data: {
              shares: newShares,
              avg_price: newAvgPrice,
            },
          });
        }
      } else if (type === 'BUY') {
        // Create new holding for buy transaction
        await DatabaseService.addHolding(id, {
          symbol: symbol.toUpperCase(),
          shares,
          avgPrice: price,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    logger.error('Failed to add transaction:', error);
    res.status(500).json({
      error: 'Failed to add transaction',
    });
  }
});

/**
 * @route GET /api/v1/portfolio/:id/performance
 * @desc Get portfolio performance metrics
 */
router.get('/:id/performance', [
  param('id').isString().isLength({ min: 1 }),
  query('period').optional().isIn(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { period } = req.query;

    // Get portfolio
    const portfolio = await DatabaseService.getClient().portfolio.findFirst({
      where: {
        id,
        user_id: userId,
      },
      include: {
        holdings: true,
        transactions: true,
      },
    });

    if (!portfolio) {
      return res.status(404).json({
        error: 'Portfolio not found',
      });
    }

    // Calculate performance
    const performance = await calculatePortfolioPerformance(portfolio, period as string);

    res.json({
      success: true,
      data: {
        portfolioId: id,
        period,
        performance,
      },
    });
  } catch (error) {
    logger.error('Failed to get portfolio performance:', error);
    res.status(500).json({
      error: 'Failed to get portfolio performance',
    });
  }
});

// Helper function to calculate portfolio performance
async function calculatePortfolioPerformance(portfolio: any, period: string = '1m') {
  const holdings = portfolio.holdings || [];
  
  if (holdings.length === 0) {
    return {
      totalValue: 0,
      totalCost: 0,
      totalGain: 0,
      totalGainPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      holdings: [],
    };
  }

  // Get current prices for all holdings
  const holdingsWithPrices = await Promise.all(
    holdings.map(async (holding: any) => {
      let currentPrice = holding.current_price;
      
      if (!currentPrice) {
        try {
          const stockData = await StockDataService.getStockData({
            symbol: holding.symbol,
            timeframe: '1d',
            period: '1d',
          });
          currentPrice = stockData.data[stockData.data.length - 1]?.close || holding.avg_price;
        } catch (error) {
          logger.warn(`Failed to get current price for ${holding.symbol}:`, error);
          currentPrice = holding.avg_price;
        }
      }

      const currentValue = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.avg_price;
      const gain = currentValue - costBasis;
      const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;

      return {
        ...holding,
        currentPrice,
        currentValue,
        costBasis,
        gain,
        gainPercent,
      };
    })
  );

  // Calculate totals
  const totalValue = holdingsWithPrices.reduce((sum, holding) => sum + holding.currentValue, 0);
  const totalCost = holdingsWithPrices.reduce((sum, holding) => sum + holding.costBasis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Mock day change calculation
  const dayChange = totalValue * 0.02; // Mock 2% change
  const dayChangePercent = 2.0;

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalGain: Math.round(totalGain * 100) / 100,
    totalGainPercent: Math.round(totalGainPercent * 100) / 100,
    dayChange: Math.round(dayChange * 100) / 100,
    dayChangePercent,
    holdings: holdingsWithPrices.map(holding => ({
      symbol: holding.symbol,
      shares: holding.shares,
      avgPrice: holding.avg_price,
      currentPrice: holding.currentPrice,
      currentValue: holding.currentValue,
      costBasis: holding.costBasis,
      gain: holding.gain,
      gainPercent: holding.gainPercent,
    })),
  };
}

export default router;
