"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const ai_1 = require("@/services/ai");
const database_1 = require("@/services/database");
const websocket_1 = require("@/services/websocket");
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
router.post('/sessions', [
    (0, express_validator_1.body)('title').optional().isString().isLength({ min: 1, max: 100 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title = 'New Chat' } = req.body;
        const session = await database_1.DatabaseService.createChatSession(userId, title);
        res.status(201).json({
            success: true,
            data: session,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create chat session:', error);
        res.status(500).json({
            error: 'Failed to create chat session',
        });
    }
});
router.get('/sessions', async (req, res) => {
    try {
        const userId = req.user?.id;
        const sessions = await database_1.DatabaseService.getUserChatSessions(userId);
        res.json({
            success: true,
            data: sessions,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get chat sessions:', error);
        res.status(500).json({
            error: 'Failed to get chat sessions',
        });
    }
});
router.get('/sessions/:sessionId/messages', [
    (0, express_validator_1.param)('sessionId').isString().isLength({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], validateRequest, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const limit = req.query.limit || 50;
        const messages = await database_1.DatabaseService.getChatMessages(sessionId, limit);
        res.json({
            success: true,
            data: messages,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get chat messages:', error);
        res.status(500).json({
            error: 'Failed to get chat messages',
        });
    }
});
router.post('/sessions/:sessionId/messages', [
    (0, express_validator_1.param)('sessionId').isString().isLength({ min: 1 }),
    (0, express_validator_1.body)('message').isString().isLength({ min: 1, max: 2000 }),
    (0, express_validator_1.body)('context').optional().isObject(),
], validateRequest, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message, context } = req.body;
        const userId = req.user?.id;
        const chatHistory = await database_1.DatabaseService.getChatMessages(sessionId, 20);
        const formattedHistory = chatHistory.map(msg => ({
            role: msg.role.toLowerCase(),
            content: msg.content,
            timestamp: msg.createdAt.toISOString(),
        }));
        const aiResponse = await ai_1.AIService.handleChat({
            message,
            context: {
                symbol: context?.symbol,
                portfolio: context?.portfolio,
                recent_predictions: context?.recent_predictions,
            },
            chat_history: formattedHistory,
        });
        await database_1.DatabaseService.addChatMessage(sessionId, {
            role: 'USER',
            content: message,
            metadata: { context },
        });
        await database_1.DatabaseService.addChatMessage(sessionId, {
            role: 'ASSISTANT',
            content: aiResponse.response,
            metadata: {
                model: aiResponse.model,
                usage: aiResponse.usage,
            },
        });
        await database_1.DatabaseService.getClient().chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
        });
        websocket_1.WebSocketService.sendToUser(userId, 'chat_message', {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to send chat message:', error);
        res.status(500).json({
            error: 'Failed to send message',
        });
    }
});
router.post('/quick', [
    (0, express_validator_1.body)('message').isString().isLength({ min: 1, max: 2000 }),
    (0, express_validator_1.body)('context').optional().isObject(),
], validateRequest, async (req, res) => {
    try {
        const { message, context } = req.body;
        const userId = req.user?.id;
        const aiResponse = await ai_1.AIService.handleChat({
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
    }
    catch (error) {
        logger_1.logger.error('Failed to process quick chat:', error);
        res.status(500).json({
            error: 'Failed to process message',
        });
    }
});
router.delete('/sessions/:sessionId', [
    (0, express_validator_1.param)('sessionId').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;
        const session = await database_1.DatabaseService.getClient().chatSession.findFirst({
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
        await database_1.DatabaseService.getClient().chatSession.update({
            where: { id: sessionId },
            data: { isActive: false },
        });
        res.json({
            success: true,
            message: 'Chat session deleted',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete chat session:', error);
        res.status(500).json({
            error: 'Failed to delete chat session',
        });
    }
});
router.post('/sessions/:sessionId/rename', [
    (0, express_validator_1.param)('sessionId').isString().isLength({ min: 1 }),
    (0, express_validator_1.body)('title').isString().isLength({ min: 1, max: 100 }),
], validateRequest, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { title } = req.body;
        const userId = req.user?.id;
        const session = await database_1.DatabaseService.getClient().chatSession.findFirst({
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
        const updatedSession = await database_1.DatabaseService.getClient().chatSession.update({
            where: { id: sessionId },
            data: { title },
        });
        res.json({
            success: true,
            data: updatedSession,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to rename chat session:', error);
        res.status(500).json({
            error: 'Failed to rename chat session',
        });
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map