import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueryClassification {
  type: 'investment_advice' | 'stock_analysis' | 'stock_comparison' | 'market_analysis' | 'portfolio_optimization' | 'risk_assessment' | 'general';
  confidence: number;
  entities: string[];
  intent: string;
}

interface EdgeFunctionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// TogetherAI API configuration
const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';
const TOGETHER_MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free';

// Prompts for different types of AI interactions
const REWRITE_PROMPT = `You are a helpful stock market assistant. Analyze the provided content and provide a clear, informative response about stock market data, investment advice, or market analysis. Be concise but comprehensive.`;

const CREATE_PROMPT = `You are a helpful stock market assistant. Create informative content based on the provided data. Focus on actionable insights and clear explanations.`;

// Query classification prompt
const CLASSIFICATION_PROMPT = `You are an AI assistant that classifies user queries about stocks and investments. 

Classify the following user message into one of these categories:
- investment_advice: User wants stock recommendations or buying advice
- stock_analysis: User wants analysis of a specific stock
- stock_comparison: User wants to compare multiple stocks
- market_analysis: User wants market trends or sector analysis
- portfolio_optimization: User wants portfolio advice or diversification
- risk_assessment: User wants risk analysis or safe investments
- general: General questions or unclear intent

Respond with JSON only:
{
  "type": "category",
  "confidence": 0.0-1.0,
  "entities": ["stock_symbols", "mentioned"],
  "intent": "brief_description"
}

User message: `;

// Main conversation prompt
const CONVERSATION_PROMPT = `You are an expert AI stock advisor with access to real-time market data and advanced scoring algorithms. 

You have access to:
- Real-time stock prices from Finnhub API
- Advanced scoring matrix with momentum, volume, technical, news, and analyst scores
- Market analysis and sector performance data
- Portfolio optimization tools

Guidelines:
- Provide data-driven recommendations based on real-time data
- Always include specific metrics and scores when available
- Be conversational but professional
- Include risk warnings when appropriate
- Use emojis and formatting for better readability
- If you don't have specific data, say so honestly

Context: You are responding to a user query about stocks and investments.

User query: `;

// Classify user query
async function classifyQuery(userMessage: string, apiKey: string): Promise<QueryClassification> {
  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TOGETHER_MODEL,
        messages: [
          {
            role: 'user',
            content: CLASSIFICATION_PROMPT + userMessage
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`TogetherAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch {
      // Fallback classification
      return {
        type: 'general',
        confidence: 0.5,
        entities: [],
        intent: 'General query'
      };
    }
  } catch (error) {
    console.error('Error classifying query:', error);
    return {
      type: 'general',
      confidence: 0.5,
      entities: [],
      intent: 'General query'
    };
  }
}

// Route query to appropriate edge function
async function routeQuery(classification: QueryClassification, userMessage: string): Promise<EdgeFunctionResponse> {
  const baseUrl = 'https://cfllplzrnlveszccsejy.supabase.co/functions/v1';
  const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbGxwbHpybmx2ZXN6Y2NzZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODY3NjgsImV4cCI6MjA3NDk2Mjc2OH0.RdpGdEey99WWjmbPUXHVT5tohXs80UwkM5iVx01DVjo';

  try {
    switch (classification.type) {
      case 'investment_advice':
        const scoringResponse = await fetch(`${baseUrl}/stock-scoring/matrix`, {
          headers: { 'Authorization': authHeader }
        });
        if (scoringResponse.ok) {
          const scoringData = await scoringResponse.json();
          return { success: true, data: { type: 'investment_advice', data: scoringData.data } };
        }
        break;

      case 'stock_analysis':
        const entities = classification.entities;
        if (entities.length > 0) {
          const symbol = entities[0].toUpperCase();
          const [quoteResponse, scoringResponse] = await Promise.all([
            fetch(`${baseUrl}/finnhub/quote/${symbol}`, {
              headers: { 'Authorization': authHeader }
            }),
            fetch(`${baseUrl}/stock-scoring/matrix`, {
              headers: { 'Authorization': authHeader }
            })
          ]);
          
          const quoteData = quoteResponse.ok ? await quoteResponse.json() : null;
          const scoringData = scoringResponse.ok ? await scoringResponse.json() : null;
          
          return { 
            success: true, 
            data: { 
              type: 'stock_analysis', 
              symbol,
              quote: quoteData?.data,
              scoring: scoringData?.data?.find((s: any) => s.symbol === symbol)
            } 
          };
        }
        break;

      case 'stock_comparison':
        const comparisonEntities = classification.entities;
        if (comparisonEntities.length >= 2) {
          const symbols = comparisonEntities.slice(0, 2).map((s: string) => s.toUpperCase());
          const [quote1Response, quote2Response, scoringResponse] = await Promise.all([
            fetch(`${baseUrl}/finnhub/quote/${symbols[0]}`, {
              headers: { 'Authorization': authHeader }
            }),
            fetch(`${baseUrl}/finnhub/quote/${symbols[1]}`, {
              headers: { 'Authorization': authHeader }
            }),
            fetch(`${baseUrl}/stock-scoring/matrix`, {
              headers: { 'Authorization': authHeader }
            })
          ]);
          
          const quote1 = quote1Response.ok ? await quote1Response.json() : null;
          const quote2 = quote2Response.ok ? await quote2Response.json() : null;
          const scoringData = scoringResponse.ok ? await scoringResponse.json() : null;
          
          return { 
            success: true, 
            data: { 
              type: 'stock_comparison', 
              symbols,
              quotes: [quote1?.data, quote2?.data],
              scoring: scoringData?.data?.filter((s: any) => symbols.includes(s.symbol))
            } 
          };
        }
        break;

      case 'market_analysis':
        const marketResponse = await fetch(`${baseUrl}/stock-scoring/matrix`, {
          headers: { 'Authorization': authHeader }
        });
        if (marketResponse.ok) {
          const marketData = await marketResponse.json();
          return { success: true, data: { type: 'market_analysis', data: marketData.data } };
        }
        break;

      case 'portfolio_optimization':
        const portfolioResponse = await fetch(`${baseUrl}/stock-scoring/matrix`, {
          headers: { 'Authorization': authHeader }
        });
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json();
          return { success: true, data: { type: 'portfolio_optimization', data: portfolioData.data } };
        }
        break;

      default:
        return { success: true, data: { type: 'general', message: userMessage } };
    }
  } catch (error) {
    console.error('Error routing query:', error);
    return { success: false, error: 'Failed to fetch data' };
  }

  return { success: false, error: 'No data available' };
}

// TogetherAI API call function
async function callTogetherAI(content: string, promptType: string, apiKey: string) {
  const systemPrompt = promptType === 'rewrite' ? REWRITE_PROMPT : CREATE_PROMPT;
  const messages = [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: `Please analyze and ${promptType} the following content:\n\n${content}`
    }
  ];
  const requestBody = {
    model: TOGETHER_MODEL,
    messages: messages,
    max_tokens: 4000,
    temperature: 0.3,
    top_p: 0.9,
    stream: false
  };
  try {
    console.log('Making request to Together AI API...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    console.log('Together AI API response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together AI API error response:', errorText);
      throw new Error(`Together AI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    console.log('Together AI API response data keys:', Object.keys(data));
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response from Together AI API');
    }
    const content = data.choices[0].message.content;
    console.log('AI generated content length:', content.length);
    return content;
  } catch (error) {
    console.error('Together AI API call failed:', error);
    throw error;
  }
}

