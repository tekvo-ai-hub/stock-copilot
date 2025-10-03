"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("@/utils/logger");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    logger_1.logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - start;
        logger_1.logger.info('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            timestamp: new Date().toISOString(),
        });
        originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map