"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const database_1 = require("@/services/database");
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
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        const portfolios = await database_1.DatabaseService.getUserPortfolios(userId);
        const portfoliosWithPerformance = await Promise.all(portfolios.map(async (portfolio) => {
            const performance = await calculatePortfolioPerformance(portfolio);
            return {
                ...portfolio,
                performance,
            };
        }));
        res.json({
            success: true,
            data: portfoliosWithPerformance,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get portfolios:', error);
        res.status(500).json({
            error: 'Failed to get portfolios',
        });
    }
});
router.post('/', [
    (0, express_validator_1.body)('name').isString().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('description').optional().isString().isLength({ max: 500 }),
    (0, express_validator_1.body)('is_default').optional().isBoolean(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { name, description, is_default } = req.body;
        if (is_default) {
            await database_1.DatabaseService.getClient().portfolio.updateMany({
                where: { user_id: userId },
                data: { is_default: false },
            });
        }
        const portfolio = await database_1.DatabaseService.createPortfolio(userId, {
            name,
            description,
            is_default: is_default || false,
        });
        res.status(201).json({
            success: true,
            data: portfolio,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create portfolio:', error);
        res.status(500).json({
            error: 'Failed to create portfolio',
        });
    }
});
router.get('/:id', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const portfolio = await database_1.DatabaseService.getClient().portfolio.findFirst({
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
        const performance = await calculatePortfolioPerformance(portfolio);
        res.json({
            success: true,
            data: {
                ...portfolio,
                performance,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get portfolio:', error);
        res.status(500).json({
            error: 'Failed to get portfolio',
        });
    }
});
router.put('/:id', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
    (0, express_validator_1.body)('name').optional().isString().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('description').optional().isString().isLength({ max: 500 }),
    (0, express_validator_1.body)('is_default').optional().isBoolean(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, description, is_default } = req.body;
        const existingPortfolio = await database_1.DatabaseService.getClient().portfolio.findFirst({
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
        if (is_default) {
            await database_1.DatabaseService.getClient().portfolio.updateMany({
                where: { user_id: userId },
                data: { is_default: false },
            });
        }
        const updatedPortfolio = await database_1.DatabaseService.getClient().portfolio.update({
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
    }
    catch (error) {
        logger_1.logger.error('Failed to update portfolio:', error);
        res.status(500).json({
            error: 'Failed to update portfolio',
        });
    }
});
router.delete('/:id', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const portfolio = await database_1.DatabaseService.getClient().portfolio.findFirst({
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
        await database_1.DatabaseService.getClient().portfolio.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: 'Portfolio deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete portfolio:', error);
        res.status(500).json({
            error: 'Failed to delete portfolio',
        });
    }
});
router.post('/:id/holdings', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
    (0, express_validator_1.body)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.body)('shares').isFloat({ min: 0 }),
    (0, express_validator_1.body)('avg_price').isFloat({ min: 0 }),
    (0, express_validator_1.body)('current_price').optional().isFloat({ min: 0 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { symbol, shares, avg_price, current_price } = req.body;
        const portfolio = await database_1.DatabaseService.getClient().portfolio.findFirst({
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
        let finalCurrentPrice = current_price;
        if (!finalCurrentPrice) {
            try {
                const stockData = await stockData_1.StockDataService.getStockData({
                    symbol: symbol.toUpperCase(),
                    timeframe: '1d',
                    period: '1d',
                });
                finalCurrentPrice = stockData.data[stockData.data.length - 1]?.close;
            }
            catch (error) {
                logger_1.logger.warn(`Failed to get current price for ${symbol}:`, error);
            }
        }
        const holding = await database_1.DatabaseService.addHolding(id, {
            symbol: symbol.toUpperCase(),
            shares,
            avgPrice: avg_price,
            currentPrice: finalCurrentPrice,
        });
        res.status(201).json({
            success: true,
            data: holding,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to add holding:', error);
        res.status(500).json({
            error: 'Failed to add holding',
        });
    }
});
router.put('/:id/holdings/:symbol', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.body)('shares').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('avg_price').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('current_price').optional().isFloat({ min: 0 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id, symbol } = req.params;
        const { shares, avg_price, current_price } = req.body;
        const portfolio = await database_1.DatabaseService.getClient().portfolio.findFirst({
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
        const existingHolding = await database_1.DatabaseService.getClient().portfolioHolding.findFirst({
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
        const updatedHolding = await database_1.DatabaseService.getClient().portfolioHolding.update({
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
    }
    catch (error) {
        logger_1.logger.error('Failed to update holding:', error);
        res.status(500).json({
            error: 'Failed to update holding',
        });
    }
});
router.delete('/:id/holdings/:symbol', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
    (0, express_validator_1.param)('symbol').isString().isLength({ min: 1, max: 10 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id, symbol } = req.params;
        const portfolio = await database_1.DatabaseService.getClient().portfolio.findFirst({
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
        await database_1.DatabaseService.getClient().portfolioHolding.delete({
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
    }
    catch (error) {
        logger_1.logger.error('Failed to remove holding:', error);
        res.status(500).json({
            error: 'Failed to remove holding',
        });
    }
});
router.post('/:id/transactions', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
    (0, express_validator_1.body)('symbol').isString().isLength({ min: 1, max: 10 }),
    (0, express_validator_1.body)('type').isIn(['BUY', 'SELL', 'DIVIDEND', 'SPLIT']),
    (0, express_validator_1.body)('shares').isFloat({ min: 0 }),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }),
    (0, express_validator_1.body)('fees').optional().isFloat({ min: 0 }).default(0),
    (0, express_validator_1.body)('notes').optional().isString().isLength({ max: 500 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { symbol, type, shares, price, fees, notes } = req.body;
        const portfolio = await database_1.DatabaseService.getClient().portfolio.findFirst({
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
        const total = shares * price + (fees || 0);
        const transaction = await database_1.DatabaseService.getClient().transaction.create({
            data: {
                portfolio_id: id,
                symbol: symbol.toUpperCase(),
                type: type,
                shares,
                price,
                fees: fees || 0,
                total,
                notes,
            },
        });
        if (type === 'BUY' || type === 'SELL') {
            const existingHolding = await database_1.DatabaseService.getClient().portfolioHolding.findFirst({
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
                    await database_1.DatabaseService.getClient().portfolioHolding.delete({
                        where: {
                            portfolioId_symbol: {
                                portfolioId: id,
                                symbol: symbol.toUpperCase(),
                            },
                        },
                    });
                }
                else {
                    let newAvgPrice = existingHolding.avg_price;
                    if (type === 'BUY') {
                        const totalCost = (existingHolding.shares * existingHolding.avg_price) + (shares * price);
                        newAvgPrice = totalCost / newShares;
                    }
                    await database_1.DatabaseService.getClient().portfolioHolding.update({
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
            }
            else if (type === 'BUY') {
                await database_1.DatabaseService.addHolding(id, {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to add transaction:', error);
        res.status(500).json({
            error: 'Failed to add transaction',
        });
    }
});
router.get('/:id/performance', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
    (0, express_validator_1.query)('period').optional().isIn(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { period } = req.query;
        const portfolio = await database_1.DatabaseService.getClient().portfolio.findFirst({
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
        const performance = await calculatePortfolioPerformance(portfolio, period);
        res.json({
            success: true,
            data: {
                portfolioId: id,
                period,
                performance,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get portfolio performance:', error);
        res.status(500).json({
            error: 'Failed to get portfolio performance',
        });
    }
});
async function calculatePortfolioPerformance(portfolio, period = '1m') {
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
    const holdingsWithPrices = await Promise.all(holdings.map(async (holding) => {
        let currentPrice = holding.current_price;
        if (!currentPrice) {
            try {
                const stockData = await stockData_1.StockDataService.getStockData({
                    symbol: holding.symbol,
                    timeframe: '1d',
                    period: '1d',
                });
                currentPrice = stockData.data[stockData.data.length - 1]?.close || holding.avg_price;
            }
            catch (error) {
                logger_1.logger.warn(`Failed to get current price for ${holding.symbol}:`, error);
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
    }));
    const totalValue = holdingsWithPrices.reduce((sum, holding) => sum + holding.currentValue, 0);
    const totalCost = holdingsWithPrices.reduce((sum, holding) => sum + holding.costBasis, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const dayChange = totalValue * 0.02;
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
exports.default = router;
//# sourceMappingURL=portfolio.js.map