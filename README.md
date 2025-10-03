# Stock Copilot - AI-Powered Stock Prediction Platform

A comprehensive, AI-powered stock prediction and analysis platform built with Next.js 15, TypeScript, Supabase, and advanced machine learning models. This application provides professional-grade tools for financial analysis, AI predictions, portfolio management, and real-time market data.

## Features

### 🏠 Dashboard
- Real-time market overview with key metrics
- Interactive stock charts using Recharts
- Portfolio performance tracking
- Market movers and sector performance

### 🔍 Stock Search
- Advanced stock search and filtering
- Real-time stock data and metrics
- Sortable stock listings
- Watchlist management

### 🤖 AI Predictions
- Generate AI-powered stock predictions
- Multiple prediction timeframes (1 day to 3 months)
- Confidence scoring and accuracy tracking
- Historical prediction performance analytics

### 📊 Technical Analysis
- Comprehensive technical indicators (RSI, MACD, SMA, EMA, Bollinger Bands)
- Chart pattern recognition
- Trading signals and recommendations
- Support and resistance levels

### 💼 Portfolio Management
- Track holdings and performance
- Asset allocation visualization
- Watchlist management
- Buy/sell transaction tracking

### 📈 Market Data
- Real-time market indices (S&P 500, Dow Jones, NASDAQ)
- Top gainers, losers, and most active stocks
- Sector performance analysis
- Global market overview

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks + Context

### **Backend & Database**
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Real-time**: WebSocket subscriptions for live data
- **Authentication**: JWT-based user authentication
- **Edge Functions**: Serverless AI processing
- **Row Level Security**: Secure data access

### **AI & ML Services**
- **TogetherAI**: Primary AI model provider
- **OpenAI**: Backup AI services
- **Custom Models**: LSTM, Transformer, Ensemble, Hybrid
- **Technical Indicators**: RSI, MACD, Bollinger Bands, etc.

### **External APIs**
- **Alpha Vantage**: Stock market data
- **Yahoo Finance**: Real-time quotes
- **IEX Cloud**: Financial data services

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Supabase account
- AI API keys (optional)

### **Installation**

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/stock-copilot.git
cd stock-copilot
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. **Set up Supabase backend:**
   - Create a new Supabase project
   - Run the database schema from `supabase/schema.sql`
   - Configure authentication settings
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions

5. **Run the development server:**
```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000) in your browser**

### **Environment Variables**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (Optional)
TOGETHER_AI_API_KEY=your_together_ai_key
OPENAI_API_KEY=your_openai_key

# Stock Data APIs (Optional)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
IEX_CLOUD_API_KEY=your_iex_cloud_key
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── analysis/          # Technical analysis page
│   ├── market/            # Market overview page
│   ├── portfolio/         # Portfolio management page
│   ├── predictions/       # AI predictions page
│   ├── search/            # Stock search page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard.tsx     # Main dashboard
│   ├── header.tsx        # Top navigation
│   ├── sidebar.tsx       # Side navigation
│   └── ...               # Other components
└── lib/                  # Utility functions
    └── utils.ts          # Common utilities
```

## Key Components

### Dashboard
- **StockChart**: Interactive price charts with Recharts
- **PredictionCard**: AI prediction display with confidence metrics
- **MarketOverview**: Market indices and sector performance

### Navigation
- **Sidebar**: Collapsible navigation with routing
- **Header**: Search bar, market status, and top movers

### Pages
- **StockSearch**: Advanced stock search with filtering
- **PredictionsPage**: AI prediction generation and tracking
- **AnalysisPage**: Technical analysis tools and indicators
- **PortfolioPage**: Portfolio management and performance
- **MarketPage**: Market data and movers

## Features in Detail

### AI Predictions
- Multiple AI models (LSTM, Transformer, Ensemble, Hybrid)
- Confidence scoring (0-100%)
- Historical accuracy tracking
- Performance analytics

### Technical Analysis
- 20+ technical indicators
- Chart pattern recognition
- Trading signal generation
- Risk management tools

### Portfolio Management
- Real-time portfolio valuation
- Performance tracking
- Asset allocation visualization
- Transaction history

## Customization

### Theming
The app uses CSS variables for theming. Customize colors in `src/app/globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... other variables */
}
```

### Adding New Components
Use shadcn/ui CLI to add new components:

```bash
npx shadcn@latest add [component-name]
```

## Data Integration

Currently, the app uses mock data for demonstration. To integrate with real data:

1. **Stock Data APIs**: Integrate with APIs like Alpha Vantage, Yahoo Finance, or IEX Cloud
2. **AI Models**: Connect to your ML models for predictions
3. **Portfolio Data**: Integrate with brokerage APIs or databases

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.

---

Built with ❤️ for finance professionals who need powerful, intuitive tools for stock analysis and prediction.



move settgins and hlep tto the bottom of the UI