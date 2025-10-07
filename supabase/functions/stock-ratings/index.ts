import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StockRating {
  id?: string;
  symbol: string;
  rating: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';
  target_price?: number;
  current_price?: number;
  analyst: string;
  reasoning?: string;
  confidence?: number;
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

    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname

    // Route handling
    if (method === 'GET' && path.includes('/ratings')) {
      return await handleGetRatings(supabaseClient, url)
    } else if (method === 'POST' && path.includes('/ratings')) {
      return await handleCreateRating(supabaseClient, req)
    } else if (method === 'PUT' && path.includes('/ratings/')) {
      return await handleUpdateRating(supabaseClient, req, path)
    } else if (method === 'DELETE' && path.includes('/ratings/')) {
      return await handleDeleteRating(supabaseClient, path)
    } else if (method === 'GET' && path.includes('/ratings/symbol/')) {
      return await handleGetRatingsBySymbol(supabaseClient, path, url)
    } else if (method === 'GET' && path.includes('/ratings/analyst/')) {
      return await handleGetRatingsByAnalyst(supabaseClient, path, url)
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

async function handleGetRatings(supabaseClient: any, url: URL) {
  const symbol = url.searchParams.get('symbol')
  const rating = url.searchParams.get('rating')
  const analyst = url.searchParams.get('analyst')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  let query = supabaseClient
    .from('stock_ratings')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (symbol) {
    query = query.eq('symbol', symbol.toUpperCase())
  }
  if (rating) {
    query = query.eq('rating', rating.toUpperCase())
  }
  if (analyst) {
    query = query.eq('analyst', analyst)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch ratings: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCreateRating(supabaseClient: any, req: Request) {
  const ratingData: StockRating = await req.json()
  
  // Validate required fields
  if (!ratingData.symbol || !ratingData.rating || !ratingData.analyst) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: symbol, rating, analyst' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Validate rating value
  const validRatings = ['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL']
  if (!validRatings.includes(ratingData.rating)) {
    return new Response(
      JSON.stringify({ error: 'Invalid rating. Must be one of: BUY, SELL, HOLD, STRONG_BUY, STRONG_SELL' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // Validate confidence if provided
  if (ratingData.confidence !== undefined && (ratingData.confidence < 0 || ratingData.confidence > 1)) {
    return new Response(
      JSON.stringify({ error: 'Confidence must be between 0 and 1' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { data, error } = await supabaseClient
    .from('stock_ratings')
    .insert([{
      symbol: ratingData.symbol.toUpperCase(),
      rating: ratingData.rating,
      target_price: ratingData.target_price,
      current_price: ratingData.current_price,
      analyst: ratingData.analyst,
      reasoning: ratingData.reasoning,
      confidence: ratingData.confidence
    }])
    .select()

  if (error) {
    throw new Error(`Failed to create rating: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, data: data[0] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleUpdateRating(supabaseClient: any, req: Request, path: string) {
  const ratingId = path.split('/ratings/')[1]
  const ratingData: Partial<StockRating> = await req.json()

  // Validate rating if provided
  if (ratingData.rating) {
    const validRatings = ['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL']
    if (!validRatings.includes(ratingData.rating)) {
      return new Response(
        JSON.stringify({ error: 'Invalid rating. Must be one of: BUY, SELL, HOLD, STRONG_BUY, STRONG_SELL' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  }

  // Validate confidence if provided
  if (ratingData.confidence !== undefined && (ratingData.confidence < 0 || ratingData.confidence > 1)) {
    return new Response(
      JSON.stringify({ error: 'Confidence must be between 0 and 1' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { data, error } = await supabaseClient
    .from('stock_ratings')
    .update({
      ...ratingData,
      symbol: ratingData.symbol?.toUpperCase(),
      updated_at: new Date().toISOString()
    })
    .eq('id', ratingId)
    .select()

  if (error) {
    throw new Error(`Failed to update rating: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Rating not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ success: true, data: data[0] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleDeleteRating(supabaseClient: any, path: string) {
  const ratingId = path.split('/ratings/')[1]

  const { error } = await supabaseClient
    .from('stock_ratings')
    .delete()
    .eq('id', ratingId)

  if (error) {
    throw new Error(`Failed to delete rating: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Rating deleted successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetRatingsBySymbol(supabaseClient: any, path: string, url: URL) {
  const symbol = path.split('/ratings/symbol/')[1]
  const limit = parseInt(url.searchParams.get('limit') || '10')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  const { data, error } = await supabaseClient
    .from('stock_ratings')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to fetch ratings for symbol: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetRatingsByAnalyst(supabaseClient: any, path: string, url: URL) {
  const analyst = path.split('/ratings/analyst/')[1]
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  const { data, error } = await supabaseClient
    .from('stock_ratings')
    .select('*')
    .eq('analyst', analyst)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to fetch ratings for analyst: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
