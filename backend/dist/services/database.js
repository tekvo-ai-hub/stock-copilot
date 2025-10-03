"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("@/utils/logger");
class DatabaseService {
    static prisma;
    static isConnected = false;
    static async initialize() {
        try {
            this.prisma = new client_1.PrismaClient({
                log: [
                    { level: 'query', emit: 'event' },
                    { level: 'error', emit: 'event' },
                    { level: 'info', emit: 'event' },
                    { level: 'warn', emit: 'event' },
                ],
            });
            this.prisma.$on('query', (e) => {
                logger_1.logger.debug('Query: ' + e.query);
                logger_1.logger.debug('Params: ' + e.params);
                logger_1.logger.debug('Duration: ' + e.duration + 'ms');
            });
            this.prisma.$on('error', (e) => {
                logger_1.logger.error('Database error: ' + e.message);
            });
            await this.prisma.$connect();
            await this.prisma.$queryRaw `SELECT 1`;
            this.isConnected = true;
            logger_1.logger.info('✅ Database connected successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    static async disconnect() {
        try {
            if (this.prisma) {
                await this.prisma.$disconnect();
                this.isConnected = false;
                logger_1.logger.info('✅ Database disconnected');
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Database disconnection failed:', error);
        }
    }
    static getClient() {
        if (!this.isConnected || !this.prisma) {
            throw new Error('Database not connected');
        }
        return this.prisma;
    }
    static isHealthy() {
        return this.isConnected;
    }
    static async createUser(userData) {
        return this.prisma.user.create({
            data: userData,
        });
    }
    static async findUserByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    static async findUserById(id) {
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
    static async createPortfolio(userId, portfolioData) {
        return this.prisma.portfolio.create({
            data: {
                ...portfolioData,
                userId,
            },
        });
    }
    static async getUserPortfolios(userId) {
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
    static async addHolding(portfolioId, holdingData) {
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
    static async createPrediction(userId, predictionData) {
        return this.prisma.prediction.create({
            data: {
                ...predictionData,
                userId,
            },
        });
    }
    static async getUserPredictions(userId, status) {
        return this.prisma.prediction.findMany({
            where: {
                userId,
                ...(status && { status: status }),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async updatePrediction(id, updateData) {
        return this.prisma.prediction.update({
            where: { id },
            data: updateData,
        });
    }
    static async createChatSession(userId, title) {
        return this.prisma.chatSession.create({
            data: {
                userId,
                title,
            },
        });
    }
    static async getUserChatSessions(userId) {
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
    static async addChatMessage(sessionId, messageData) {
        return this.prisma.chatMessage.create({
            data: {
                ...messageData,
                sessionId,
            },
        });
    }
    static async getChatMessages(sessionId, limit = 50) {
        return this.prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }
    static async addToWatchlist(userId, symbol, name, notes) {
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
    static async removeFromWatchlist(userId, symbol) {
        return this.prisma.watchlist.delete({
            where: {
                userId_symbol: {
                    userId,
                    symbol,
                },
            },
        });
    }
    static async getUserWatchlist(userId) {
        return this.prisma.watchlist.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async createNotification(userId, notificationData) {
        return this.prisma.notification.create({
            data: {
                ...notificationData,
                userId,
            },
        });
    }
    static async getUserNotifications(userId, limit = 20) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    static async markNotificationAsRead(id) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
    static async storeStockData(symbol, data) {
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
    static async getStockData(symbol, startDate, endDate) {
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
    static async updateMarketIndex(symbol, data) {
        return this.prisma.marketIndex.upsert({
            where: { symbol },
            update: data,
            create: {
                symbol,
                ...data,
            },
        });
    }
    static async getMarketIndices() {
        return this.prisma.marketIndex.findMany({
            orderBy: { updatedAt: 'desc' },
        });
    }
    static async storeTechnicalIndicator(symbol, indicator, timeframe, value, metadata) {
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
    static async getTechnicalIndicators(symbol, indicator, timeframe, limit = 100) {
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
    static async getPredictionAccuracy(userId, days = 30) {
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
    static async getPortfolioPerformance(userId, portfolioId) {
        const whereClause = { userId };
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
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                },
            },
        });
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.js.map