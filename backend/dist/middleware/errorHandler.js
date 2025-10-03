"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.createError = exports.errorHandler = void 0;
const logger_1 = require("@/utils/logger");
const errorHandler = (error, req, res, next) => {
    let { statusCode = 500, message } = error;
    logger_1.logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
    }
    if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
    }
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    if (error.name === 'MulterError') {
        statusCode = 400;
        message = 'File upload error';
    }
    if (process.env.NODE_ENV === 'production' && !error.isOperational) {
        message = 'Something went wrong';
    }
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map