// Generate LLM response
async function generateResponse(userMessage: string, data: any, apiKey: string): Promise<string> {
  try {
    // Add a small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    let contextData = '';
    
    if (data.type === 'investment_advice' && data.data) {
      const topStocks = data.data.slice(0, 5);
      contextData = `Top Investment Opportunities:
${topStocks.map((stock: any, i: number) => 
  `${i + 1}. ${stock.symbol} - Score: ${stock.score || 'N/A'}/100, Price: $${stock.price?.toFixed(2) || 'N/A'}, Change: ${stock.change_percent?.toFixed(2) || 'N/A'}%`
).join('\n')}`;
    } else if (data.type === 'stock_analysis' && data.quote && data.scoring) {
      contextData = `${data.symbol} Analysis:
Current Price: $${data.quote.current_price?.toFixed(2) || 'N/A'}
Change: ${data.quote.change?.toFixed(2) || 'N/A'} (${data.quote.change_percent?.toFixed(2) || 'N/A'}%)
Score: ${data.scoring.score || 'N/A'}/100
Technical: ${data.scoring.technical_score || 'N/A'}/100
Momentum: ${data.scoring.momentum_score || 'N/A'}/100`;
    } else if (data.type === 'stock_comparison' && data.quotes && data.scoring) {
      contextData = `Stock Comparison:
${data.symbols.map((symbol: string, i: number) => 
  `${symbol}: Price $${data.quotes[i]?.current_price?.toFixed(2) || 'N/A'}, Change ${data.quotes[i]?.change_percent?.toFixed(2) || 'N/A'}%`
).join('\n')}`;
    }

    // Use the new callTogetherAI function
    const fullContent = `User Question: ${userMessage}\n\nContext Data:\n${contextData}`;
    const response = await callTogetherAI(fullContent, 'rewrite', apiKey);
    
    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    console.error('Error details:', error.message);
    return `I apologize, but I encountered an error while processing your request: ${error.message}. Please try again.`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const method = req.method

    // Get TogetherAI API key from environment
    const togetherApiKey = Deno.env.get('TOGETHER_API_KEY')
    if (!togetherApiKey) {
      console.error('TogetherAI API key not configured')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'TogetherAI API key not configured',
          response: 'I apologize, but the AI service is not properly configured. Please contact support.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (method === 'POST') {
      const { message } = await req.json()
      
      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Message is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Processing message:', message)

      // Test endpoint for debugging TogetherAI API
      if (message === 'test-together') {
        try {
          const testResponse = await fetch(TOGETHER_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${togetherApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: TOGETHER_MODEL,
              messages: [{ role: 'user', content: 'Hello, this is a test' }],
              max_tokens: 50
            })
          })
          
          const testData = await testResponse.json()
          return new Response(
            JSON.stringify({ 
              success: true, 
              test: 'TogetherAI API test',
              status: testResponse.status,
              data: testData
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              test: 'TogetherAI API test failed',
              error: error.message 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Step 1: Classify the query
      const classification = await classifyQuery(message, togetherApiKey)
      console.log('Query classification:', classification)

      // Step 2: Route to appropriate edge function
      const routedData = await routeQuery(classification, message)
      console.log('Routed data:', routedData)

      if (!routedData.success) {
        console.error('Routing failed:', routedData.error)
        // Fallback to general response
        const fallbackResponse = await generateResponse(message, { type: 'general', message: message }, togetherApiKey)
        return new Response(
          JSON.stringify({
            success: true,
            response: fallbackResponse,
            classification: classification,
            data: { type: 'general', message: message }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

        // Step 3: Generate LLM response
        console.log('About to call generateResponse with:', {
          message,
          data: routedData.data,
          hasApiKey: !!togetherApiKey
        })
        const llmResponse = await generateResponse(message, routedData.data, togetherApiKey)
        console.log('LLM response generated:', llmResponse)

      return new Response(
        JSON.stringify({
          success: true,
          response: llmResponse,
          classification: classification,
          data: routedData.data
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
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
