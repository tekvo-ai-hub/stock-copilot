import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

export class DatabaseService {
  private static prisma: PrismaClient;
  private static isConnected = false;

  public static async initialize() {
    try {
      this.prisma = new PrismaClient({
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'info', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
      });

      // Set up logging
      this.prisma.$on('query', (e) => {
        logger.debug('Query: ' + e.query);
        logger.debug('Params: ' + e.params);
        logger.debug('Duration: ' + e.duration + 'ms');
      });

      this.prisma.$on('error', (e) => {
        logger.error('Database error: ' + e.message);
      });

      // Test connection
      await this.prisma.$connect();
      await this.prisma.$queryRaw`SELECT 1`;
      
      this.isConnected = true;
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public static async disconnect() {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect();
        this.isConnected = false;
        logger.info('✅ Database disconnected');
      }
    } catch (error) {
      logger.error('❌ Database disconnection failed:', error);
    }
  }

  public static getClient(): PrismaClient {
    if (!this.isConnected || !this.prisma) {
      throw new Error('Database not connected');
    }
    return this.prisma;
  }

  public static isHealthy(): boolean {
    return this.isConnected;
  }

  // User operations
  public static async createUser(userData: {
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }) {
    return this.prisma.user.create({
      data: userData,
    });
  }

  public static async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  public static async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        portfolios: true,
        predictions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        chatSessions: {
          where: { isActive: true },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
        watchlists: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Portfolio operations
  public static async createPortfolio(userId: string, portfolioData: {
    name: string;
    description?: string;
    isDefault?: boolean;
  }) {
    return this.prisma.portfolio.create({
      data: {
        ...portfolioData,
        userId,
      },
    });
  }

  public static async getUserPortfolios(userId: string) {
    return this.prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async addHolding(portfolioId: string, holdingData: {
    symbol: string;
    shares: number;
    avgPrice: number;
    currentPrice?: number;
  }) {
    return this.prisma.portfolioHolding.upsert({
      where: {
        portfolioId_symbol: {
          portfolioId,
          symbol: holdingData.symbol,
        },
      },
      update: {
        shares: holdingData.shares,
        avgPrice: holdingData.avgPrice,
        currentPrice: holdingData.currentPrice,
      },
      create: {
        portfolioId,
        ...holdingData,
      },
    });
  }

  // Prediction operations
  public static async createPrediction(userId: string, predictionData: {
    symbol: string;
    model: string;
    timeframe: string;
    currentPrice: number;
    predictedPrice: number;
    confidence: number;
    expiresAt: Date;
  }) {
    return this.prisma.prediction.create({
      data: {
        ...predictionData,
        userId,
      },
    });
  }

  public static async getUserPredictions(userId: string, status?: string) {
    return this.prisma.prediction.findMany({
      where: {
        userId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async updatePrediction(id: string, updateData: {
    actualPrice?: number;
    accuracy?: number;
    status?: string;
  }) {
    return this.prisma.prediction.update({
      where: { id },
      data: updateData,
    });
  }

  // Chat operations
  public static async createChatSession(userId: string, title: string) {
    return this.prisma.chatSession.create({
      data: {
        userId,
        title,
      },
    });
  }

  public static async getUserChatSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId, isActive: true },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  public static async addChatMessage(sessionId: string, messageData: {
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
    metadata?: any;
  }) {
    return this.prisma.chatMessage.create({
      data: {
        ...messageData,
        sessionId,
      },
    });
  }

  public static async getChatMessages(sessionId: string, limit = 50) {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  // Watchlist operations
  public static async addToWatchlist(userId: string, symbol: string, name?: string, notes?: string) {
    return this.prisma.watchlist.upsert({
      where: {
        userId_symbol: {
          userId,
          symbol,
        },
      },
      update: {
        name,
        notes,
      },
      create: {
        userId,
        symbol,
        name,
        notes,
      },
    });
  }

  public static async removeFromWatchlist(userId: string, symbol: string) {
    return this.prisma.watchlist.delete({
      where: {
        userId_symbol: {
          userId,
          symbol,
        },
      },
    });
  }

  public static async getUserWatchlist(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Notification operations
  public static async createNotification(userId: string, notificationData: {
    type: 'PREDICTION_ALERT' | 'PRICE_ALERT' | 'PORTFOLIO_UPDATE' | 'MARKET_UPDATE' | 'SYSTEM_NOTIFICATION';
    title: string;
    message: string;
    data?: any;
  }) {
    return this.prisma.notification.create({
      data: {
        ...notificationData,
        userId,
      },
    });
  }

  public static async getUserNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  public static async markNotificationAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // Stock data operations
  public static async storeStockData(symbol: string, data: {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }) {
    return this.prisma.stockData.upsert({
      where: {
        symbol_timestamp: {
          symbol,
          timestamp: data.timestamp,
        },
      },
      update: data,
      create: {
        symbol,
        ...data,
      },
    });
  }

  public static async getStockData(symbol: string, startDate: Date, endDate: Date) {
    return this.prisma.stockData.findMany({
      where: {
        symbol,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  // Market index operations
  public static async updateMarketIndex(symbol: string, data: {
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap?: number;
  }) {
    return this.prisma.marketIndex.upsert({
      where: { symbol },
      update: data,
      create: {
        symbol,
        ...data,
      },
    });
  }

  public static async getMarketIndices() {
    return this.prisma.marketIndex.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Technical indicator operations
  public static async storeTechnicalIndicator(symbol: string, indicator: string, timeframe: string, value: number, metadata?: any) {
    return this.prisma.technicalIndicator.create({
      data: {
        symbol,
        indicator,
        timeframe,
        value,
        metadata,
        timestamp: new Date(),
      },
    });
  }

  public static async getTechnicalIndicators(symbol: string, indicator: string, timeframe: string, limit = 100) {
    return this.prisma.technicalIndicator.findMany({
      where: {
        symbol,
        indicator,
        timeframe,
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  // Analytics and reporting
  public static async getPredictionAccuracy(userId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.prediction.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
        },
        accuracy: {
          not: null,
        },
      },
      select: {
        accuracy: true,
        confidence: true,
        model: true,
        symbol: true,
        createdAt: true,
      },
    });
  }

  public static async getPortfolioPerformance(userId: string, portfolioId?: string) {
    const whereClause: any = { userId };
    if (portfolioId) {
      whereClause.portfolioId = portfolioId;
    }

    return this.prisma.portfolio.findMany({
      where: whereClause,
      include: {
        holdings: true,
        transactions: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });
  }
}
