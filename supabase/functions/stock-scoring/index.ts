import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 100 Popular Stocks List
const STOCK_LIST = [
  // Technology Giants
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'ADBE',
  'CRM', 'ORCL', 'INTC', 'AMD', 'CSCO', 'IBM', 'QCOM', 'AVGO', 'TXN', 'AMAT',
  
  // Financial Services
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SPGI', 'V', 'MA', 'PYPL',
  'COF', 'USB', 'PNC', 'TFC', 'BK', 'STT', 'SCHW', 'CB',
  
  // Healthcare & Biotech
  'JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'LLY',
  'AMGN', 'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'ZTS',
  
  // Consumer & Retail
  'WMT', 'HD', 'PG', 'KO', 'PEP', 'NKE', 'SBUX', 'MCD', 'DIS', 'CMCSA',
  'T', 'VZ', 'TMUS', 'CHTR', 'NFLX', 'ROKU', 'SPOT', 'UBER', 'LYFT', 'ABNB',
  
  // Industrial & Energy
  'BA', 'CAT', 'GE', 'HON', 'MMM', 'UPS', 'FDX', 'LMT', 'RTX', 'NOC',
  'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'OXY', 'MPC', 'VLO', 'PSX', 'KMI',
  
  // Other Sectors
  'BRK.B', 'JNJ', 'PG', 'KO', 'PEP', 'WMT', 'HD', 'MCD', 'NKE', 'SBUX',
  'DIS', 'CMCSA', 'T', 'VZ', 'TMUS', 'CHTR', 'ROKU', 'SPOT', 'UBER', 'LYFT'
]

interface StockData {
  symbol: string;
  current_price: number;
  change: number;
  change_percent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previous_close: number;
  timestamp: number;
}

interface ScoringData {
  symbol: string;
  score: number;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  momentum_score: number;
  volume_score: number;
  technical_score: number;
  news_score: number;
  analyst_score: number;
  sector: string;
  market_cap?: number;
  last_updated: string;
}

