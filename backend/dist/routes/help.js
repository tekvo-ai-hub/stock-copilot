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
router.get('/faq', async (req, res) => {
    try {
        const faqData = await getFAQData();
        res.json({
            success: true,
            data: faqData,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get FAQ:', error);
        res.status(500).json({
            error: 'Failed to get FAQ data',
        });
    }
});
router.get('/guides', [
    (0, express_validator_1.query)('category').optional().isString(),
    (0, express_validator_1.query)('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
], validateRequest, async (req, res) => {
    try {
        const { category, level } = req.query;
        const guides = await getHelpGuides(category, level);
        res.json({
            success: true,
            data: guides,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get help guides:', error);
        res.status(500).json({
            error: 'Failed to get help guides',
        });
    }
});
router.get('/guides/:id', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const guide = await getHelpGuide(id);
        if (!guide) {
            return res.status(404).json({
                error: 'Guide not found',
            });
        }
        res.json({
            success: true,
            data: guide,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get help guide:', error);
        res.status(500).json({
            error: 'Failed to get help guide',
        });
    }
});
router.get('/contact', async (req, res) => {
    try {
        const contactInfo = await getContactInfo();
        res.json({
            success: true,
            data: contactInfo,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get contact info:', error);
        res.status(500).json({
            error: 'Failed to get contact information',
        });
    }
});
router.post('/support', [
    (0, express_validator_1.body)('subject').isString().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('message').isString().isLength({ min: 1, max: 2000 }),
    (0, express_validator_1.body)('category').isIn(['technical', 'billing', 'feature', 'bug', 'other']),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).default('medium'),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { subject, message, category, priority } = req.body;
        const ticket = await createSupportTicket(userId, {
            subject,
            message,
            category,
            priority,
        });
        res.status(201).json({
            success: true,
            data: ticket,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create support ticket:', error);
        res.status(500).json({
            error: 'Failed to create support ticket',
        });
    }
});
router.get('/support/tickets', [
    (0, express_validator_1.query)('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).default(20),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).default(0),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status, limit, offset } = req.query;
        const tickets = await getSupportTickets(userId, status, Number(limit), Number(offset));
        res.json({
            success: true,
            data: {
                tickets,
                pagination: {
                    limit: Number(limit),
                    offset: Number(offset),
                    hasMore: tickets.length === Number(limit),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get support tickets:', error);
        res.status(500).json({
            error: 'Failed to get support tickets',
        });
    }
});
router.get('/support/tickets/:id', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const ticket = await getSupportTicket(userId, id);
        if (!ticket) {
            return res.status(404).json({
                error: 'Support ticket not found',
            });
        }
        res.json({
            success: true,
            data: ticket,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get support ticket:', error);
        res.status(500).json({
            error: 'Failed to get support ticket',
        });
    }
});
router.post('/support/tickets/:id/reply', [
    (0, express_validator_1.param)('id').isString().isLength({ min: 1 }),
    (0, express_validator_1.body)('message').isString().isLength({ min: 1, max: 2000 }),
], validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { message } = req.body;
        const reply = await addSupportTicketReply(userId, id, message);
        res.status(201).json({
            success: true,
            data: reply,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to add support ticket reply:', error);
        res.status(500).json({
            error: 'Failed to add support ticket reply',
        });
    }
});
router.get('/status', async (req, res) => {
    try {
        const systemStatus = await getSystemStatus();
        res.json({
            success: true,
            data: systemStatus,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get system status:', error);
        res.status(500).json({
            error: 'Failed to get system status',
        });
    }
});
router.get('/changelog', [
    (0, express_validator_1.query)('version').optional().isString(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).default(10),
], validateRequest, async (req, res) => {
    try {
        const { version, limit } = req.query;
        const changelog = await getChangelog(version, Number(limit));
        res.json({
            success: true,
            data: changelog,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get changelog:', error);
        res.status(500).json({
            error: 'Failed to get changelog',
        });
    }
});
async function getFAQData() {
    return {
        categories: [
            {
                id: 'getting-started',
                name: 'Getting Started',
                questions: [
                    {
                        id: '1',
                        question: 'How do I create my first portfolio?',
                        answer: 'To create your first portfolio, go to the Portfolio section and click "Create New Portfolio". Give it a name and description, then start adding stocks to track your investments.',
                    },
                    {
                        id: '2',
                        question: 'How do I generate AI predictions?',
                        answer: 'Navigate to the Predictions section, select a stock symbol, choose your preferred AI model and timeframe, then click "Generate Prediction" to get AI-powered price forecasts.',
                    },
                ],
            },
            {
                id: 'predictions',
                name: 'AI Predictions',
                questions: [
                    {
                        id: '3',
                        question: 'What AI models are available?',
                        answer: 'We offer four AI models: LSTM (85% accuracy), Transformer (82% accuracy), Ensemble (88% accuracy), and Hybrid (90% accuracy). Each model uses different approaches to analyze market data.',
                    },
                    {
                        id: '4',
                        question: 'How accurate are the predictions?',
                        answer: 'Our AI models achieve 80-90% accuracy on average, with the Hybrid model performing best. Accuracy varies by market conditions and stock volatility.',
                    },
                ],
            },
            {
                id: 'portfolio',
                name: 'Portfolio Management',
                questions: [
                    {
                        id: '5',
                        question: 'Can I track multiple portfolios?',
                        answer: 'Yes, you can create and manage multiple portfolios to organize different investment strategies or goals.',
                    },
                    {
                        id: '6',
                        question: 'How do I add transactions?',
                        answer: 'In your portfolio, click "Add Transaction" and enter the stock symbol, transaction type (buy/sell), shares, and price. The system will automatically update your holdings.',
                    },
                ],
            },
        ],
    };
}
async function getHelpGuides(category, level) {
    const guides = [
        {
            id: '1',
            title: 'Getting Started with Stock Copilot',
            description: 'Learn the basics of using our AI-powered stock prediction platform',
            category: 'getting-started',
            level: 'beginner',
            duration: '10 minutes',
            tags: ['basics', 'tutorial', 'introduction'],
        },
        {
            id: '2',
            title: 'Understanding AI Predictions',
            description: 'Deep dive into how our AI models work and how to interpret predictions',
            category: 'predictions',
            level: 'intermediate',
            duration: '15 minutes',
            tags: ['ai', 'predictions', 'models'],
        },
        {
            id: '3',
            title: 'Advanced Portfolio Analysis',
            description: 'Master portfolio optimization and risk management techniques',
            category: 'portfolio',
            level: 'advanced',
            duration: '25 minutes',
            tags: ['portfolio', 'analysis', 'optimization'],
        },
        {
            id: '4',
            title: 'Technical Analysis Guide',
            description: 'Learn to use technical indicators and chart patterns for better trading decisions',
            category: 'analysis',
            level: 'intermediate',
            duration: '20 minutes',
            tags: ['technical', 'indicators', 'charts'],
        },
    ];
    let filteredGuides = guides;
    if (category) {
        filteredGuides = filteredGuides.filter(guide => guide.category === category);
    }
    if (level) {
        filteredGuides = filteredGuides.filter(guide => guide.level === level);
    }
    return filteredGuides;
}
async function getHelpGuide(id) {
    const guides = {
        '1': {
            id: '1',
            title: 'Getting Started with Stock Copilot',
            content: `
# Getting Started with Stock Copilot

Welcome to Stock Copilot, your AI-powered stock prediction and analysis platform!

## What is Stock Copilot?

Stock Copilot is a comprehensive platform that combines artificial intelligence with financial analysis to help you make better investment decisions.

## Key Features

### 1. AI Predictions
- Multiple AI models (LSTM, Transformer, Ensemble, Hybrid)
- Real-time price forecasting
- Confidence scoring and accuracy tracking

### 2. Portfolio Management
- Track multiple portfolios
- Real-time performance monitoring
- Transaction history and analytics

### 3. Technical Analysis
- 20+ technical indicators
- Chart pattern recognition
- Automated trading signals

### 4. Market Data
- Real-time market updates
- Sector performance analysis
- News and sentiment tracking

## Getting Started

1. **Create Your First Portfolio**
   - Go to the Portfolio section
   - Click "Create New Portfolio"
   - Add stocks to track

2. **Generate AI Predictions**
   - Navigate to Predictions
   - Select a stock symbol
   - Choose your AI model and timeframe
   - Get instant predictions

3. **Analyze Market Data**
   - Use the Market section for overview
   - Check sector performance
   - Monitor top movers

## Next Steps

- Explore the Analysis section for technical insights
- Set up your watchlist for favorite stocks
- Configure notifications for important updates
- Join our community for tips and strategies

Happy investing!
      `,
            category: 'getting-started',
            level: 'beginner',
            duration: '10 minutes',
            lastUpdated: '2024-01-15T00:00:00Z',
        },
    };
    return guides[id] || null;
}
async function getContactInfo() {
    return {
        support: {
            email: 'support@stockcopilot.com',
            phone: '+1 (555) 123-4567',
            hours: 'Monday - Friday, 9 AM - 6 PM EST',
        },
        sales: {
            email: 'sales@stockcopilot.com',
            phone: '+1 (555) 123-4568',
        },
        technical: {
            email: 'tech@stockcopilot.com',
        },
        address: {
            street: '123 Financial District',
            city: 'New York',
            state: 'NY',
            zip: '10004',
            country: 'United States',
        },
        social: {
            twitter: '@StockCopilot',
            linkedin: 'company/stock-copilot',
            discord: 'discord.gg/stockcopilot',
        },
    };
}
async function createSupportTicket(userId, ticketData) {
    return {
        id: Math.random().toString(36).substring(2, 15),
        subject: ticketData.subject,
        category: ticketData.category,
        priority: ticketData.priority,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
async function getSupportTickets(userId, status, limit = 20, offset = 0) {
    const tickets = [
        {
            id: '1',
            subject: 'Unable to generate predictions',
            category: 'technical',
            priority: 'high',
            status: 'open',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
        },
        {
            id: '2',
            subject: 'Portfolio sync issue',
            category: 'bug',
            priority: 'medium',
            status: 'in_progress',
            createdAt: '2024-01-14T14:20:00Z',
            updatedAt: '2024-01-15T09:15:00Z',
        },
    ];
    let filteredTickets = tickets;
    if (status) {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
    }
    return filteredTickets.slice(offset, offset + limit);
}
async function getSupportTicket(userId, ticketId) {
    return {
        id: ticketId,
        subject: 'Unable to generate predictions',
        message: 'I am unable to generate predictions for AAPL stock. The system shows an error message.',
        category: 'technical',
        priority: 'high',
        status: 'open',
        replies: [
            {
                id: '1',
                message: 'Thank you for contacting support. We are looking into this issue.',
                author: 'Support Team',
                createdAt: '2024-01-15T11:00:00Z',
            },
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
    };
}
async function addSupportTicketReply(userId, ticketId, message) {
    return {
        id: Math.random().toString(36).substring(2, 15),
        message,
        author: 'User',
        createdAt: new Date().toISOString(),
    };
}
async function getSystemStatus() {
    return {
        overall: 'operational',
        services: {
            api: 'operational',
            database: 'operational',
            predictions: 'operational',
            marketData: 'operational',
            chat: 'operational',
        },
        lastUpdated: new Date().toISOString(),
        incidents: [],
    };
}
async function getChangelog(version, limit = 10) {
    const changelog = [
        {
            version: '1.2.0',
            date: '2024-01-15',
            changes: [
                'Added new Hybrid AI model with 90% accuracy',
                'Improved portfolio performance analytics',
                'Enhanced real-time market data updates',
                'Fixed prediction accuracy calculation bug',
            ],
        },
        {
            version: '1.1.0',
            date: '2024-01-01',
            changes: [
                'Added technical analysis tools',
                'Implemented watchlist functionality',
                'Enhanced chat AI responses',
                'Improved mobile responsiveness',
            ],
        },
        {
            version: '1.0.0',
            date: '2023-12-15',
            changes: [
                'Initial release',
                'Basic AI predictions',
                'Portfolio management',
                'Market data integration',
            ],
        },
    ];
    let filteredChangelog = changelog;
    if (version) {
        filteredChangelog = filteredChangelog.filter(entry => entry.version === version);
    }
    return filteredChangelog.slice(0, limit);
}
exports.default = router;
//# sourceMappingURL=help.js.map