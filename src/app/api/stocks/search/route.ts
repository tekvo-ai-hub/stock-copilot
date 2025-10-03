import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = searchParams.get('limit') || '10';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  
  if (!FINNHUB_API_KEY) {
    return NextResponse.json({ error: 'Finnhub API key not configured' }, { status: 500 });
  }

  try {
    // Search stocks using Finnhub API
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Get additional data for each stock
    const stocksWithData = await Promise.all(
      data.result.slice(0, parseInt(limit)).map(async (stock: { symbol: string; description: string }) => {
        try {
          // Get quote data
          const quoteResponse = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`
          );
          
          if (quoteResponse.ok) {
            const quote = await quoteResponse.json();
            return {
              symbol: stock.symbol,
              name: stock.description,
              price: quote.c || 0,
              change: quote.d || 0,
              changePercent: quote.dp || 0,
              volume: quote.v || 0,
              marketCap: 0, // Not available in quote
              sector: 'Unknown', // Would need company profile API
            };
          }
        } catch (error) {
          console.error(`Error fetching quote for ${stock.symbol}:`, error);
        }

        // Fallback data
        return {
          symbol: stock.symbol,
          name: stock.description,
          price: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          marketCap: 0,
          sector: 'Unknown',
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        query,
        results: stocksWithData,
        total: stocksWithData.length,
      },
    });
  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    );
  }
}
