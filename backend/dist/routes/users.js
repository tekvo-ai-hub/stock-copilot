"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const database_1 = require("@/services/database");
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
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await database_1.DatabaseService.findUserById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
            });
        }
        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                avatar: user.avatar,
                isActive: user.is_active,
                createdAt: user.created_at,
                updatedAt: user.updated_at,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user profile:', error);
        res.status(500).json({
            error: 'Failed to get user profile',
        });
    }
});
router.put('/profile', [
    (0, express_validator_1.body)('username').optional().isString().isLength({ min: 3, max: 50 }),
    (0, express_validator_1.body)('firstName').optional().isString().isLength({ max: 50 }),
    (0, express_validator_1.body)('lastName').optional().isString().isLength({ max: 50 }),
    (0, express_validator_1.body)('avatar').optional().isURL(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { username, firstName, lastName, avatar } = req.body;
        if (username) {
            const existingUser = await database_1.DatabaseService.getClient().user.findFirst({
                where: {
                    username,
                    id: { not: userId },
                },
            });
            if (existingUser) {
                return res.status(400).json({
                    error: 'Username already taken',
                });
            }
        }
        const updatedUser = await database_1.DatabaseService.getClient().user.update({
            where: { id: userId },
            data: {
                ...(username && { username }),
                ...(firstName !== undefined && { first_name: firstName }),
                ...(lastName !== undefined && { last_name: lastName }),
                ...(avatar !== undefined && { avatar }),
            },
        });
        res.json({
            success: true,
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                username: updatedUser.username,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                avatar: updatedUser.avatar,
                isActive: updatedUser.is_active,
                createdAt: updatedUser.created_at,
                updatedAt: updatedUser.updated_at,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update user profile:', error);
        res.status(500).json({
            error: 'Failed to update user profile',
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user?.id;
        const portfolios = await database_1.DatabaseService.getUserPortfolios(userId);
        const predictions = await database_1.DatabaseService.getUserPredictions(userId);
        const watchlist = await database_1.DatabaseService.getUserWatchlist(userId);
        const chatSessions = await database_1.DatabaseService.getUserChatSessions(userId);
        const totalPortfolios = portfolios.length;
        const totalHoldings = portfolios.reduce((sum, portfolio) => sum + portfolio.holdings.length, 0);
        const totalValue = portfolios.reduce((sum, portfolio) => sum + portfolio.holdings.reduce((holdingsSum, holding) => holdingsSum + (holding.shares * (holding.currentPrice || holding.avgPrice)), 0), 0);
        const activePredictions = predictions.filter(p => p.status === 'ACTIVE').length;
        const completedPredictions = predictions.filter(p => p.status === 'COMPLETED').length;
        const expiredPredictions = predictions.filter(p => p.status === 'EXPIRED').length;
        const completedWithAccuracy = predictions.filter(p => p.status === 'COMPLETED' && p.accuracy !== null);
        const averageAccuracy = completedWithAccuracy.length > 0
            ? completedWithAccuracy.reduce((sum, p) => sum + (p.accuracy || 0), 0) / completedWithAccuracy.length
            : 0;
        const totalWatchlistItems = watchlist.length;
        const totalChatSessions = chatSessions.length;
        const activeChatSessions = chatSessions.filter(s => s.is_active).length;
        res.json({
            success: true,
            data: {
                portfolio: {
                    totalPortfolios,
                    totalHoldings,
                    totalValue: Math.round(totalValue * 100) / 100,
                },
                predictions: {
                    total: predictions.length,
                    active: activePredictions,
                    completed: completedPredictions,
                    expired: expiredPredictions,
                    averageAccuracy: Math.round(averageAccuracy * 100) / 100,
                },
                watchlist: {
                    totalItems: totalWatchlistItems,
                },
                chat: {
                    totalSessions: totalChatSessions,
                    activeSessions: activeChatSessions,
                },
                account: {
                    memberSince: portfolios.length > 0 ? portfolios[0].created_at : new Date().toISOString(),
                    lastActive: new Date().toISOString(),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user stats:', error);
        res.status(500).json({
            error: 'Failed to get user statistics',
        });
    }
});
router.get('/activity', [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).default(20),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).default(0),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { limit, offset } = req.query;
        const activities = await getRecentActivity(userId, Number(limit), Number(offset));
        res.json({
            success: true,
            data: {
                activities,
                pagination: {
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: activities.length === Number(limit),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user activity:', error);
        res.status(500).json({
            error: 'Failed to get user activity',
        });
    }
});
router.post('/avatar', [
    (0, express_validator_1.body)('avatar_url').isURL(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { avatar_url } = req.body;
        const updatedUser = await database_1.DatabaseService.getClient().user.update({
            where: { id: userId },
            data: { avatar: avatar_url },
        });
        res.json({
            success: true,
            data: {
                avatar: updatedUser.avatar,
                updatedAt: updatedUser.updated_at,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update avatar:', error);
        res.status(500).json({
            error: 'Failed to update avatar',
        });
    }
});
router.delete('/account', async (req, res) => {
    try {
        const userId = req.user?.id;
        await database_1.DatabaseService.getClient().user.delete({
            where: { id: userId },
        });
        res.json({
            success: true,
            message: 'Account deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete account:', error);
        res.status(500).json({
            error: 'Failed to delete account',
        });
    }
});
router.get('/notifications', [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).default(20),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).default(0),
    (0, express_validator_1.query)('unread_only').optional().isBoolean().default(false),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { limit, offset, unread_only } = req.query;
        let notifications = await database_1.DatabaseService.getUserNotifications(userId, Number(limit));
        if (unread_only === 'true') {
            notifications = notifications.filter(n => !n.is_read);
        }
        res.json({
            success: true,
            data: {
                notifications: notifications.map(notification => ({
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    data: notification.data,
                    isRead: notification.is_read,
                    createdAt: notification.created_at,
                })),
                pagination: {
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: notifications.length === Number(limit),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get notifications:', error);
        res.status(500).json({
            error: 'Failed to get notifications',
        });
    }
});
router.put('/notifications/:id/read', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        await database_1.DatabaseService.markNotificationAsRead(id);
        res.json({
            success: true,
            message: 'Notification marked as read',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to mark notification as read:', error);
        res.status(500).json({
            error: 'Failed to mark notification as read',
        });
    }
});
router.put('/notifications/read-all', async (req, res) => {
    try {
        const userId = req.user?.id;
        await database_1.DatabaseService.getClient().notification.updateMany({
            where: {
                user_id: userId,
                is_read: false,
            },
            data: {
                is_read: true,
            },
        });
        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to mark all notifications as read:', error);
        res.status(500).json({
            error: 'Failed to mark all notifications as read',
        });
    }
});
async function getRecentActivity(userId, limit, offset) {
    const activities = [
        {
            id: '1',
            type: 'prediction_created',
            description: 'Created new prediction for AAPL',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            metadata: { symbol: 'AAPL', model: 'LSTM' },
        },
        {
            id: '2',
            type: 'portfolio_updated',
            description: 'Added AAPL to portfolio',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            metadata: { symbol: 'AAPL', action: 'buy' },
        },
        {
            id: '3',
            type: 'chat_session',
            description: 'Started new chat session',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            metadata: { sessionId: 'chat_123' },
        },
        {
            id: '4',
            type: 'watchlist_added',
            description: 'Added TSLA to watchlist',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            metadata: { symbol: 'TSLA' },
        },
    ];
    return activities.slice(offset, offset + limit);
}
exports.default = router;
//# sourceMappingURL=users.js.map