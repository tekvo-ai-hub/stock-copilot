"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Send,
  Bot,
  User,
  Plus,
  MoreVertical,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
} from "lucide-react";

interface Message {
  id: number;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  type?: "text" | "chart" | "analysis";
}

interface StockRating {
  symbol: string;
  rating: string;
  target_price?: number;
  current_price?: number;
  analyst?: string;
  reasoning?: string;
  confidence?: number;
  real_time_price?: number;
  price_change?: number;
  price_change_percent?: number;
  created_at?: string;
}

interface StockScore {
  symbol: string;
  score?: number;
  price?: number;
  change?: number;
  change_percent?: number;
  momentum_score?: number;
  volume_score?: number;
  technical_score?: number;
  news_score?: number;
  analyst_score?: number;
  sector?: string;
}

interface RealTimeData {
  current_price?: number;
  change?: number;
  change_percent?: number;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentChat?: {
    id: string;
    title: string;
  };
}

const initialMessages: Message[] = [];

export function ChatPanel({ isOpen, onClose, currentChat }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [stockRatings, setStockRatings] = useState<StockRating[]>([]);
  const [scoringMatrix, setScoringMatrix] = useState<StockScore[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch scoring matrix data
  const fetchScoringMatrix = async () => {
    try {
      console.log('Fetching scoring matrix...');
      const response = await fetch('https://cfllplzrnlveszccsejy.supabase.co/functions/v1/stock-scoring/matrix', {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbGxwbHpybmx2ZXN6Y2NzZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODY3NjgsImV4cCI6MjA3NDk2Mjc2OH0.RdpGdEey99WWjmbPUXHVT5tohXs80UwkM5iVx01DVjo`
        }
      });
      
      console.log('Scoring matrix response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Scoring matrix data received:', data);
        console.log('Number of stocks:', data.data?.length || 0);
        setScoringMatrix(data.data || []);
        return data.data || [];
      } else {
        console.error('Failed to fetch scoring matrix:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching scoring matrix:', error);
      return [];
    }
  };

  // Fetch real-time stock data from Finnhub
  const fetchRealTimeStockData = async (symbol: string): Promise<RealTimeData | null> => {
    try {
      const response = await fetch(`https://cfllplzrnlveszccsejy.supabase.co/functions/v1/finnhub/quote/${symbol}`, {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbGxwbHpybmx2ZXN6Y2NzZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODY3NjgsImV4cCI6MjA3NDk2Mjc2OH0.RdpGdEey99WWjmbPUXHVT5tohXs80UwkM5iVx01DVjo`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching real-time data for ${symbol}:`, error);
      return null;
    }
  };

  // Fetch stock ratings from our edge function
  const fetchStockRatings = async () => {
    try {
      console.log('Fetching stock ratings from edge function...');
      const response = await fetch('https://cfllplzrnlveszccsejy.supabase.co/functions/v1/swift-endpoint/ratings', {
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbGxwbHpybmx2ZXN6Y2NzZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODY3NjgsImV4cCI6MjA3NDk2Mjc2OH0.RdpGdEey99WWjmbPUXHVT5tohXs80UwkM5iVx01DVjo`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stock ratings data:', data);
        const ratings = data.data || [];
        
        // Fetch real-time prices for each stock
        const ratingsWithRealTimeData = await Promise.all(
          ratings.map(async (rating: StockRating) => {
            try {
              const priceResponse = await fetch(`https://cfllplzrnlveszccsejy.supabase.co/functions/v1/finnhub/quote/${rating.symbol}`, {
                headers: {
                  'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmbGxwbHpybmx2ZXN6Y2NzZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODY3NjgsImV4cCI6MjA3NDk2Mjc2OH0.RdpGdEey99WWjmbPUXHVT5tohXs80UwkM5iVx01DVjo`
                }
              });
              
              if (priceResponse.ok) {
                const priceData = await priceResponse.json();
                return {
                  ...rating,
                  real_time_price: priceData.data.current_price,
                  price_change: priceData.data.change,
                  price_change_percent: priceData.data.change_percent
                };
              }
              return rating;
            } catch (error) {
              console.error(`Error fetching real-time price for ${rating.symbol}:`, error);
              return rating;
            }
          })
        );
        
        setStockRatings(ratingsWithRealTimeData);
      } else {
        console.error('Failed to fetch stock ratings:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching stock ratings:', error);
    }
  };

  // Intelligent conversational AI response generator
  const generateIntelligentResponse = async (userMessage: string): Promise<string> => {
    const message = userMessage.toLowerCase();
    
    // Load data if not already loaded
    if (scoringMatrix.length === 0) {
      await fetchScoringMatrix();
    }
    
    // Investment advice queries
    if (message.includes('buy') || message.includes('invest') || message.includes('recommend')) {
      return await generateInvestmentAdvice();
    }
    
    // Stock comparison queries
    if (message.includes('compare') || message.includes('vs') || message.includes('versus')) {
      return await generateStockComparison(message);
    }
    
    // Market analysis queries
    if (message.includes('market') || message.includes('analysis') || message.includes('trend')) {
      return await generateMarketAnalysis();
    }
    
    // Specific stock queries
    const stockSymbols = scoringMatrix.map(s => s.symbol.toLowerCase());
    const mentionedStocks = stockSymbols.filter(symbol => message.includes(symbol));
    
    if (mentionedStocks.length > 0) {
      return await generateStockAnalysis(mentionedStocks[0]);
    }
    
    // Portfolio optimization
    if (message.includes('portfolio') || message.includes('diversify') || message.includes('allocation')) {
      return await generatePortfolioAdvice();
    }
    
    // Risk assessment
    if (message.includes('risk') || message.includes('safe') || message.includes('volatile')) {
      return await generateRiskAssessment();
    }
    
    // Default response
    return generateDefaultResponse();
  };

  // Generate investment advice based on scoring matrix
  const generateInvestmentAdvice = async (): Promise<string> => {
    console.log('Generating investment advice...');
    console.log('Scoring matrix length:', scoringMatrix.length);
    
    // If no scoring matrix data, try to fetch it
    let currentScoringMatrix = scoringMatrix;
    if (currentScoringMatrix.length === 0) {
      console.log('No scoring matrix data, fetching...');
      currentScoringMatrix = await fetchScoringMatrix();
    }
    
    // If still no data, provide fallback response
    if (currentScoringMatrix.length === 0) {
      return `🚀 **Top Investment Opportunities** (Based on Real-Time Scoring):

I'm currently fetching the latest scoring data from our analysis system. This may take a moment...

**Popular High-Performing Stocks to Consider:**
• **AAPL** - Apple Inc. (Technology)
• **MSFT** - Microsoft Corp. (Technology) 
• **NVDA** - NVIDIA Corp. (Technology)
• **GOOGL** - Alphabet Inc. (Technology)
• **AMZN** - Amazon.com Inc. (Consumer)

**Why these picks?**
• Large-cap technology leaders with strong fundamentals
• Diversified across different tech sectors
• Generally lower risk due to market dominance
• Strong balance sheets and cash flow

⚠️ **Risk Note:** Always do your own research and consider your risk tolerance!`;
    }
    
    const topStocks = currentScoringMatrix.slice(0, 5);
    let response = "🚀 **Top Investment Opportunities** (Based on Real-Time Scoring):\n\n";
    
    for (let i = 0; i < topStocks.length; i++) {
      const stock = topStocks[i];
      const realTimeData = await fetchRealTimeStockData(stock.symbol);
      
      const changeSymbol = (stock.change ?? 0) >= 0 ? '📈' : '📉';
      
      // Calculate fallback score if null
      const calculatedScore = stock.score || Math.round(
        (stock.technical_score || 50) * 0.3 + 
        (stock.news_score || 50) * 0.3 + 
        (stock.analyst_score || 50) * 0.4
      );
      
      const momentumScore = stock.momentum_score || Math.round(
        50 + ((stock.change_percent ?? 0) * 10)
      );
      
      const scoreEmoji = calculatedScore >= 85 ? '🔥' : calculatedScore >= 75 ? '⭐' : '📊';
      
      response += `${scoreEmoji} **${stock.symbol}** - Score: ${calculatedScore}/100\n`;
      response += `   • Price: $${realTimeData?.current_price?.toFixed(2) || stock.price?.toFixed(2) || 'N/A'} ${changeSymbol} ${(stock.change ?? 0) >= 0 ? '+' : ''}${(stock.change ?? 0).toFixed(2)} (${(stock.change_percent ?? 0).toFixed(2)}%)\n`;
      response += `   • Sector: ${stock.sector || 'N/A'}\n`;
      response += `   • Momentum: ${momentumScore}/100 | Volume: ${stock.volume_score || 'N/A'}/100\n`;
      response += `   • Technical: ${stock.technical_score || 'N/A'}/100 | News: ${stock.news_score || 'N/A'}/100\n\n`;
    }
    
    response += "**Why these picks?**\n";
    response += "• High momentum scores indicate strong price trends\n";
    response += "• Volume spikes suggest institutional interest\n";
    response += "• Technical indicators show bullish patterns\n";
    response += "• Diversified across sectors for risk management\n\n";
    response += "⚠️ **Risk Note:** Always do your own research and consider your risk tolerance!";
    
    return response;
  };

  // Generate stock comparison
  const generateStockComparison = async (message: string): Promise<string> => {
    const stockSymbols = scoringMatrix.map(s => s.symbol.toLowerCase());
    const mentionedStocks = stockSymbols.filter(symbol => message.includes(symbol));
    
    if (mentionedStocks.length < 2) {
      return "Please mention at least 2 stocks to compare. For example: 'Compare AAPL vs MSFT'";
    }
    
    const stock1 = scoringMatrix.find(s => s.symbol.toLowerCase() === mentionedStocks[0]);
    const stock2 = scoringMatrix.find(s => s.symbol.toLowerCase() === mentionedStocks[1]);
    
    if (!stock1 || !stock2) {
      return "I couldn't find data for those stocks. Please check the spelling and try again.";
    }
    
    const realTime1 = await fetchRealTimeStockData(stock1.symbol);
    const realTime2 = await fetchRealTimeStockData(stock2.symbol);
    
    let response = `📊 **${stock1.symbol} vs ${stock2.symbol} Comparison**\n\n`;
    
    response += `**${stock1.symbol}** (Score: ${stock1.score || 'N/A'}/100)\n`;
    response += `• Price: $${realTime1?.current_price?.toFixed(2) || stock1.price?.toFixed(2) || 'N/A'} (${(stock1.change ?? 0) >= 0 ? '+' : ''}${(stock1.change_percent ?? 0).toFixed(2)}%)\n`;
    response += `• Momentum: ${stock1.momentum_score || 'N/A'}/100 | Volume: ${stock1.volume_score || 'N/A'}/100\n`;
    response += `• Technical: ${stock1.technical_score || 'N/A'}/100 | Sector: ${stock1.sector || 'N/A'}\n\n`;
    
    response += `**${stock2.symbol}** (Score: ${stock2.score || 'N/A'}/100)\n`;
    response += `• Price: $${realTime2?.current_price?.toFixed(2) || stock2.price?.toFixed(2) || 'N/A'} (${(stock2.change ?? 0) >= 0 ? '+' : ''}${(stock2.change_percent ?? 0).toFixed(2)}%)\n`;
    response += `• Momentum: ${stock2.momentum_score || 'N/A'}/100 | Volume: ${stock2.volume_score || 'N/A'}/100\n`;
    response += `• Technical: ${stock2.technical_score || 'N/A'}/100 | Sector: ${stock2.sector || 'N/A'}\n\n`;
    
    const winner = (stock1.score ?? 0) > (stock2.score ?? 0) ? stock1.symbol : stock2.symbol;
    response += `🏆 **Winner:** ${winner} (Higher overall score)\n`;
    response += `💡 **Recommendation:** ${winner} shows stronger fundamentals and momentum`;
    
    return response;
  };

  // Generate market analysis
  const generateMarketAnalysis = async (): Promise<string> => {
    const techStocks = scoringMatrix.filter(s => s.sector === 'Technology').slice(0, 3);
    const financeStocks = scoringMatrix.filter(s => s.sector === 'Financial Services').slice(0, 3);
    const healthcareStocks = scoringMatrix.filter(s => s.sector === 'Healthcare').slice(0, 3);
    
    let response = "📈 **Market Analysis & Sector Performance**\n\n";
    
    response += "🔥 **Technology Leaders:**\n";
    techStocks.forEach(stock => {
      response += `• ${stock.symbol}: ${stock.score || 'N/A'}/100 (${(stock.change ?? 0) >= 0 ? '+' : ''}${(stock.change_percent ?? 0).toFixed(2)}%)\n`;
    });
    
    response += "\n💰 **Financial Services:**\n";
    financeStocks.forEach(stock => {
      response += `• ${stock.symbol}: ${stock.score || 'N/A'}/100 (${(stock.change ?? 0) >= 0 ? '+' : ''}${(stock.change_percent ?? 0).toFixed(2)}%)\n`;
    });
    
    response += "\n🏥 **Healthcare:**\n";
    healthcareStocks.forEach(stock => {
      response += `• ${stock.symbol}: ${stock.score || 'N/A'}/100 (${(stock.change ?? 0) >= 0 ? '+' : ''}${(stock.change_percent ?? 0).toFixed(2)}%)\n`;
    });
    
    const avgScore = Math.round(scoringMatrix.reduce((sum, s) => sum + (s.score ?? 0), 0) / scoringMatrix.length);
    response += `\n📊 **Market Overview:**\n`;
    response += `• Average Score: ${avgScore}/100\n`;
    response += `• High Performers (80+): ${scoringMatrix.filter(s => (s.score ?? 0) >= 80).length} stocks\n`;
    response += `• Market Sentiment: ${avgScore >= 70 ? 'Bullish' : avgScore >= 50 ? 'Neutral' : 'Bearish'}\n`;
    
    return response;
  };

  // Generate specific stock analysis
  const generateStockAnalysis = async (symbol: string): Promise<string> => {
    const stock = scoringMatrix.find(s => s.symbol.toLowerCase() === symbol);
    if (!stock) {
      return `I couldn't find data for ${symbol.toUpperCase()}. Please check the spelling and try again.`;
    }
    
    const realTimeData = await fetchRealTimeStockData(symbol.toUpperCase());
    const changeSymbol = (stock.change ?? 0) >= 0 ? '📈' : '📉';
    const scoreEmoji = (stock.score ?? 0) >= 85 ? '🔥' : (stock.score ?? 0) >= 75 ? '⭐' : '📊';
    
    let response = `${scoreEmoji} **${stock.symbol} Analysis**\n\n`;
    response += `**Current Price:** $${realTimeData?.current_price?.toFixed(2) || stock.price?.toFixed(2) || 'N/A'} ${changeSymbol} ${(stock.change ?? 0) >= 0 ? '+' : ''}${(stock.change ?? 0).toFixed(2)} (${(stock.change_percent ?? 0).toFixed(2)}%)\n`;
    response += `**Overall Score:** ${stock.score || 'N/A'}/100\n`;
    response += `**Sector:** ${stock.sector}\n\n`;
    
    response += `**Score Breakdown:**\n`;
    response += `• Momentum: ${stock.momentum_score || 'N/A'}/100 (${(stock.momentum_score ?? 0) >= 80 ? 'Strong' : (stock.momentum_score ?? 0) >= 60 ? 'Good' : 'Weak'})\n`;
    response += `• Volume: ${stock.volume_score || 'N/A'}/100 (${(stock.volume_score ?? 0) >= 80 ? 'High' : (stock.volume_score ?? 0) >= 60 ? 'Average' : 'Low'})\n`;
    response += `• Technical: ${stock.technical_score || 'N/A'}/100 (${(stock.technical_score ?? 0) >= 80 ? 'Bullish' : (stock.technical_score ?? 0) >= 60 ? 'Neutral' : 'Bearish'})\n`;
    response += `• News: ${stock.news_score || 'N/A'}/100 (${(stock.news_score ?? 0) >= 80 ? 'Positive' : (stock.news_score ?? 0) >= 60 ? 'Mixed' : 'Negative'})\n`;
    response += `• Analyst: ${stock.analyst_score || 'N/A'}/100 (${(stock.analyst_score ?? 0) >= 80 ? 'Strong Buy' : (stock.analyst_score ?? 0) >= 60 ? 'Buy' : 'Hold'})\n\n`;
    
    if ((stock.score ?? 0) >= 80) {
      response += `🚀 **Recommendation:** Strong Buy - Excellent fundamentals and momentum\n`;
    } else if ((stock.score ?? 0) >= 60) {
      response += `⭐ **Recommendation:** Buy - Good potential with moderate risk\n`;
    } else {
      response += `⚠️ **Recommendation:** Hold - Wait for better entry point\n`;
    }
    
    return response;
  };

  // Generate portfolio advice
  const generatePortfolioAdvice = async (): Promise<string> => {
    const topStocks = scoringMatrix.slice(0, 8);
    const sectors = [...new Set(topStocks.map(s => s.sector))];
    
    let response = "💼 **Portfolio Optimization Strategy**\n\n";
    response += "**Diversified Allocation (Top 8 Stocks):**\n\n";
    
    topStocks.forEach((stock, index) => {
      const allocation = Math.round((8 - index) * 2.5); // Weighted allocation
      response += `${index + 1}. **${stock.symbol}** - ${allocation}% allocation\n`;
      response += `   • Score: ${stock.score || 'N/A'}/100 | Sector: ${stock.sector || 'N/A'}\n`;
      response += `   • Risk Level: ${(stock.score ?? 0) >= 80 ? 'Low' : (stock.score ?? 0) >= 60 ? 'Medium' : 'High'}\n\n`;
    });
    
    response += "**Sector Diversification:**\n";
    sectors.forEach(sector => {
      const sectorStocks = topStocks.filter(s => s.sector === sector);
      response += `• ${sector}: ${sectorStocks.length} stocks\n`;
    });
    
    response += "\n**Risk Management:**\n";
    response += "• 60% in high-scoring stocks (80+ score)\n";
    response += "• 30% in medium-scoring stocks (60-79 score)\n";
    response += "• 10% in growth opportunities (emerging sectors)\n";
    response += "• Rebalance monthly based on score changes";
    
    return response;
  };

  // Generate risk assessment
  const generateRiskAssessment = async (): Promise<string> => {
    const highRiskStocks = scoringMatrix.filter(s => (s.score ?? 0) < 60);
    const mediumRiskStocks = scoringMatrix.filter(s => (s.score ?? 0) >= 60 && (s.score ?? 0) < 80);
    const lowRiskStocks = scoringMatrix.filter(s => (s.score ?? 0) >= 80);
    
    let response = "⚠️ **Risk Assessment & Safe Investment Options**\n\n";
    
    response += "🟢 **Low Risk (Score 80+):**\n";
    lowRiskStocks.slice(0, 5).forEach(stock => {
      response += `• ${stock.symbol}: ${stock.score}/100 (${stock.sector})\n`;
    });
    
    response += "\n🟡 **Medium Risk (Score 60-79):**\n";
    mediumRiskStocks.slice(0, 5).forEach(stock => {
      response += `• ${stock.symbol}: ${stock.score}/100 (${stock.sector})\n`;
    });
    
    response += "\n🔴 **High Risk (Score <60):**\n";
    response += "• Avoid these stocks unless you have high risk tolerance\n";
    response += "• Consider for short-term trading only\n";
    response += "• Set strict stop-losses\n\n";
    
    response += "**Risk Management Tips:**\n";
    response += "• Never invest more than you can afford to lose\n";
    response += "• Diversify across sectors and risk levels\n";
    response += "• Use dollar-cost averaging for volatile stocks\n";
    response += "• Set stop-losses at 10-15% below entry price";
    
    return response;
  };

  // Generate default response
  const generateDefaultResponse = (): string => {
    return `I'm your AI stock advisor! I can help you with:

🎯 **Investment Advice** - "What stocks should I buy?"
📊 **Stock Analysis** - "Analyze AAPL" or "Tell me about NVDA"
📈 **Market Trends** - "What's the market doing today?"
🔄 **Stock Comparisons** - "Compare AAPL vs MSFT"
💼 **Portfolio Help** - "Help me diversify my portfolio"
⚠️ **Risk Assessment** - "What are safe investments?"

I use real-time data from our scoring matrix and Finnhub API to give you data-driven recommendations. What would you like to know?`;
  };

  // Simple LLM-like response based on stock ratings
  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Check if user is asking about specific stocks
    const stockSymbols = stockRatings.map(r => r.symbol.toLowerCase());
    const mentionedStocks = stockSymbols.filter(symbol => message.includes(symbol));
    
    if (mentionedStocks.length > 0) {
      const stock = stockRatings.find(r => mentionedStocks.includes(r.symbol.toLowerCase()));
      if (stock) {
        const realTimePrice = stock.real_time_price || stock.current_price;
        const priceChange = stock.price_change || 0;
        const priceChangePercent = stock.price_change_percent || 0;
        const changeSymbol = priceChange >= 0 ? '📈' : '📉';
        
        return `Based on our latest ratings, ${stock.symbol} has a ${stock.rating} rating with ${((stock.confidence || 0) * 100).toFixed(0)}% confidence. 
        
**Real-Time Price:** $${realTimePrice?.toFixed(2)} ${changeSymbol} ${priceChange >= 0 ? '+' : ''}${priceChange?.toFixed(2)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent?.toFixed(2)}%)
**Target Price:** $${stock.target_price?.toFixed(2)}
**Analyst:** ${stock.analyst}
**Reasoning:** ${stock.reasoning}

This rating was updated on ${stock.created_at ? new Date(stock.created_at).toLocaleDateString() : 'recently'}.`;
      }
    }
    
    // General responses based on keywords
    if (message.includes('rating') || message.includes('rate')) {
      const buyStocks = stockRatings.filter(r => r.rating === 'BUY' || r.rating === 'STRONG_BUY');
      const sellStocks = stockRatings.filter(r => r.rating === 'SELL' || r.rating === 'STRONG_SELL');
      
      return `I have ${stockRatings.length} stock ratings available with real-time prices:

**Buy Recommendations (${buyStocks.length}):**
${buyStocks.slice(0, 3).map(s => {
  const realTimePrice = s.real_time_price || s.current_price;
  const priceChange = s.price_change || 0;
  const priceChangePercent = s.price_change_percent || 0;
  const changeSymbol = priceChange >= 0 ? '📈' : '📉';
  return `• ${s.symbol} - ${s.rating} (${((s.confidence || 0) * 100).toFixed(0)}% confidence) - $${realTimePrice?.toFixed(2)} ${changeSymbol} ${priceChange >= 0 ? '+' : ''}${priceChange?.toFixed(2)}`;
}).join('\n')}

**Sell Recommendations (${sellStocks.length}):**
${sellStocks.slice(0, 3).map(s => {
  const realTimePrice = s.real_time_price || s.current_price;
  const priceChange = s.price_change || 0;
  const priceChangePercent = s.price_change_percent || 0;
  const changeSymbol = priceChange >= 0 ? '📈' : '📉';
  return `• ${s.symbol} - ${s.rating} (${((s.confidence || 0) * 100).toFixed(0)}% confidence) - $${realTimePrice?.toFixed(2)} ${changeSymbol} ${priceChange >= 0 ? '+' : ''}${priceChange?.toFixed(2)}`;
}).join('\n')}

Ask me about any specific stock for detailed analysis!`;
    }
    
    if (message.includes('help') || message.includes('what can you do')) {
      return `I can help you with stock analysis based on our current ratings. Here's what I can do:

• **Analyze specific stocks** - Ask about any stock symbol
• **Show ratings summary** - Get overview of all ratings
• **Compare stocks** - Compare multiple stocks
• **Find recommendations** - Get buy/sell recommendations

Try asking: "What's the rating for AAPL?" or "Show me all buy recommendations"`;
    }
    
    // Default response
    return `I can help you analyze our stock ratings. Try asking:
• "What's the rating for [STOCK_SYMBOL]?"
• "Show me all buy recommendations"
• "Compare AAPL and MSFT"
• "What stocks should I sell?"`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    console.log('Sending message:', inputValue);
    console.log('Current stock ratings:', stockRatings.length);
    console.log('Current scoring matrix:', scoringMatrix.length);

    const newMessage: Message = {
      id: messages.length + 1,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setMessages(prev => [...prev, newMessage]);
    const userInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      // Generate intelligent response using new AI system
      console.log('Generating intelligent response...');
      const response = await generateIntelligentResponse(userInput);
      console.log('Generated intelligent response:', response);
      
      const botResponse: Message = {
        id: messages.length + 2,
        content: response,
        sender: "bot",
        timestamp: new Date(),
        type: "text",
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorResponse: Message = {
        id: messages.length + 2,
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        type: "text",
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">
              {currentChat?.title || "AI Financial Assistant"}
            </h3>
            <p className="text-xs text-muted-foreground">Ready to help with stock analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Stock Advisor
              </h1>
              <p className="text-muted-foreground mb-8 max-w-lg text-lg">
                Your intelligent investment companion. Get real-time stock analysis, market insights, and personalized recommendations.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mb-8 w-full">
                <button 
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                  onClick={() => setInputValue("What stocks should I buy today?")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Investment Recommendations</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Get top stock picks based on real-time scoring and market analysis</p>
                </button>
                
                <button 
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                  onClick={() => setInputValue("Analyze AAPL")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Stock Analysis</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Deep dive into any stock with technical indicators and scoring</p>
                </button>
                
                <button 
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                  onClick={() => setInputValue("Compare AAPL vs MSFT")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Stock Comparison</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Compare multiple stocks side-by-side with detailed metrics</p>
                </button>
                
                <button 
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                  onClick={() => setInputValue("Help me diversify my portfolio")}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Target className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Portfolio Optimization</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Get personalized portfolio advice and diversification strategies</p>
                </button>
              </div>
              
            </div>
          ) : (
            messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.sender === "bot" && (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  
                  {message.type === "analysis" && (
                    <div className="mt-3 p-3 bg-background/50 rounded-lg border">
                      <Badge variant="secondary" className="mb-2">
                        📊 Analysis
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Technical indicators and predictions included
                      </p>
                    </div>
                  )}
                  
                  {message.type === "chart" && (
                    <div className="mt-3 p-3 bg-background/50 rounded-lg border">
                      <Badge variant="outline" className="mb-2">
                        📈 Chart Data
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Comparative analysis chart available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {message.sender === "user" && (
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Always visible */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about stocks, analysis, or predictions..."
              className="flex-1 h-12 rounded-2xl border-2 focus:border-primary"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim()}
              className="h-12 w-12 rounded-2xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
