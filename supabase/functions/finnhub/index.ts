import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FinnhubResponse {
  c?: number; // current price
  d?: number; // change
  dp?: number; // percent change
  h?: number; // high
  l?: number; // low
  o?: number; // open
  pc?: number; // previous close
  t?: number; // timestamp
  v?: number; // volume
}

interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

interface NewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
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
    if (method === 'GET' && path.includes('/quote/')) {
      const symbol = path.split('/quote/')[1]
      return await handleGetQuote(symbol, finnhubApiKey)
    } else if (method === 'GET' && path.includes('/profile/')) {
      const symbol = path.split('/profile/')[1]
      return await handleGetProfile(symbol, finnhubApiKey)
    } else if (method === 'GET' && path.includes('/news/')) {
      const symbol = path.split('/news/')[1]
      const from = url.searchParams.get('from')
      const to = url.searchParams.get('to')
      return await handleGetNews(symbol, finnhubApiKey, from, to)
    } else if (method === 'GET' && path.includes('/search/')) {
      const query = url.searchParams.get('q')
      return await handleSearch(query, finnhubApiKey)
    } else if (method === 'GET' && path.includes('/recommendation/')) {
      const symbol = path.split('/recommendation/')[1]
      return await handleGetRecommendation(symbol, finnhubApiKey)
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

async function handleGetQuote(symbol: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`)
    }
    
    const data: FinnhubResponse = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          symbol,
          current_price: data.c,
          change: data.d,
          change_percent: data.dp,
          high: data.h,
          low: data.l,
          open: data.o,
          previous_close: data.pc,
          timestamp: data.t,
          volume: data.v
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error fetching quote:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch quote' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleGetProfile(symbol: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`)
    }
    
    const data: CompanyProfile = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          symbol: data.ticker,
          name: data.name,
          country: data.country,
          currency: data.currency,
          exchange: data.exchange,
          ipo: data.ipo,
          market_cap: data.marketCapitalization,
          phone: data.phone,
          shares_outstanding: data.shareOutstanding,
          website: data.weburl,
          logo: data.logo,
          industry: data.finnhubIndustry
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error fetching profile:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch company profile' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleGetNews(symbol: string, apiKey: string, from?: string | null, to?: string | null) {
  try {
    const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const toDate = to || new Date().toISOString().split('T')[0]
    
    const response = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`)
    }
    
    const data: NewsItem[] = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        data: data.map(item => ({
          id: item.id,
          headline: item.headline,
          summary: item.summary,
          source: item.source,
          url: item.url,
          image: item.image,
          category: item.category,
          datetime: item.datetime,
          related: item.related
        }))
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error fetching news:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch news' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleSearch(query: string | null, apiKey: string) {
  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Query parameter is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          count: data.count,
          result: data.result
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error searching:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to search' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleGetRecommendation(symbol: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        data: data.map((item: any) => ({
          period: item.period,
          strong_buy: item.strongBuy,
          buy: item.buy,
          hold: item.hold,
          sell: item.sell,
          strong_sell: item.strongSell
        }))
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch recommendations' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}
