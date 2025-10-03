"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("@/middleware/errorHandler");
const requestLogger_1 = require("@/middleware/requestLogger");
const users_1 = __importDefault(require("@/routes/users"));
const stocks_1 = __importDefault(require("@/routes/stocks"));
const predictions_1 = __importDefault(require("@/routes/predictions"));
const portfolio_1 = __importDefault(require("@/routes/portfolio"));
const analysis_1 = __importDefault(require("@/routes/analysis"));
const market_1 = __importDefault(require("@/routes/market"));
const chat_1 = __importDefault(require("@/routes/chat"));
const dashboard_1 = __importDefault(require("@/routes/dashboard"));
const settings_1 = __importDefault(require("@/routes/settings"));
const help_1 = __importDefault(require("@/routes/help"));
const realtime_1 = __importDefault(require("@/routes/realtime"));
const database_1 = require("@/services/database");
const redis_1 = require("@/services/redis");
const realtimeData_1 = require("@/services/realtimeData");
const ai_1 = require("@/services/ai");
const stockData_1 = require("@/services/stockData");
dotenv_1.default.config();
class StockCopilotBackend {
    app;
    server;
    io;
    port;
    constructor() {
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env['PORT'] || '3001', 10);
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, {
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
    async initializeServices() {
        try {
            await database_1.DatabaseService.initialize();
            console.log('✅ Database connected');
            await redis_1.RedisService.initialize();
            console.log('✅ Redis connected');
            await ai_1.AIService.initialize();
            console.log('✅ AI service initialized');
            await stockData_1.StockDataService.initialize();
            await realtimeData_1.RealtimeDataService.initialize();
            console.log('✅ All services initialized');
        }
        catch (error) {
            console.error('❌ Service initialization failed:', error);
            process.exit(1);
        }
    }
    initializeMiddleware() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        this.app.use((0, cors_1.default)({
            origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));
        this.app.use((0, compression_1.default)());
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 1000,
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(requestLogger_1.requestLogger);
    }
    initializeRoutes() {
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env['npm_package_version'] || '1.0.0'
            });
        });
        this.app.use('/api/v1/users', users_1.default);
        this.app.use('/api/v1/stocks', stocks_1.default);
        this.app.use('/api/v1/predictions', predictions_1.default);
        this.app.use('/api/v1/portfolio', portfolio_1.default);
        this.app.use('/api/v1/analysis', analysis_1.default);
        this.app.use('/api/v1/market', market_1.default);
        this.app.use('/api/v1/chat', chat_1.default);
        this.app.use('/api/v1/dashboard', dashboard_1.default);
        this.app.use('/api/v1/settings', settings_1.default);
        this.app.use('/api/v1/help', help_1.default);
        this.app.use('/api/v1/realtime', realtime_1.default);
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                message: `Cannot ${req.method} ${req.originalUrl}`,
                timestamp: new Date().toISOString()
            });
        });
    }
    initializeWebSocket() {
        console.log('✅ WebSocket service initialized');
    }
    initializeErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
    }
    async start() {
        try {
            this.server.listen(this.port, () => {
                console.log(`🚀 Stock Copilot Backend running on port ${this.port}`);
                console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
                console.log(`🔗 Health check: http://localhost:${this.port}/health`);
            });
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    async stop() {
        try {
            await database_1.DatabaseService.disconnect();
            await redis_1.RedisService.disconnect();
            this.server.close();
            console.log('✅ Server stopped gracefully');
        }
        catch (error) {
            console.error('❌ Error stopping server:', error);
        }
    }
}
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
const backend = new StockCopilotBackend();
backend.start().catch(console.error);
exports.default = backend;
//# sourceMappingURL=index.js.map