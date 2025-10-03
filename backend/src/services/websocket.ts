import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from '@/utils/logger';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WebSocketService {
  private static wss: WebSocketServer;
  private static clients: Map<string, AuthenticatedWebSocket> = new Map();

  public static initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
    });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      logger.info('New WebSocket connection attempt');

      // Handle authentication
      const token = this.extractTokenFromRequest(req);
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        ws.userId = decoded.id;
        ws.isAlive = true;

        // Store client
        this.clients.set(ws.userId, ws);

        logger.info(`WebSocket client connected: ${ws.userId}`);

        // Handle ping/pong for connection health
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        // Handle messages
        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(ws, message);
          } catch (error) {
            logger.error('Invalid WebSocket message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format',
            }));
          }
        });

        // Handle disconnect
        ws.on('close', () => {
          if (ws.userId) {
            this.clients.delete(ws.userId);
            logger.info(`WebSocket client disconnected: ${ws.userId}`);
          }
        });

        // Handle errors
        ws.on('error', (error) => {
          logger.error('WebSocket error:', error);
          if (ws.userId) {
            this.clients.delete(ws.userId);
          }
        });

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'Connected to Stock Copilot WebSocket',
          userId: ws.userId,
        }));

      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        ws.close(1008, 'Authentication failed');
      }
    });

    // Start ping interval to check connection health
    this.startPingInterval();

    logger.info('WebSocket service initialized');
  }

  private static extractTokenFromRequest(req: any): string | null {
    // Try to get token from query parameter
    const url = new URL(req.url, `http://${req.headers.host}`);
    const tokenFromQuery = url.searchParams.get('token');
    
    if (tokenFromQuery) {
      return tokenFromQuery;
    }

    // Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private static handleMessage(ws: AuthenticatedWebSocket, message: any) {
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
        logger.warn('Unknown WebSocket message type:', message.type);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type',
        }));
    }
  }

  private static handleSubscription(ws: AuthenticatedWebSocket, message: any) {
    const { channel, symbol } = message;
    
    // Store subscription info (in a real app, you'd use Redis or similar)
    logger.info(`Client ${ws.userId} subscribed to ${channel}:${symbol}`);
    
    ws.send(JSON.stringify({
      type: 'subscribed',
      channel,
      symbol,
    }));
  }

  private static handleUnsubscription(ws: AuthenticatedWebSocket, message: any) {
    const { channel, symbol } = message;
    
    logger.info(`Client ${ws.userId} unsubscribed from ${channel}:${symbol}`);
    
    ws.send(JSON.stringify({
      type: 'unsubscribed',
      channel,
      symbol,
    }));
  }

  private static startPingInterval() {
    setInterval(() => {
      this.clients.forEach((ws, userId) => {
        if (!ws.isAlive) {
          logger.info(`Terminating inactive WebSocket client: ${userId}`);
          ws.terminate();
          this.clients.delete(userId);
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Ping every 30 seconds
  }

  // Public methods for sending messages
  public static sendToUser(userId: string, message: any) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public static broadcast(message: any) {
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  public static sendToMultipleUsers(userIds: string[], message: any) {
    userIds.forEach(userId => {
      this.sendToUser(userId, message);
    });
  }

  // Market data broadcasting
  public static broadcastMarketUpdate(symbol: string, data: any) {
    this.broadcast({
      type: 'market_update',
      symbol,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public static broadcastPredictionUpdate(symbol: string, data: any) {
    this.broadcast({
      type: 'prediction_update',
      symbol,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public static broadcastPortfolioUpdate(userId: string, data: any) {
    this.sendToUser(userId, {
      type: 'portfolio_update',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  public static broadcastNotification(userId: string, notification: any) {
    this.sendToUser(userId, {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });
  }

  public static getConnectedClients(): number {
    return this.clients.size;
  }

  public static getClientUserIds(): string[] {
    return Array.from(this.clients.keys());
  }

  public static isClientConnected(userId: string): boolean {
    const ws = this.clients.get(userId);
    return ws ? ws.readyState === WebSocket.OPEN : false;
  }

  public static close() {
    if (this.wss) {
      this.wss.close();
      logger.info('WebSocket service closed');
    }
  }
}
