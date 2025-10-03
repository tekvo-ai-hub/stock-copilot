-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE transaction_type AS ENUM ('BUY', 'SELL', 'DIVIDEND', 'SPLIT');
CREATE TYPE prediction_status AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');
CREATE TYPE message_role AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE notification_type AS ENUM ('PREDICTION_ALERT', 'PRICE_ALERT', 'PORTFOLIO_UPDATE', 'MARKET_UPDATE', 'SYSTEM_NOTIFICATION');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios table
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio holdings table
CREATE TABLE portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    shares DECIMAL(15,6) NOT NULL,
    avg_price DECIMAL(15,6) NOT NULL,
    current_price DECIMAL(15,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    type transaction_type NOT NULL,
    shares DECIMAL(15,6) NOT NULL,
    price DECIMAL(15,6) NOT NULL,
    fees DECIMAL(15,6) DEFAULT 0,
    total DECIMAL(15,6) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    model TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    current_price DECIMAL(15,6) NOT NULL,
    predicted_price DECIMAL(15,6) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    status prediction_status DEFAULT 'ACTIVE',
    actual_price DECIMAL(15,6),
    accuracy DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watchlists table
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock data table (for caching)
CREATE TABLE stock_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(15,6) NOT NULL,
    high DECIMAL(15,6) NOT NULL,
    low DECIMAL(15,6) NOT NULL,
    close DECIMAL(15,6) NOT NULL,
    volume BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, timestamp)
);

-- Market indices table
CREATE TABLE market_indices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(15,6) NOT NULL,
    change DECIMAL(15,6) NOT NULL,
    change_percent DECIMAL(8,4) NOT NULL,
    volume BIGINT NOT NULL,
    market_cap BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technical indicators table
CREATE TABLE technical_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    indicator TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    value DECIMAL(15,6) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, indicator, timeframe, timestamp)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolio_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);
CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX idx_transactions_symbol ON transactions(symbol);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_symbol ON predictions(symbol);
CREATE INDEX idx_predictions_status ON predictions(status);
CREATE INDEX idx_predictions_expires_at ON predictions(expires_at);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_is_active ON chat_sessions(is_active);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_watchlists_symbol ON watchlists(symbol);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_stock_data_symbol ON stock_data(symbol);
CREATE INDEX idx_stock_data_timestamp ON stock_data(timestamp);
CREATE INDEX idx_stock_data_symbol_timestamp ON stock_data(symbol, timestamp);
CREATE INDEX idx_market_indices_symbol ON market_indices(symbol);
CREATE INDEX idx_technical_indicators_symbol ON technical_indicators(symbol);
CREATE INDEX idx_technical_indicators_indicator ON technical_indicators(indicator);
CREATE INDEX idx_technical_indicators_timestamp ON technical_indicators(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_holdings_updated_at BEFORE UPDATE ON portfolio_holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_indices_updated_at BEFORE UPDATE ON market_indices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own portfolio holdings" ON portfolio_holdings FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM portfolios WHERE id = portfolio_id)
);
CREATE POLICY "Users can view own transactions" ON transactions FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM portfolios WHERE id = portfolio_id)
);
CREATE POLICY "Users can view own predictions" ON predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM chat_sessions WHERE id = session_id)
);
CREATE POLICY "Users can view own watchlists" ON watchlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Public read access for market data
CREATE POLICY "Anyone can view stock data" ON stock_data FOR SELECT USING (true);
CREATE POLICY "Anyone can view market indices" ON market_indices FOR SELECT USING (true);
CREATE POLICY "Anyone can view technical indicators" ON technical_indicators FOR SELECT USING (true);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_portfolio_value(user_uuid UUID, portfolio_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    total_value DECIMAL,
    total_cost DECIMAL,
    total_gain DECIMAL,
    total_gain_percent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ph.shares * COALESCE(ph.current_price, ph.avg_price)), 0) as total_value,
        COALESCE(SUM(ph.shares * ph.avg_price), 0) as total_cost,
        COALESCE(SUM(ph.shares * (COALESCE(ph.current_price, ph.avg_price) - ph.avg_price)), 0) as total_gain,
        CASE 
            WHEN SUM(ph.shares * ph.avg_price) > 0 
            THEN (SUM(ph.shares * (COALESCE(ph.current_price, ph.avg_price) - ph.avg_price)) / SUM(ph.shares * ph.avg_price)) * 100
            ELSE 0
        END as total_gain_percent
    FROM portfolio_holdings ph
    JOIN portfolios p ON ph.portfolio_id = p.id
    WHERE p.user_id = user_uuid
    AND (portfolio_uuid IS NULL OR p.id = portfolio_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get prediction accuracy
CREATE OR REPLACE FUNCTION get_prediction_accuracy(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_predictions BIGINT,
    completed_predictions BIGINT,
    average_accuracy DECIMAL,
    average_confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_predictions,
        COUNT(*) FILTER (WHERE status = 'COMPLETED' AND accuracy IS NOT NULL) as completed_predictions,
        AVG(accuracy) FILTER (WHERE status = 'COMPLETED' AND accuracy IS NOT NULL) as average_accuracy,
        AVG(confidence) as average_confidence
    FROM predictions
    WHERE user_id = user_uuid
    AND created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up expired predictions
CREATE OR REPLACE FUNCTION cleanup_expired_predictions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE predictions 
    SET status = 'EXPIRED'
    WHERE status = 'ACTIVE' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired predictions (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-predictions', '0 0 * * *', 'SELECT cleanup_expired_predictions();');

-- Insert some sample market indices
INSERT INTO market_indices (symbol, name, price, change, change_percent, volume, market_cap) VALUES
('^GSPC', 'S&P 500', 4567.89, 23.45, 0.52, 4500000000, 40000000000000),
('^DJI', 'Dow Jones Industrial Average', 34567.89, -123.45, -0.36, 3000000000, 10000000000000),
('^IXIC', 'NASDAQ Composite', 14234.56, 89.12, 0.63, 5000000000, 20000000000000),
('^RUT', 'Russell 2000', 1987.65, 12.34, 0.62, 2000000000, 3000000000000);
