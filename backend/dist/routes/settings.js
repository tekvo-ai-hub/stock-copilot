"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const logger_1 = require("@/utils/logger");
const router = express_1.default.Router();
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
        });
    }
    next();
};
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        const settings = await getUserSettings(userId);
        res.json({
            success: true,
            data: settings,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get settings:', error);
        res.status(500).json({
            error: 'Failed to get settings',
        });
    }
});
router.put('/', [
    (0, express_validator_1.body)('notifications').optional().isObject(),
    (0, express_validator_1.body)('preferences').optional().isObject(),
    (0, express_validator_1.body)('privacy').optional().isObject(),
    (0, express_validator_1.body)('trading').optional().isObject(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { notifications, preferences, privacy, trading } = req.body;
        const updatedSettings = await updateUserSettings(userId, {
            notifications,
            preferences,
            privacy,
            trading,
        });
        res.json({
            success: true,
            data: updatedSettings,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update settings:', error);
        res.status(500).json({
            error: 'Failed to update settings',
        });
    }
});
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user?.id;
        const notificationSettings = await getNotificationSettings(userId);
        res.json({
            success: true,
            data: notificationSettings,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get notification settings:', error);
        res.status(500).json({
            error: 'Failed to get notification settings',
        });
    }
});
router.put('/notifications', [
    (0, express_validator_1.body)('email').optional().isObject(),
    (0, express_validator_1.body)('push').optional().isObject(),
    (0, express_validator_1.body)('sms').optional().isObject(),
    (0, express_validator_1.body)('inApp').optional().isObject(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { email, push, sms, inApp } = req.body;
        const updatedSettings = await updateNotificationSettings(userId, {
            email,
            push,
            sms,
            inApp,
        });
        res.json({
            success: true,
            data: updatedSettings,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update notification settings:', error);
        res.status(500).json({
            error: 'Failed to update notification settings',
        });
    }
});
router.get('/preferences', async (req, res) => {
    try {
        const userId = req.user?.id;
        const preferences = await getUserPreferences(userId);
        res.json({
            success: true,
            data: preferences,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get preferences:', error);
        res.status(500).json({
            error: 'Failed to get preferences',
        });
    }
});
router.put('/preferences', [
    (0, express_validator_1.body)('theme').optional().isIn(['light', 'dark', 'auto']),
    (0, express_validator_1.body)('language').optional().isString().isLength({ min: 2, max: 5 }),
    (0, express_validator_1.body)('timezone').optional().isString(),
    (0, express_validator_1.body)('currency').optional().isString().isLength({ min: 3, max: 3 }),
    (0, express_validator_1.body)('dateFormat').optional().isString(),
    (0, express_validator_1.body)('numberFormat').optional().isString(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const preferences = req.body;
        const updatedPreferences = await updateUserPreferences(userId, preferences);
        res.json({
            success: true,
            data: updatedPreferences,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update preferences:', error);
        res.status(500).json({
            error: 'Failed to update preferences',
        });
    }
});
router.get('/privacy', async (req, res) => {
    try {
        const userId = req.user?.id;
        const privacySettings = await getPrivacySettings(userId);
        res.json({
            success: true,
            data: privacySettings,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get privacy settings:', error);
        res.status(500).json({
            error: 'Failed to get privacy settings',
        });
    }
});
router.put('/privacy', [
    (0, express_validator_1.body)('profileVisibility').optional().isIn(['public', 'private', 'friends']),
    (0, express_validator_1.body)('dataSharing').optional().isObject(),
    (0, express_validator_1.body)('analytics').optional().isBoolean(),
    (0, express_validator_1.body)('marketing').optional().isBoolean(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const privacySettings = req.body;
        const updatedSettings = await updatePrivacySettings(userId, privacySettings);
        res.json({
            success: true,
            data: updatedSettings,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update privacy settings:', error);
        res.status(500).json({
            error: 'Failed to update privacy settings',
        });
    }
});
router.get('/trading', async (req, res) => {
    try {
        const userId = req.user?.id;
        const tradingSettings = await getTradingSettings(userId);
        res.json({
            success: true,
            data: tradingSettings,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get trading settings:', error);
        res.status(500).json({
            error: 'Failed to get trading settings',
        });
    }
});
router.put('/trading', [
    (0, express_validator_1.body)('riskTolerance').optional().isIn(['low', 'medium', 'high']),
    (0, express_validator_1.body)('investmentGoal').optional().isIn(['growth', 'income', 'balanced', 'conservative']),
    (0, express_validator_1.body)('timeHorizon').optional().isIn(['short', 'medium', 'long']),
    (0, express_validator_1.body)('autoTrading').optional().isBoolean(),
    (0, express_validator_1.body)('stopLoss').optional().isObject(),
    (0, express_validator_1.body)('takeProfit').optional().isObject(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const tradingSettings = req.body;
        const updatedSettings = await updateTradingSettings(userId, tradingSettings);
        res.json({
            success: true,
            data: updatedSettings,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update trading settings:', error);
        res.status(500).json({
            error: 'Failed to update trading settings',
        });
    }
});
router.get('/api-keys', async (req, res) => {
    try {
        const userId = req.user?.id;
        const apiKeys = await getApiKeys(userId);
        res.json({
            success: true,
            data: apiKeys,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get API keys:', error);
        res.status(500).json({
            error: 'Failed to get API keys',
        });
    }
});
router.post('/api-keys', [
    (0, express_validator_1.body)('name').isString().isLength({ min: 1, max: 50 }),
    (0, express_validator_1.body)('permissions').optional().isArray(),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { name, permissions } = req.body;
        const apiKey = await generateApiKey(userId, name, permissions);
        res.status(201).json({
            success: true,
            data: apiKey,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate API key:', error);
        res.status(500).json({
            error: 'Failed to generate API key',
        });
    }
});
router.delete('/api-keys/:id', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        await revokeApiKey(userId, id);
        res.json({
            success: true,
            message: 'API key revoked successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to revoke API key:', error);
        res.status(500).json({
            error: 'Failed to revoke API key',
        });
    }
});
async function getUserSettings(userId) {
    return {
        notifications: {
            email: {
                predictions: true,
                portfolio: true,
                market: false,
                news: true,
            },
            push: {
                predictions: true,
                portfolio: true,
                market: false,
                news: false,
            },
            sms: {
                predictions: false,
                portfolio: false,
                market: false,
                news: false,
            },
            inApp: {
                predictions: true,
                portfolio: true,
                market: true,
                news: true,
            },
        },
        preferences: {
            theme: 'auto',
            language: 'en',
            timezone: 'UTC',
            currency: 'USD',
            dateFormat: 'MM/DD/YYYY',
            numberFormat: 'US',
        },
        privacy: {
            profileVisibility: 'private',
            dataSharing: {
                analytics: true,
                marketing: false,
                thirdParty: false,
            },
            analytics: true,
            marketing: false,
        },
        trading: {
            riskTolerance: 'medium',
            investmentGoal: 'balanced',
            timeHorizon: 'medium',
            autoTrading: false,
            stopLoss: {
                enabled: true,
                percentage: 10,
            },
            takeProfit: {
                enabled: true,
                percentage: 20,
            },
        },
    };
}
async function updateUserSettings(userId, settings) {
    return {
        ...settings,
        updatedAt: new Date().toISOString(),
    };
}
async function getNotificationSettings(userId) {
    return {
        email: {
            predictions: true,
            portfolio: true,
            market: false,
            news: true,
        },
        push: {
            predictions: true,
            portfolio: true,
            market: false,
            news: false,
        },
        sms: {
            predictions: false,
            portfolio: false,
            market: false,
            news: false,
        },
        inApp: {
            predictions: true,
            portfolio: true,
            market: true,
            news: true,
        },
    };
}
async function updateNotificationSettings(userId, settings) {
    return {
        ...settings,
        updatedAt: new Date().toISOString(),
    };
}
async function getUserPreferences(userId) {
    return {
        theme: 'auto',
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: 'US',
    };
}
async function updateUserPreferences(userId, preferences) {
    return {
        ...preferences,
        updatedAt: new Date().toISOString(),
    };
}
async function getPrivacySettings(userId) {
    return {
        profileVisibility: 'private',
        dataSharing: {
            analytics: true,
            marketing: false,
            thirdParty: false,
        },
        analytics: true,
        marketing: false,
    };
}
async function updatePrivacySettings(userId, settings) {
    return {
        ...settings,
        updatedAt: new Date().toISOString(),
    };
}
async function getTradingSettings(userId) {
    return {
        riskTolerance: 'medium',
        investmentGoal: 'balanced',
        timeHorizon: 'medium',
        autoTrading: false,
        stopLoss: {
            enabled: true,
            percentage: 10,
        },
        takeProfit: {
            enabled: true,
            percentage: 20,
        },
    };
}
async function updateTradingSettings(userId, settings) {
    return {
        ...settings,
        updatedAt: new Date().toISOString(),
    };
}
async function getApiKeys(userId) {
    return [
        {
            id: '1',
            name: 'Trading Bot',
            key: 'sk-****-****-****-****-****-****-****-****',
            permissions: ['read', 'write'],
            createdAt: '2024-01-01T00:00:00Z',
            lastUsed: '2024-01-15T10:30:00Z',
        },
        {
            id: '2',
            name: 'Mobile App',
            key: 'sk-****-****-****-****-****-****-****-****',
            permissions: ['read'],
            createdAt: '2024-01-10T00:00:00Z',
            lastUsed: '2024-01-15T09:15:00Z',
        },
    ];
}
async function generateApiKey(userId, name, permissions = ['read']) {
    const apiKey = `sk-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return {
        id: Math.random().toString(36).substring(2, 15),
        name,
        key: apiKey,
        permissions,
        createdAt: new Date().toISOString(),
    };
}
async function revokeApiKey(userId, keyId) {
    return true;
}
exports.default = router;
//# sourceMappingURL=settings.js.map