// Get sector for stock
function getSector(symbol: string): string {
  const techStocks = ['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'ADBE', 'CRM', 'ORCL', 'INTC', 'AMD', 'CSCO', 'IBM', 'QCOM', 'AVGO', 'TXN', 'AMAT'];
  const financeStocks = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SPGI', 'V', 'MA', 'PYPL', 'COF', 'USB', 'PNC', 'TFC', 'BK', 'STT', 'SCHW', 'CB'];
  const healthcareStocks = ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY', 'LLY', 'AMGN', 'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'ILMN', 'ISRG', 'ZTS'];
  const consumerStocks = ['WMT', 'HD', 'PG', 'KO', 'PEP', 'NKE', 'SBUX', 'MCD', 'DIS', 'CMCSA', 'T', 'VZ', 'TMUS', 'CHTR', 'ROKU', 'SPOT', 'UBER', 'LYFT', 'ABNB'];
  const industrialStocks = ['BA', 'CAT', 'GE', 'HON', 'MMM', 'UPS', 'FDX', 'LMT', 'RTX', 'NOC', 'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'OXY', 'MPC', 'VLO', 'PSX', 'KMI'];
  
  if (techStocks.includes(symbol)) return 'Technology';
  if (financeStocks.includes(symbol)) return 'Financial Services';
  if (healthcareStocks.includes(symbol)) return 'Healthcare';
  if (consumerStocks.includes(symbol)) return 'Consumer';
  if (industrialStocks.includes(symbol)) return 'Industrial';
  return 'Other';
}

// Calculate momentum score (0-100)
function calculateMomentumScore(changePercent: number, volume: number, avgVolume: number): number {
  const priceMomentum = Math.max(0, Math.min(100, 50 + (changePercent * 10))); // -5% to +5% maps to 0-100
  // Handle case where volume is 0 or very low
  const volumeMomentum = volume > 0 && avgVolume > 0 ? 
    (volume > avgVolume ? 100 : (volume / avgVolume) * 100) : 
    Math.max(20, priceMomentum * 0.5); // Fallback to price-based momentum
  return Math.round((priceMomentum * 0.7 + volumeMomentum * 0.3));
}

// Calculate volume score (0-100)
function calculateVolumeScore(volume: number, avgVolume: number): number {
  // Handle case where volume is 0 or very low
  if (volume === 0 || avgVolume === 0) {
    return 20; // Default low volume score
  }
  
  const ratio = volume / avgVolume;
  if (ratio > 2) return 100;
  if (ratio > 1.5) return 80;
  if (ratio > 1) return 60;
  if (ratio > 0.5) return 40;
  return 20;
}

// Calculate technical score (0-100) - simplified version
function calculateTechnicalScore(changePercent: number, high: number, low: number, current: number): number {
  // Handle case where high and low are the same or invalid
  if (high === low || high === 0 || low === 0) {
    // Fallback to momentum-based scoring
    return Math.max(0, Math.min(100, 50 + (changePercent * 20)));
  }
  
  const pricePosition = ((current - low) / (high - low)) * 100; // Position within day's range
  const momentum = Math.max(0, Math.min(100, 50 + (changePercent * 20)));
  return Math.round((pricePosition * 0.6 + momentum * 0.4));
}

// Calculate news score (0-100) - mock for now
function calculateNewsScore(symbol: string): number {
  // This would integrate with news sentiment analysis
  // For now, return random score between 40-90
  return Math.floor(Math.random() * 50) + 40;
}

// Calculate analyst score (0-100) - mock for now
function calculateAnalystScore(symbol: string): number {
  // This would integrate with analyst recommendations
  // For now, return random score between 50-95
  return Math.floor(Math.random() * 45) + 50;
}

// Fetch stock data from Finnhub
async function fetchStockData(symbol: string, apiKey: string): Promise<StockData | null> {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
    if (!response.ok) {
      console.error(`Failed to fetch data for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return {
      symbol,
      current_price: data.c || 0,
      change: data.d || 0,
      change_percent: data.dp || 0,
      volume: data.v || 0,
      high: data.h || 0,
      low: data.l || 0,
      open: data.o || 0,
      previous_close: data.pc || 0,
      timestamp: data.t || 0
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
}

// Calculate overall score
function calculateOverallScore(momentum: number, volume: number, technical: number, news: number, analyst: number): number {
  return Math.round(
    (momentum * 0.25) + 
    (volume * 0.20) + 
    (technical * 0.20) + 
    (news * 0.20) + 
    (analyst * 0.15)
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Get Finnhub API key from environment
    const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY')
    if (!finnhubApiKey) {
      return new Response(
        JSON.stringify({ error: 'Finnhub API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Route handling
    if (method === 'GET' && path.includes('/matrix')) {
      return await handleGetScoringMatrix(finnhubApiKey)
    } else if (method === 'GET' && path.includes('/stock/')) {
      const symbol = path.split('/stock/')[1]
      return await handleGetStockScore(symbol, finnhubApiKey)
    } else {
      return new Response(
        JSON.stringify({ error: 'Endpoint not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleGetScoringMatrix(apiKey: string) {
  try {
    console.log('Fetching scoring matrix for 100 stocks...')
    
    // Fetch data for all stocks (limit to first 20 for testing)
    const stocksToFetch = STOCK_LIST.slice(0, 20) // Start with 20 stocks for testing
    const stockDataPromises = stocksToFetch.map(symbol => fetchStockData(symbol, apiKey))
    const stockDataResults = await Promise.all(stockDataPromises)
    
    // Filter out null results
    const validStockData = stockDataResults.filter(data => data !== null) as StockData[]
    
    // Calculate average volume for normalization
    const totalVolume = validStockData.reduce((sum, stock) => sum + stock.volume, 0)
    const avgVolume = totalVolume > 0 ? totalVolume / validStockData.length : 1000000 // Default average volume
    
    // Calculate scores for each stock
    const scoringData: ScoringData[] = validStockData.map(stock => {
      const momentumScore = calculateMomentumScore(stock.change_percent, stock.volume, avgVolume)
      const volumeScore = calculateVolumeScore(stock.volume, avgVolume)
      const technicalScore = calculateTechnicalScore(stock.change_percent, stock.high, stock.low, stock.current_price)
      const newsScore = calculateNewsScore(stock.symbol)
      const analystScore = calculateAnalystScore(stock.symbol)
      const overallScore = calculateOverallScore(momentumScore, volumeScore, technicalScore, newsScore, analystScore)
      
      return {
        symbol: stock.symbol,
        score: overallScore,
        price: stock.current_price,
        change: stock.change,
        change_percent: stock.change_percent,
        volume: stock.volume,
        momentum_score: momentumScore,
        volume_score: volumeScore,
        technical_score: technicalScore,
        news_score: newsScore,
        analyst_score: analystScore,
        sector: getSector(stock.symbol),
        last_updated: new Date().toISOString()
      }
    })
    
    // Sort by score (highest first)
    scoringData.sort((a, b) => b.score - a.score)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: scoringData,
        total_stocks: scoringData.length,
        last_updated: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('Error fetching scoring matrix:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch scoring matrix' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleGetStockScore(symbol: string, apiKey: string) {
  try {
    const stockData = await fetchStockData(symbol, apiKey)
    if (!stockData) {
      return new Response(
        JSON.stringify({ error: 'Stock data not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Calculate scores for single stock
    const momentumScore = calculateMomentumScore(stockData.change_percent, stockData.volume, stockData.volume)
    const volumeScore = calculateVolumeScore(stockData.volume, stockData.volume)
    const technicalScore = calculateTechnicalScore(stockData.change_percent, stockData.high, stockData.low, stockData.current_price)
    const newsScore = calculateNewsScore(symbol)
    const analystScore = calculateAnalystScore(symbol)
    const overallScore = calculateOverallScore(momentumScore, volumeScore, technicalScore, newsScore, analystScore)
    
    const scoringData: ScoringData = {
      symbol: stockData.symbol,
      score: overallScore,
      price: stockData.current_price,
      change: stockData.change,
      change_percent: stockData.change_percent,
      volume: stockData.volume,
      momentum_score: momentumScore,
      volume_score: volumeScore,
      technical_score: technicalScore,
      news_score: newsScore,
      analyst_score: analystScore,
      sector: getSector(symbol),
      last_updated: new Date().toISOString()
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: scoringData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('Error fetching stock score:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch stock score' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}
