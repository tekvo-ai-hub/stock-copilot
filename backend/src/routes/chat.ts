import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AIService } from '@/services/ai';
import { DatabaseService } from '@/services/database';
import { WebSocketService } from '@/services/websocket';
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
 * @route POST /api/v1/chat/sessions
 * @desc Create a new chat session
 */
router.post('/sessions', [
  body('title').optional().isString().isLength({ min: 1, max: 100 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { title = 'New Chat' } = req.body;

    const session = await DatabaseService.createChatSession(userId, title);

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    logger.error('Failed to create chat session:', error);
    res.status(500).json({
      error: 'Failed to create chat session',
    });
  }
});

/**
 * @route GET /api/v1/chat/sessions
 * @desc Get user's chat sessions
 */
router.get('/sessions', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const sessions = await DatabaseService.getUserChatSessions(userId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    logger.error('Failed to get chat sessions:', error);
    res.status(500).json({
      error: 'Failed to get chat sessions',
    });
  }
});

/**
 * @route GET /api/v1/chat/sessions/:sessionId/messages
 * @desc Get messages for a chat session
 */
router.get('/sessions/:sessionId/messages', [
  param('sessionId').isString().isLength({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = req.params;
    const limit = req.query.limit || 50;

    const messages = await DatabaseService.getChatMessages(sessionId, limit);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Failed to get chat messages:', error);
    res.status(500).json({
      error: 'Failed to get chat messages',
    });
  }
});

/**
 * @route POST /api/v1/chat/sessions/:sessionId/messages
 * @desc Send a message in a chat session
 */
router.post('/sessions/:sessionId/messages', [
  param('sessionId').isString().isLength({ min: 1 }),
  body('message').isString().isLength({ min: 1, max: 2000 }),
  body('context').optional().isObject(),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = req.params;
    const { message, context } = req.body;
    const userId = req.user?.id;

    // Get chat history for context
    const chatHistory = await DatabaseService.getChatMessages(sessionId, 20);
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
    }));

    // Generate AI response
    const aiResponse = await AIService.handleChat({
      message,
      context: {
        symbol: context?.symbol,
        portfolio: context?.portfolio,
        recent_predictions: context?.recent_predictions,
      },
      chat_history: formattedHistory,
    });

    // Store user message
    await DatabaseService.addChatMessage(sessionId, {
      role: 'USER',
      content: message,
      metadata: { context },
    });

    // Store AI response
    await DatabaseService.addChatMessage(sessionId, {
      role: 'ASSISTANT',
      content: aiResponse.response,
      metadata: {
        model: aiResponse.model,
        usage: aiResponse.usage,
      },
    });

    // Update session timestamp
    await DatabaseService.getClient().chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    // Send real-time update via WebSocket
    WebSocketService.sendToUser(userId, 'chat_message', {
      sessionId,
      message: aiResponse.response,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        message: aiResponse.response,
        usage: aiResponse.usage,
        model: aiResponse.model,
        timestamp: aiResponse.timestamp,
      },
    });
  } catch (error) {
    logger.error('Failed to send chat message:', error);
    res.status(500).json({
      error: 'Failed to send message',
    });
  }
});

/**
 * @route POST /api/v1/chat/quick
 * @desc Quick chat without session (for new chats)
 */
router.post('/quick', [
  body('message').isString().isLength({ min: 1, max: 2000 }),
  body('context').optional().isObject(),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { message, context } = req.body;
    const userId = req.user?.id;

    // Generate AI response
    const aiResponse = await AIService.handleChat({
      message,
      context: {
        symbol: context?.symbol,
        portfolio: context?.portfolio,
        recent_predictions: context?.recent_predictions,
      },
    });

    res.json({
      success: true,
      data: {
        message: aiResponse.response,
        usage: aiResponse.usage,
        model: aiResponse.model,
        timestamp: aiResponse.timestamp,
      },
    });
  } catch (error) {
    logger.error('Failed to process quick chat:', error);
    res.status(500).json({
      error: 'Failed to process message',
    });
  }
});

/**
 * @route DELETE /api/v1/chat/sessions/:sessionId
 * @desc Delete a chat session
 */
router.delete('/sessions/:sessionId', [
  param('sessionId').isString().isLength({ min: 1 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    // Verify session belongs to user
    const session = await DatabaseService.getClient().chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        error: 'Chat session not found',
      });
    }

    // Soft delete by setting isActive to false
    await DatabaseService.getClient().chatSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Chat session deleted',
    });
  } catch (error) {
    logger.error('Failed to delete chat session:', error);
    res.status(500).json({
      error: 'Failed to delete chat session',
    });
  }
});

/**
 * @route POST /api/v1/chat/sessions/:sessionId/rename
 * @desc Rename a chat session
 */
router.post('/sessions/:sessionId/rename', [
  param('sessionId').isString().isLength({ min: 1 }),
  body('title').isString().isLength({ min: 1, max: 100 }),
], validateRequest, async (req: express.Request, res: express.Response) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    const userId = req.user?.id;

    // Verify session belongs to user
    const session = await DatabaseService.getClient().chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return res.status(404).json({
        error: 'Chat session not found',
      });
    }

    // Update session title
    const updatedSession = await DatabaseService.getClient().chatSession.update({
      where: { id: sessionId },
      data: { title },
    });

    res.json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    logger.error('Failed to rename chat session:', error);
    res.status(500).json({
      error: 'Failed to rename chat session',
    });
  }
});

export default router;
