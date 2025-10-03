"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const ws_1 = require("ws");
const logger_1 = require("@/utils/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class WebSocketService {
    static wss;
    static clients = new Map();
    static initialize(server) {
        this.wss = new ws_1.WebSocketServer({
            server,
            path: '/ws',
        });
        this.wss.on('connection', (ws, req) => {
            logger_1.logger.info('New WebSocket connection attempt');
            const token = this.extractTokenFromRequest(req);
            if (!token) {
                ws.close(1008, 'Authentication required');
                return;
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                ws.userId = decoded.id;
                ws.isAlive = true;
                this.clients.set(ws.userId, ws);
                logger_1.logger.info(`WebSocket client connected: ${ws.userId}`);
                ws.on('pong', () => {
                    ws.isAlive = true;
                });
                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleMessage(ws, message);
                    }
                    catch (error) {
                        logger_1.logger.error('Invalid WebSocket message:', error);
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Invalid message format',
                        }));
                    }
                });
                ws.on('close', () => {
                    if (ws.userId) {
                        this.clients.delete(ws.userId);
                        logger_1.logger.info(`WebSocket client disconnected: ${ws.userId}`);
                    }
                });
                ws.on('error', (error) => {
                    logger_1.logger.error('WebSocket error:', error);
                    if (ws.userId) {
                        this.clients.delete(ws.userId);
                    }
                });
                ws.send(JSON.stringify({
                    type: 'connected',
                    message: 'Connected to Stock Copilot WebSocket',
                    userId: ws.userId,
                }));
            }
            catch (error) {
                logger_1.logger.error('WebSocket authentication failed:', error);
                ws.close(1008, 'Authentication failed');
            }
        });
        this.startPingInterval();
        logger_1.logger.info('WebSocket service initialized');
    }
    static extractTokenFromRequest(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokenFromQuery = url.searchParams.get('token');
        if (tokenFromQuery) {
            return tokenFromQuery;
        }
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
    static handleMessage(ws, message) {
        switch (message.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
            case 'subscribe':
                this.handleSubscription(ws, message);
                break;
            case 'unsubscribe':
                this.handleUnsubscription(ws, message);
                break;
            default:
                logger_1.logger.warn('Unknown WebSocket message type:', message.type);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unknown message type',
                }));
        }
    }
    static handleSubscription(ws, message) {
        const { channel, symbol } = message;
        logger_1.logger.info(`Client ${ws.userId} subscribed to ${channel}:${symbol}`);
        ws.send(JSON.stringify({
            type: 'subscribed',
            channel,
            symbol,
        }));
    }
    static handleUnsubscription(ws, message) {
        const { channel, symbol } = message;
        logger_1.logger.info(`Client ${ws.userId} unsubscribed from ${channel}:${symbol}`);
        ws.send(JSON.stringify({
            type: 'unsubscribed',
            channel,
            symbol,
        }));
    }
    static startPingInterval() {
        setInterval(() => {
            this.clients.forEach((ws, userId) => {
                if (!ws.isAlive) {
                    logger_1.logger.info(`Terminating inactive WebSocket client: ${userId}`);
                    ws.terminate();
                    this.clients.delete(userId);
                    return;
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }
    static sendToUser(userId, message) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    static broadcast(message) {
        this.clients.forEach((ws) => {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
    static sendToMultipleUsers(userIds, message) {
        userIds.forEach(userId => {
            this.sendToUser(userId, message);
        });
    }
    static broadcastMarketUpdate(symbol, data) {
        this.broadcast({
            type: 'market_update',
            symbol,
            data,
            timestamp: new Date().toISOString(),
        });
    }
    static broadcastPredictionUpdate(symbol, data) {
        this.broadcast({
            type: 'prediction_update',
            symbol,
            data,
            timestamp: new Date().toISOString(),
        });
    }
    static broadcastPortfolioUpdate(userId, data) {
        this.sendToUser(userId, {
            type: 'portfolio_update',
            data,
            timestamp: new Date().toISOString(),
        });
    }
    static broadcastNotification(userId, notification) {
        this.sendToUser(userId, {
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString(),
        });
    }
    static getConnectedClients() {
        return this.clients.size;
    }
    static getClientUserIds() {
        return Array.from(this.clients.keys());
    }
    static isClientConnected(userId) {
        const ws = this.clients.get(userId);
        return ws ? ws.readyState === ws_1.WebSocket.OPEN : false;
    }
    static close() {
        if (this.wss) {
            this.wss.close();
            logger_1.logger.info('WebSocket service closed');
        }
    }
}
exports.WebSocketService = WebSocketService;
//# sourceMappingURL=websocket.js.map