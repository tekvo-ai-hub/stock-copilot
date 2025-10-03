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

    const { message, sessionId, context } = await req.json()

    // Validate input
    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get chat history for context
    const { data: chatHistory, error: historyError } = await supabaseClient
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20)

    if (historyError) {
      console.error('Error fetching chat history:', historyError)
    }

    // Generate AI response
    const aiResponse = await generateAIResponse({
      message,
      context: context || {},
      chatHistory: chatHistory || [],
      user
    })

    // Save user message
    const { error: userMessageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'USER',
        content: message,
        metadata: { context }
      })

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError)
    }

    // Save AI response
    const { data: aiMessageData, error: aiMessageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'ASSISTANT',
        content: aiResponse.response,
        metadata: {
          model: aiResponse.model,
          usage: aiResponse.usage,
          context: context
        }
      })
      .select()
      .single()

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError)
    }

    // Update session timestamp
    await supabaseClient
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: aiResponse.response,
          usage: aiResponse.usage,
          model: aiResponse.model,
          timestamp: new Date().toISOString(),
          messageId: aiMessageData?.id
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

async function generateAIResponse(params: {
  message: string
  context: any
  chatHistory: any[]
  user: any
}) {
  const { message, context, chatHistory, user } = params

  // Mock AI response - replace with actual AI service integration
  const responses = [
    "Based on my analysis of the current market conditions, I can help you understand the trends and make informed decisions.",
    "I've analyzed the technical indicators and can provide insights on potential price movements and trading opportunities.",
    "Let me break down the market data and provide you with a comprehensive analysis of the current situation.",
    "I can help you optimize your portfolio by analyzing risk factors and suggesting diversification strategies.",
    "Based on the latest market sentiment and technical analysis, here are my recommendations for your investment strategy."
  ]

  // Simple keyword-based response selection
  let response = responses[Math.floor(Math.random() * responses.length)]
  
  if (message.toLowerCase().includes('apple') || message.toLowerCase().includes('aapl')) {
    response = `Apple (AAPL) is currently trading around $175.43. Based on my analysis:
    
- **Technical Indicators**: RSI at 65.4 (neutral to bullish), MACD showing bullish crossover
- **Price Target**: $182.50 in the next 30 days with 87% confidence
- **Recommendation**: BUY - Strong fundamentals and positive momentum
- **Risk Level**: Medium - Monitor market volatility

The stock shows strong support at $170 and resistance at $180. Would you like me to provide more detailed analysis?`
  } else if (message.toLowerCase().includes('prediction') || message.toLowerCase().includes('forecast')) {
    response = `I can generate AI-powered predictions for any stock symbol. Here's how it works:

🔮 **Prediction Models Available**:
- LSTM Neural Network (85% accuracy)
- Transformer Model (82% accuracy) 
- Ensemble Model (88% accuracy)
- Hybrid Model (90% accuracy)

📊 **Timeframes**: 1 day, 1 week, 2 weeks, 1 month, 3 months

Just tell me the stock symbol and timeframe, and I'll provide a detailed prediction with confidence levels and risk assessment.`
  } else if (message.toLowerCase().includes('portfolio') || message.toLowerCase().includes('holdings')) {
    response = `I can help you analyze and optimize your portfolio:

📈 **Portfolio Analysis**:
- Performance tracking and benchmarking
- Risk assessment and diversification
- Asset allocation recommendations
- Rebalancing suggestions

💼 **Portfolio Management**:
- Add/remove holdings
- Track performance metrics
- Set price alerts
- Generate reports

Would you like me to analyze your current portfolio or help you build a new one?`
  } else if (message.toLowerCase().includes('market') || message.toLowerCase().includes('trends')) {
    response = `Current Market Overview:

📊 **Major Indices**:
- S&P 500: 4,567.89 (+0.52%)
- Dow Jones: 34,567.89 (-0.36%)
- NASDAQ: 14,234.56 (+0.63%)
- Russell 2000: 1,987.65 (+0.62%)

🔥 **Top Movers**:
- NVIDIA (NVDA): +4.1% - AI sector strength
- Apple (AAPL): +2.3% - Strong earnings
- Tesla (TSLA): -2.2% - Market volatility

📈 **Sector Performance**:
- Technology: +1.2%
- Healthcare: +0.8%
- Energy: +2.1%
- Financials: -0.3%

The market is showing mixed signals with tech stocks leading gains while financials face headwinds.`
  }

  return {
    response,
    model: 'stock-copilot-ai-v1',
    usage: {
      prompt_tokens: message.length,
      completion_tokens: response.length,
      total_tokens: message.length + response.length
    }
  }
}
