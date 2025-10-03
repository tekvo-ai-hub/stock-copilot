import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the JWT token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { symbol, timeframe, model, confidence_threshold } = await req.json()

    // Validate input
    if (!symbol || !timeframe || !model) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get current stock price (mock for now)
    const currentPrice = await getCurrentStockPrice(symbol)
    
    // Generate AI prediction (mock for now - replace with actual AI service)
    const prediction = await generateAIPrediction({
      symbol,
      timeframe,
      model,
      currentPrice,
      confidence_threshold: confidence_threshold || 0.7
    })

    // Calculate expiration date based on timeframe
    const expiresAt = calculateExpirationDate(timeframe)

    // Save prediction to database
    const { data: predictionData, error: dbError } = await supabaseClient
      .from('predictions')
      .insert({
        user_id: user.id,
        symbol,
        model,
        timeframe,
        current_price: currentPrice,
        predicted_price: prediction.predicted_price,
        confidence: prediction.confidence,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to save prediction' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: predictionData,
        prediction: {
          ...prediction,
          symbol,
          timeframe,
          model,
          expires_at: expiresAt.toISOString(),
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

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

async function getCurrentStockPrice(symbol: string): Promise<number> {
  // Mock implementation - replace with actual stock data API
  const mockPrices: { [key: string]: number } = {
    'AAPL': 175.43,
    'MSFT': 378.85,
    'GOOGL': 142.56,
    'AMZN': 155.78,
    'TSLA': 248.12,
    'NVDA': 875.28,
  }
  
  return mockPrices[symbol] || 100.00
}

async function generateAIPrediction(params: {
  symbol: string
  timeframe: string
  model: string
  currentPrice: number
  confidence_threshold: number
}) {
  // Mock AI prediction - replace with actual AI service integration
  const { symbol, timeframe, model, currentPrice, confidence_threshold } = params
  
  // Simulate different model behaviors
  let volatility = 0.05
  let trend = 1
  
  switch (model) {
    case 'lstm':
      volatility = 0.03
      trend = 1.02
      break
    case 'transformer':
      volatility = 0.04
      trend = 1.015
      break
    case 'ensemble':
      volatility = 0.025
      trend = 1.025
      break
    case 'hybrid':
      volatility = 0.035
      trend = 1.02
      break
  }

  // Adjust based on timeframe
  const timeframeMultiplier = {
    '1d': 1,
    '1w': 1.1,
    '2w': 1.2,
    '1m': 1.3,
    '3m': 1.5,
  }[timeframe] || 1

  const baseChange = (trend - 1) * timeframeMultiplier
  const randomFactor = (Math.random() - 0.5) * volatility * timeframeMultiplier
  const predictedPrice = currentPrice * (1 + baseChange + randomFactor)
  
  // Calculate confidence based on model and volatility
  const confidence = Math.max(0.5, Math.min(0.95, confidence_threshold + (0.1 - volatility * 2)))
  
  const priceChange = predictedPrice - currentPrice
  const priceChangePercent = (priceChange / currentPrice) * 100

  return {
    predicted_price: Math.round(predictedPrice * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    price_change: Math.round(priceChange * 100) / 100,
    price_change_percent: Math.round(priceChangePercent * 100) / 100,
    factors: [
      'Technical indicators show bullish momentum',
      'Volume analysis indicates strong support',
      'Market sentiment is positive',
      'Historical patterns suggest upward trend'
    ],
    risk_level: volatility > 0.04 ? 'high' : volatility > 0.02 ? 'medium' : 'low',
    recommendation: priceChangePercent > 2 ? 'buy' : priceChangePercent < -2 ? 'sell' : 'hold',
    reasoning: `Based on ${model} model analysis, ${symbol} shows ${priceChangePercent > 0 ? 'positive' : 'negative'} momentum with ${Math.round(confidence * 100)}% confidence.`
  }
}

function calculateExpirationDate(timeframe: string): Date {
  const now = new Date()
  
  switch (timeframe) {
    case '1d':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case '1w':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case '2w':
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    case '1m':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    case '3m':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }
}
