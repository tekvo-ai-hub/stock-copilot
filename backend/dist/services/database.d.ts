import { PrismaClient } from '@prisma/client';
export declare class DatabaseService {
    private static prisma;
    private static isConnected;
    static initialize(): Promise<void>;
    static disconnect(): Promise<void>;
    static getClient(): PrismaClient;
    static isHealthy(): boolean;
    static createUser(userData: {
        email: string;
        username: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
    }): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static findUserByEmail(email: string): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    static findUserById(id: string): Promise<({
        portfolios: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            userId: string;
            description: string | null;
            isDefault: boolean;
        }[];
        predictions: {
            symbol: string;
            model: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            timeframe: string;
            currentPrice: number;
            predictedPrice: number;
            confidence: number;
            status: import(".prisma/client").$Enums.PredictionStatus;
            actualPrice: number | null;
            accuracy: number | null;
            expiresAt: Date;
        }[];
        chatSessions: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
        }[];
        watchlists: {
            symbol: string;
            id: string;
            createdAt: Date;
            name: string | null;
            userId: string;
            notes: string | null;
        }[];
    } & {
        id: string;
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    static createPortfolio(userId: string, portfolioData: {
        name: string;
        description?: string;
        isDefault?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
        description: string | null;
        isDefault: boolean;
    }>;
    static getUserPortfolios(userId: string): Promise<({
        holdings: {
            symbol: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currentPrice: number | null;
            portfolioId: string;
            shares: number;
            avgPrice: number;
        }[];
        transactions: {
            symbol: string;
            id: string;
            createdAt: Date;
            notes: string | null;
            portfolioId: string;
            type: import(".prisma/client").$Enums.TransactionType;
            shares: number;
            price: number;
            fees: number;
            total: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
        description: string | null;
        isDefault: boolean;
    })[]>;
    static addHolding(portfolioId: string, holdingData: {
        symbol: string;
        shares: number;
        avgPrice: number;
        currentPrice?: number;
    }): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currentPrice: number | null;
        portfolioId: string;
        shares: number;
        avgPrice: number;
    }>;
    static createPrediction(userId: string, predictionData: {
        symbol: string;
        model: string;
        timeframe: string;
        currentPrice: number;
        predictedPrice: number;
        confidence: number;
        expiresAt: Date;
    }): Promise<{
        symbol: string;
        model: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        timeframe: string;
        currentPrice: number;
        predictedPrice: number;
        confidence: number;
        status: import(".prisma/client").$Enums.PredictionStatus;
        actualPrice: number | null;
        accuracy: number | null;
        expiresAt: Date;
    }>;
    static getUserPredictions(userId: string, status?: string): Promise<{
        symbol: string;
        model: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        timeframe: string;
        currentPrice: number;
        predictedPrice: number;
        confidence: number;
        status: import(".prisma/client").$Enums.PredictionStatus;
        actualPrice: number | null;
        accuracy: number | null;
        expiresAt: Date;
    }[]>;
    static updatePrediction(id: string, updateData: {
        actualPrice?: number;
        accuracy?: number;
        status?: string;
    }): Promise<{
        symbol: string;
        model: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        timeframe: string;
        currentPrice: number;
        predictedPrice: number;
        confidence: number;
        status: import(".prisma/client").$Enums.PredictionStatus;
        actualPrice: number | null;
        accuracy: number | null;
        expiresAt: Date;
    }>;
    static createChatSession(userId: string, title: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
    }>;
    static getUserChatSessions(userId: string): Promise<({
        messages: {
            id: string;
            createdAt: Date;
            sessionId: string;
            role: import(".prisma/client").$Enums.MessageRole;
            content: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
    })[]>;
    static addChatMessage(sessionId: string, messageData: {
        role: 'USER' | 'ASSISTANT' | 'SYSTEM';
        content: string;
        metadata?: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        sessionId: string;
        role: import(".prisma/client").$Enums.MessageRole;
        content: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    static getChatMessages(sessionId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        sessionId: string;
        role: import(".prisma/client").$Enums.MessageRole;
        content: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    static addToWatchlist(userId: string, symbol: string, name?: string, notes?: string): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        name: string | null;
        userId: string;
        notes: string | null;
    }>;
    static removeFromWatchlist(userId: string, symbol: string): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        name: string | null;
        userId: string;
        notes: string | null;
    }>;
    static getUserWatchlist(userId: string): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        name: string | null;
        userId: string;
        notes: string | null;
    }[]>;
    static createNotification(userId: string, notificationData: {
        type: 'PREDICTION_ALERT' | 'PRICE_ALERT' | 'PORTFOLIO_UPDATE' | 'MARKET_UPDATE' | 'SYSTEM_NOTIFICATION';
        title: string;
        message: string;
        data?: any;
    }): Promise<{
        message: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        isRead: boolean;
    }>;
    static getUserNotifications(userId: string, limit?: number): Promise<{
        message: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        isRead: boolean;
    }[]>;
    static markNotificationAsRead(id: string): Promise<{
        message: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        isRead: boolean;
    }>;
    static storeStockData(symbol: string, data: {
        timestamp: Date;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }): Promise<{
        symbol: string;
        timestamp: Date;
        close: number;
        id: string;
        createdAt: Date;
        open: number;
        high: number;
        low: number;
        volume: bigint;
    }>;
    static getStockData(symbol: string, startDate: Date, endDate: Date): Promise<{
        symbol: string;
        timestamp: Date;
        close: number;
        id: string;
        createdAt: Date;
        open: number;
        high: number;
        low: number;
        volume: bigint;
    }[]>;
    static updateMarketIndex(symbol: string, data: {
        name: string;
        price: number;
        change: number;
        changePercent: number;
        volume: number;
        marketCap?: number;
    }): Promise<{
        symbol: string;
        id: string;
        updatedAt: Date;
        name: string;
        price: number;
        volume: bigint;
        change: number;
        changePercent: number;
        marketCap: bigint | null;
    }>;
    static getMarketIndices(): Promise<{
        symbol: string;
        id: string;
        updatedAt: Date;
        name: string;
        price: number;
        volume: bigint;
        change: number;
        changePercent: number;
        marketCap: bigint | null;
    }[]>;
    static storeTechnicalIndicator(symbol: string, indicator: string, timeframe: string, value: number, metadata?: any): Promise<{
        symbol: string;
        timestamp: Date;
        id: string;
        timeframe: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        indicator: string;
        value: number;
    }>;
    static getTechnicalIndicators(symbol: string, indicator: string, timeframe: string, limit?: number): Promise<{
        symbol: string;
        timestamp: Date;
        id: string;
        timeframe: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        indicator: string;
        value: number;
    }[]>;
    static getPredictionAccuracy(userId: string, days?: number): Promise<{
        symbol: string;
        model: string;
        createdAt: Date;
        confidence: number;
        accuracy: number | null;
    }[]>;
    static getPortfolioPerformance(userId: string, portfolioId?: string): Promise<({
        holdings: {
            symbol: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currentPrice: number | null;
            portfolioId: string;
            shares: number;
            avgPrice: number;
        }[];
        transactions: {
            symbol: string;
            id: string;
            createdAt: Date;
            notes: string | null;
            portfolioId: string;
            type: import(".prisma/client").$Enums.TransactionType;
            shares: number;
            price: number;
            fees: number;
            total: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        userId: string;
        description: string | null;
        isDefault: boolean;
    })[]>;
}
//# sourceMappingURL=database.d.ts.map