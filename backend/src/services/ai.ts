import { TogetherAI } from '@togetherai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';

// AI Model Configuration
const AI_CONFIG = {
  togetherAI: {
    apiKey: process.env.TOGETHER_AI_API_KEY,
    baseURL: 'https://api.together.xyz/v1',
  },
  openAI: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  models: {
    prediction: 'meta-llama/Llama-2-70b-chat-hf',
    analysis: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    chat: 'meta-llama/Llama-2-70b-chat-hf',
    embedding: 'sentence-transformers/all-MiniLM-L6-v2',
  }
};

// Validation schemas
const PredictionRequestSchema = z.object({
  symbol: z.string().min(1).max(10),
  timeframe: z.enum(['1d', '1w', '2w', '1m', '3m']),
  model: z.enum(['lstm', 'transformer', 'ensemble', 'hybrid']),
  confidence_threshold: z.number().min(0).max(1).default(0.7),
});

const AnalysisRequestSchema = z.object({
  symbol: z.string().min(1).max(10),
  analysis_type: z.enum(['technical', 'fundamental', 'sentiment', 'comprehensive']),
  indicators: z.array(z.string()).optional(),
  timeframe: z.enum(['1d', '1w', '1m', '3m', '1y']).default('1m'),
});

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    symbol: z.string().optional(),
    portfolio: z.array(z.string()).optional(),
    recent_predictions: z.array(z.string()).optional(),
  }).optional(),
  chat_history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string(),
  })).optional(),
});

export class AIService {
  private static togetherAI: TogetherAI;
  private static openAI: OpenAI;
  private static isInitialized = false;

