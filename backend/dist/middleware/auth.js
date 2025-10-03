"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("@/utils/logger");
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
            });
        }
        const token = authHeader.substring(7);
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication failed:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
            });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
            });
        }
        return res.status(401).json({
            success: false,
            error: 'Authentication failed',
        });
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        if (!token) {
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
        };
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map