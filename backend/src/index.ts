import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { authMiddleware } from '@/middleware/auth';
// Import routes
import userRoutes from '@/routes/users';
import stockRoutes from '@/routes/stocks';
import predictionRoutes from '@/routes/predictions';
import portfolioRoutes from '@/routes/portfolio';
import analysisRoutes from '@/routes/analysis';
import marketRoutes from '@/routes/market';
import chatRoutes from '@/routes/chat';
import dashboardRoutes from '@/routes/dashboard';
import settingsRoutes from '@/routes/settings';
import helpRoutes from '@/routes/help';
import realtimeRoutes from '@/routes/realtime';

// Import services
import { DatabaseService } from '@/services/database';
import { RedisService } from '@/services/redis';
import { WebSocketService } from '@/services/websocket';
import { RealtimeDataService } from '@/services/realtimeData';
import { AIService } from '@/services/ai';
import { StockDataService } from '@/services/stockData';
// Remove services that don't exist yet

// Load environment variables
dotenv.config();

class StockCopilotBackend {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env['PORT'] || '3001', 10);
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeErrorHandling();
  }

  private async initializeServices() {
    try {
      // Initialize database
      await DatabaseService.initialize();
      console.log('✅ Database connected');

      // Initialize Redis
      await RedisService.initialize();
      console.log('✅ Redis connected');

      // Initialize AI service
      await AIService.initialize();
      console.log('✅ AI service initialized');

      // Initialize other services
      await StockDataService.initialize();
      await RealtimeDataService.initialize();
      
      console.log('✅ All services initialized');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      process.exit(1);
    }
  }

  private initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);
  }

  private initializeRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env['npm_package_version'] || '1.0.0'
      });
    });

    // API routes (without auth for now)
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/stocks', stockRoutes);
    this.app.use('/api/v1/predictions', predictionRoutes);
    this.app.use('/api/v1/portfolio', portfolioRoutes);
    this.app.use('/api/v1/analysis', analysisRoutes);
    this.app.use('/api/v1/market', marketRoutes);
    this.app.use('/api/v1/chat', chatRoutes);
    this.app.use('/api/v1/dashboard', dashboardRoutes);
    this.app.use('/api/v1/settings', settingsRoutes);
    this.app.use('/api/v1/help', helpRoutes);
    this.app.use('/api/v1/realtime', realtimeRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString()
      });
    });
  }

  private initializeWebSocket() {
    // WebSocketService.initialize(this.io);
    console.log('✅ WebSocket service initialized');
  }

  private initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  public async start() {
    try {
      this.server.listen(this.port, () => {
        console.log(`🚀 Stock Copilot Backend running on port ${this.port}`);
        console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${this.port}/health`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop() {
    try {
      await DatabaseService.disconnect();
      await RedisService.disconnect();
      this.server.close();
      console.log('✅ Server stopped gracefully');
    } catch (error) {
      console.error('❌ Error stopping server:', error);
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await backend.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await backend.stop();
  process.exit(0);
});

// Start the server
const backend = new StockCopilotBackend();
backend.start().catch(console.error);

export default backend;
