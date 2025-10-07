-- Create stock ratings table
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, analyst, created_at::date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_ratings_symbol ON stock_ratings(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_ratings_rating ON stock_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_stock_ratings_created_at ON stock_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_ratings_analyst ON stock_ratings(analyst);

-- Add updated_at trigger
CREATE TRIGGER update_stock_ratings_updated_at 
    BEFORE UPDATE ON stock_ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE stock_ratings ENABLE ROW LEVEL SECURITY;

-- Public read access for stock ratings
CREATE POLICY "Anyone can view stock ratings" ON stock_ratings FOR SELECT USING (true);
