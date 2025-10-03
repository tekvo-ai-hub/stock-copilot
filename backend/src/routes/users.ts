import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '@/services/database';
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
 * @route GET /api/v1/users/profile
 * @desc Get user profile
 */
router.get('/profile', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const user = await DatabaseService.findUserById(userId);

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
  } catch (error) {
    logger.error('Failed to get user profile:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
    });
  }
});

/**
 * @route PUT /api/v1/users/profile
 * @desc Update user profile
 */
router.put('/profile', [
  body('username').optional().isString().isLength({ min: 3, max: 50 }),
  body('firstName').optional().isString().isLength({ max: 50 }),
  body('lastName').optional().isString().isLength({ max: 50 }),
  body('avatar').optional().isURL(),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { username, firstName, lastName, avatar } = req.body;

    // Check if username is already taken (if provided)
    if (username) {
      const existingUser = await DatabaseService.getClient().user.findFirst({
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

    // Update user profile
    const updatedUser = await DatabaseService.getClient().user.update({
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
  } catch (error) {
    logger.error('Failed to update user profile:', error);
    res.status(500).json({
      error: 'Failed to update user profile',
    });
  }
});

/**
 * @route GET /api/v1/users/stats
 * @desc Get user statistics
 */
router.get('/stats', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;

    // Get user statistics
    const portfolios = await DatabaseService.getUserPortfolios(userId);
    const predictions = await DatabaseService.getUserPredictions(userId);
    const watchlist = await DatabaseService.getUserWatchlist(userId);
    const chatSessions = await DatabaseService.getUserChatSessions(userId);

    // Calculate statistics
    const totalPortfolios = portfolios.length;
    const totalHoldings = portfolios.reduce((sum, portfolio) => sum + portfolio.holdings.length, 0);
    const totalValue = portfolios.reduce((sum, portfolio) => 
      sum + portfolio.holdings.reduce((holdingsSum, holding) => 
        holdingsSum + (holding.shares * (holding.currentPrice || holding.avgPrice)), 0
      ), 0
    );

    const activePredictions = predictions.filter(p => p.status === 'ACTIVE').length;
    const completedPredictions = predictions.filter(p => p.status === 'COMPLETED').length;
    const expiredPredictions = predictions.filter(p => p.status === 'EXPIRED').length;

    // Calculate average prediction accuracy
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
  } catch (error) {
    logger.error('Failed to get user stats:', error);
    res.status(500).json({
      error: 'Failed to get user statistics',
    });
  }
});

/**
 * @route GET /api/v1/users/activity
 * @desc Get user activity log
 */
router.get('/activity', [
  query('limit').optional().isInt({ min: 1, max: 100 }).default(20),
  query('offset').optional().isInt({ min: 0 }).default(0),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { limit, offset } = req.query;

    // Get recent activity (mock for now - would need to implement activity logging)
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
  } catch (error) {
    logger.error('Failed to get user activity:', error);
    res.status(500).json({
      error: 'Failed to get user activity',
    });
  }
});

/**
 * @route POST /api/v1/users/avatar
 * @desc Upload user avatar
 */
router.post('/avatar', [
  body('avatar_url').isURL(),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { avatar_url } = req.body;

    // Update user avatar
    const updatedUser = await DatabaseService.getClient().user.update({
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
  } catch (error) {
    logger.error('Failed to update avatar:', error);
    res.status(500).json({
      error: 'Failed to update avatar',
    });
  }
});

/**
 * @route DELETE /api/v1/users/account
 * @desc Delete user account
 */
router.delete('/account', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;

    // Delete user account (cascade will delete all related data)
    await DatabaseService.getClient().user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete account:', error);
    res.status(500).json({
      error: 'Failed to delete account',
    });
  }
});

/**
 * @route GET /api/v1/users/notifications
 * @desc Get user notifications
 */
router.get('/notifications', [
  query('limit').optional().isInt({ min: 1, max: 100 }).default(20),
  query('offset').optional().isInt({ min: 0 }).default(0),
  query('unread_only').optional().isBoolean().default(false),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { limit, offset, unread_only } = req.query;

    // Get notifications
    let notifications = await DatabaseService.getUserNotifications(userId, Number(limit));

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
  } catch (error) {
    logger.error('Failed to get notifications:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
    });
  }
});

/**
 * @route PUT /api/v1/users/notifications/:id/read
 * @desc Mark notification as read
 */
router.put('/notifications/:id/read', [
  param('id').isString().isLength({ min: 1 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Mark notification as read
    await DatabaseService.markNotificationAsRead(id);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    logger.error('Failed to mark notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
    });
  }
});

/**
 * @route PUT /api/v1/users/notifications/read-all
 * @desc Mark all notifications as read
 */
router.put('/notifications/read-all', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;

    // Mark all notifications as read
    await DatabaseService.getClient().notification.updateMany({
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
  } catch (error) {
    logger.error('Failed to mark all notifications as read:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
    });
  }
});

// Helper function to get recent activity
async function getRecentActivity(userId: string, limit: number, offset: number) {
  // Mock activity data - in a real implementation, you'd have an activity log table
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

export default router;
