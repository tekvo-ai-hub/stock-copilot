"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateBody = exports.validateQuery = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(error => ({
                field: error.type === 'field' ? error.path : 'unknown',
                message: error.msg,
                value: error.type === 'field' ? error.value : undefined,
            })),
        });
    }
    next();
};
exports.validateRequest = validateRequest;
const validateQuery = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Query validation failed',
            details: errors.array(),
        });
    }
    next();
};
exports.validateQuery = validateQuery;
const validateBody = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Request body validation failed',
            details: errors.array(),
        });
    }
    next();
};
exports.validateBody = validateBody;
const validateParams = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'URL parameters validation failed',
            details: errors.array(),
        });
    }
    next();
};
exports.validateParams = validateParams;
//# sourceMappingURL=validation.js.map