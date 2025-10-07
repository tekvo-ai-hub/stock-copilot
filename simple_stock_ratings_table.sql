-- Simple version - Create stock_ratings table in Supabase
-- Run this SQL in your Supabase dashboard SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE rating_type AS ENUM ('BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL');

-- Stock ratings table
CREATE TABLE IF NOT EXISTS stock_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    rating rating_type NOT NULL,
    target_price DECIMAL(15,6),
    current_price DECIMAL(15,6),
    analyst TEXT,
    reasoning TEXT,
    confidence DECIMAL(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_ratings_symbol ON stock_ratings(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_ratings_rating ON stock_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_stock_ratings_created_at ON stock_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_ratings_analyst ON stock_ratings(analyst);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger
CREATE TRIGGER update_stock_ratings_updated_at 
    BEFORE UPDATE ON stock_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE stock_ratings ENABLE ROW LEVEL SECURITY;

-- Public read access for stock ratings
CREATE POLICY "Anyone can view stock ratings" ON stock_ratings FOR SELECT USING (true);

-- Insert some sample data for testing
INSERT INTO stock_ratings (symbol, rating, target_price, current_price, analyst, reasoning, confidence) VALUES
('AAPL', 'BUY', 185.00, 175.50, 'John Smith', 'Strong fundamentals and positive momentum', 0.85),
('MSFT', 'HOLD', 380.00, 375.25, 'Jane Doe', 'Stable performance, waiting for better entry point', 0.70),
('GOOGL', 'STRONG_BUY', 150.00, 142.30, 'Mike Johnson', 'AI growth potential and strong balance sheet', 0.92),
('TSLA', 'SELL', 200.00, 248.50, 'Sarah Wilson', 'Overvalued based on current metrics', 0.75),
('NVDA', 'BUY', 900.00, 875.20, 'David Chen', 'AI chip demand continues to grow', 0.88);

-- Verify the table was created successfully
SELECT 'Table created successfully!' as status;
SELECT COUNT(*) as total_ratings FROM stock_ratings;