  public static async initialize() {
    try {
      // Initialize TogetherAI
      if (AI_CONFIG.togetherAI.apiKey) {
        this.togetherAI = new TogetherAI({
          apiKey: AI_CONFIG.togetherAI.apiKey,
        });
        console.log('✅ TogetherAI initialized');
      }

      // Initialize OpenAI as fallback
      if (AI_CONFIG.openAI.apiKey) {
        this.openAI = new OpenAI({
          apiKey: AI_CONFIG.openAI.apiKey,
        });
        console.log('✅ OpenAI initialized');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ AI Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate stock price prediction using AI models
   */
  public static async generatePrediction(request: z.infer<typeof PredictionRequestSchema>) {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    const validatedRequest = PredictionRequestSchema.parse(request);
    
    try {
      const prompt = this.buildPredictionPrompt(validatedRequest);
      
      const response = await this.togetherAI.chat.completions.create({
        model: AI_CONFIG.models.prediction,
        messages: [
          {
            role: 'system',
            content: `You are an expert financial analyst and AI model specializing in stock price predictions. 
            You have access to real-time market data and advanced technical analysis tools.
            Provide accurate, data-driven predictions with confidence levels.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        top_p: 0.9,
      });

      return this.parsePredictionResponse(response.choices[0].message.content, validatedRequest);
    } catch (error) {
      console.error('Prediction generation failed:', error);
      throw new Error('Failed to generate prediction');
    }
  }

  /**
   * Generate technical analysis using AI
   */
  public static async generateAnalysis(request: z.infer<typeof AnalysisRequestSchema>) {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    const validatedRequest = AnalysisRequestSchema.parse(request);
    
    try {
      const prompt = this.buildAnalysisPrompt(validatedRequest);
      
      const response = await this.togetherAI.chat.completions.create({
        model: AI_CONFIG.models.analysis,
        messages: [
          {
            role: 'system',
            content: `You are a professional technical analyst with expertise in financial markets.
            Provide detailed technical analysis including indicators, patterns, and trading signals.
            Be specific about support/resistance levels and risk management.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
        top_p: 0.8,
      });

      return this.parseAnalysisResponse(response.choices[0].message.content, validatedRequest);
    } catch (error) {
      console.error('Analysis generation failed:', error);
      throw new Error('Failed to generate analysis');
    }
  }

  /**
   * Handle chat conversations with financial context
   */
  public static async handleChat(request: z.infer<typeof ChatRequestSchema>) {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    const validatedRequest = ChatRequestSchema.parse(request);
    
    try {
      const systemPrompt = this.buildChatSystemPrompt(validatedRequest.context);
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...(validatedRequest.chat_history || []),
        { role: 'user' as const, content: validatedRequest.message }
      ];
      
      const response = await this.togetherAI.chat.completions.create({
        model: AI_CONFIG.models.chat,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
      });

      return {
        response: response.choices[0].message.content,
        usage: response.usage,
        model: AI_CONFIG.models.chat,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Chat generation failed:', error);
      throw new Error('Failed to generate chat response');
    }
  }

  /**
   * Generate embeddings for similarity search
   */
  public static async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      throw new Error('AI Service not initialized');
    }

    try {
      const response = await this.togetherAI.embeddings.create({
        model: AI_CONFIG.models.embedding,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  private static buildPredictionPrompt(request: z.infer<typeof PredictionRequestSchema>): string {
    return `
Generate a stock price prediction for ${request.symbol} with the following parameters:
- Timeframe: ${request.timeframe}
- Model Type: ${request.model}
- Confidence Threshold: ${request.confidence_threshold}

Please provide:
1. Predicted price range (low, high, most likely)
2. Confidence level (0-100%)
3. Key factors influencing the prediction
4. Risk assessment
5. Recommended action (buy, hold, sell)

Format the response as JSON with the following structure:
{
  "predicted_price": {
    "low": number,
    "high": number,
    "most_likely": number
  },
  "confidence": number,
  "factors": string[],
  "risk_level": "low" | "medium" | "high",
  "recommendation": "buy" | "hold" | "sell",
  "reasoning": string
}
    `.trim();
  }

  private static buildAnalysisPrompt(request: z.infer<typeof AnalysisRequestSchema>): string {
    return `
Perform ${request.analysis_type} analysis for ${request.symbol}:
- Timeframe: ${request.timeframe}
- Indicators: ${request.indicators?.join(', ') || 'RSI, MACD, SMA, EMA, Bollinger Bands'}

Please provide:
1. Technical indicators analysis
2. Chart patterns identified
3. Support and resistance levels
4. Trading signals
5. Risk management recommendations

Format the response as JSON with the following structure:
{
  "indicators": {
    "rsi": { "value": number, "signal": string },
    "macd": { "value": number, "signal": string },
    "sma_50": { "value": number, "signal": string },
    "ema_20": { "value": number, "signal": string }
  },
  "patterns": string[],
  "support_resistance": {
    "support": number[],
    "resistance": number[]
  },
  "signals": {
    "entry": string[],
    "exit": string[]
  },
  "risk_management": {
    "stop_loss": number,
    "take_profit": number,
    "risk_reward": number
  }
}
    `.trim();
  }

  private static buildChatSystemPrompt(context?: any): string {
    return `
You are an AI Financial Assistant for Stock Copilot, a professional stock prediction platform.

Your capabilities:
- Stock analysis and predictions
- Portfolio optimization advice
- Market trend analysis
- Technical indicator explanations
- Risk management guidance

Current context:
${context?.symbol ? `- Focused on: ${context.symbol}` : ''}
${context?.portfolio ? `- User portfolio: ${context.portfolio.join(', ')}` : ''}
${context?.recent_predictions ? `- Recent predictions: ${context.recent_predictions.join(', ')}` : ''}

Guidelines:
- Provide accurate, data-driven responses
- Always include risk disclaimers
- Be professional and helpful
- Use financial terminology appropriately
- Suggest specific actions when relevant
- Ask clarifying questions when needed

Remember: This is for educational and informational purposes only. Not financial advice.
    `.trim();
  }

  private static parsePredictionResponse(content: string, request: any) {
    try {
      const parsed = JSON.parse(content);
      return {
        ...parsed,
        symbol: request.symbol,
        timeframe: request.timeframe,
        model: request.model,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse prediction response:', error);
      throw new Error('Invalid prediction response format');
    }
  }

  private static parseAnalysisResponse(content: string, request: any) {
    try {
      const parsed = JSON.parse(content);
      return {
        ...parsed,
        symbol: request.symbol,
        analysis_type: request.analysis_type,
        timeframe: request.timeframe,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      throw new Error('Invalid analysis response format');
    }
  }
}
