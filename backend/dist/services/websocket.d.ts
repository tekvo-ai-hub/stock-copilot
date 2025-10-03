import { Server } from 'http';
export declare class WebSocketService {
    private static wss;
    private static clients;
    static initialize(server: Server): void;
    private static extractTokenFromRequest;
    private static handleMessage;
    private static handleSubscription;
    private static handleUnsubscription;
    private static startPingInterval;
    static sendToUser(userId: string, message: any): void;
    static broadcast(message: any): void;
    static sendToMultipleUsers(userIds: string[], message: any): void;
    static broadcastMarketUpdate(symbol: string, data: any): void;
    static broadcastPredictionUpdate(symbol: string, data: any): void;
    static broadcastPortfolioUpdate(userId: string, data: any): void;
    static broadcastNotification(userId: string, notification: any): void;
    static getConnectedClients(): number;
    static getClientUserIds(): string[];
    static isClientConnected(userId: string): boolean;
    static close(): void;
}
//# sourceMappingURL=websocket.d.ts.map