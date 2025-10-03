-- Create rule_config table for AI rule configuration
CREATE TABLE IF NOT EXISTS rule_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 1 CHECK (priority IN (1, 2, 3)), -- 1=High, 2=Medium, 3=Low
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  conditions JSONB NOT NULL, -- Rule conditions structure
  scoring_config JSONB, -- Scoring weights and thresholds
  actions JSONB, -- Actions to take when rule matches
  notification_config JSONB, -- Notification settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_executed_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false, -- Share with other users
  tags TEXT[] DEFAULT '{}', -- For categorization
  version INTEGER DEFAULT 1 -- For rule versioning
);

-- Create rule_results table to store rule execution results
CREATE TABLE IF NOT EXISTS rule_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES rule_config(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  score DECIMAL(10,2) NOT NULL,
  matched_conditions JSONB, -- Which conditions were matched
  execution_data JSONB, -- Additional execution context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rule_templates table for pre-built rule templates
CREATE TABLE IF NOT EXISTS rule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- value, growth, momentum, dividend, etc.
  conditions JSONB NOT NULL,
  scoring_config JSONB,
  actions JSONB,
  is_system BOOLEAN DEFAULT false, -- System templates vs user templates
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rule_config_user_id ON rule_config(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_config_status ON rule_config(status);
CREATE INDEX IF NOT EXISTS idx_rule_config_priority ON rule_config(priority);
CREATE INDEX IF NOT EXISTS idx_rule_config_created_at ON rule_config(created_at);
CREATE INDEX IF NOT EXISTS idx_rule_results_rule_id ON rule_results(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_results_user_id ON rule_results(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_results_symbol ON rule_results(symbol);
CREATE INDEX IF NOT EXISTS idx_rule_results_executed_at ON rule_results(executed_at);
CREATE INDEX IF NOT EXISTS idx_rule_templates_category ON rule_templates(category);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for rule_config
CREATE TRIGGER update_rule_config_updated_at 
    BEFORE UPDATE ON rule_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default rule templates
INSERT INTO rule_templates (name, description, category, conditions, scoring_config, actions, is_system) VALUES
(
  'Value Stock Picker',
  'Find undervalued stocks with strong fundamentals',
  'value',
  '{
    "operator": "AND",
    "conditions": [
      {
        "field": "pe_ratio",
        "operator": "less_than",
        "value": 15,
        "type": "fundamental"
      },
      {
        "field": "pb_ratio", 
        "operator": "less_than",
        "value": 2,
        "type": "fundamental"
      },
      {
        "field": "debt_to_equity",
        "operator": "less_than", 
        "value": 0.5,
        "type": "fundamental"
      },
      {
        "field": "roe",
        "operator": "greater_than",
        "value": 10,
        "type": "fundamental"
      }
    ]
  }',
  '{
    "base_score": 100,
    "condition_weights": {
      "pe_ratio": 25,
      "pb_ratio": 20,
      "debt_to_equity": 20,
      "roe": 35
    }
  }',
  '{
    "primary_action": "recommend",
    "secondary_actions": ["add_to_watchlist"],
    "notifications": ["dashboard", "email"]
  }',
  true
),
(
  'Momentum Trader',
  'Identify stocks with strong momentum signals',
  'momentum',
  '{
    "operator": "AND",
    "conditions": [
      {
        "field": "rsi",
        "operator": "greater_than",
        "value": 70,
        "type": "technical"
      },
      {
        "field": "price_vs_sma20",
        "operator": "greater_than",
        "value": 1.05,
        "type": "technical"
      },
      {
        "field": "volume_ratio",
        "operator": "greater_than",
        "value": 1.5,
        "type": "technical"
      },
      {
        "field": "price_change_1d",
        "operator": "greater_than",
        "value": 5,
        "type": "technical"
      }
    ]
  }',
  '{
    "base_score": 100,
    "condition_weights": {
      "rsi": 30,
      "price_vs_sma20": 25,
      "volume_ratio": 25,
      "price_change_1d": 20
    }
  }',
  '{
    "primary_action": "alert",
    "secondary_actions": ["recommend"],
    "notifications": ["push", "dashboard"]
  }',
  true
),
(
  'Dividend Investor',
  'Find high-quality dividend-paying stocks',
  'dividend',
  '{
    "operator": "AND",
    "conditions": [
      {
        "field": "dividend_yield",
        "operator": "greater_than",
        "value": 3,
        "type": "fundamental"
      },
      {
        "field": "payout_ratio",
        "operator": "less_than",
        "value": 60,
        "type": "fundamental"
      },
      {
        "field": "dividend_growth_5y",
        "operator": "greater_than",
        "value": 5,
        "type": "fundamental"
      },
      {
        "field": "market_cap",
        "operator": "greater_than",
        "value": 1000000000,
        "type": "market"
      }
    ]
  }',
  '{
    "base_score": 100,
    "condition_weights": {
      "dividend_yield": 30,
      "payout_ratio": 25,
      "dividend_growth_5y": 25,
      "market_cap": 20
    }
  }',
  '{
    "primary_action": "add_to_watchlist",
    "secondary_actions": ["recommend"],
    "notifications": ["email", "dashboard"]
  }',
  true
);

-- Enable Row Level Security
ALTER TABLE rule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (assuming we'll add auth later)
-- For now, allow all operations (we'll restrict when auth is added)
CREATE POLICY "Allow all operations on rule_config" ON rule_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on rule_results" ON rule_results FOR ALL USING (true);
CREATE POLICY "Allow all operations on rule_templates" ON rule_templates FOR ALL USING (true);
