"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Send,
  Bot,
  User,
  Clock,
  MessageCircle,
  Plus,
  Trash2,
  MoreVertical,
} from "lucide-react";

interface Message {
  id: number;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  type?: "text" | "chart" | "analysis";
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentChat?: {
    id: string;
    title: string;
  };
}

const mockMessages: Message[] = [
  {
    id: 1,
    content: "Hello! I'm your AI financial assistant. How can I help you analyze stocks today?",
    sender: "bot",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    type: "text",
  },
  {
    id: 2,
    content: "Can you analyze AAPL's recent performance and give me a prediction?",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    type: "text",
  },
  {
    id: 3,
    content: "Based on my analysis of AAPL's recent performance, I can see several positive indicators:\n\n• Strong Q4 earnings beat expectations\n• RSI at 65.4 (neutral to bullish)\n• MACD showing bullish crossover\n• Price above 50-day SMA\n\nMy prediction for the next 30 days: **$182.50** with 87% confidence.\n\nWould you like me to show you the technical analysis chart?",
    sender: "bot",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    type: "analysis",
  },
  {
    id: 4,
    content: "Yes, please show me the chart and also compare it with MSFT",
    sender: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    type: "text",
  },
  {
    id: 5,
    content: "I'll generate a comparative analysis chart for AAPL vs MSFT. Here's what I found:\n\n**AAPL vs MSFT Comparison:**\n• AAPL: +2.3% today, Strong buy signal\n• MSFT: -0.3% today, Hold signal\n• Correlation: 0.78 (highly correlated)\n\nBoth stocks show similar sector performance but AAPL has stronger momentum indicators. Would you like me to create a portfolio allocation recommendation?",
    sender: "bot",
    timestamp: new Date(Date.now() - 1000 * 60 * 1),
    type: "chart",
  },
];

export function ChatPanel({ isOpen, onClose, currentChat }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        content: "I'm analyzing your request and will provide a detailed response shortly. This is a demo response - in a real implementation, this would connect to your AI model.",
        sender: "bot",
        timestamp: new Date(),
        type: "text",
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 2000);
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
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to AI Financial Assistant</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                I&apos;m here to help you analyze stocks, make predictions, and answer questions about the financial markets. What would you like to know?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mb-8">
                <button 
                  className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                  onClick={() => setInputValue("Analyze AAPL stock performance")}
                >
                  <h3 className="font-medium mb-1">📊 Analyze AAPL</h3>
                  <p className="text-sm text-muted-foreground">Get detailed analysis of Apple stock</p>
                </button>
                <button 
                  className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                  onClick={() => setInputValue("What are the top performing stocks today?")}
                >
                  <h3 className="font-medium mb-1">📈 Market Overview</h3>
                  <p className="text-sm text-muted-foreground">See today&apos;s market movers</p>
                </button>
                <button 
                  className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                  onClick={() => setInputValue("Predict NVDA stock price for next month")}
                >
                  <h3 className="font-medium mb-1">🔮 Stock Prediction</h3>
                  <p className="text-sm text-muted-foreground">Get AI-powered price predictions</p>
                </button>
                <button 
                  className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
                  onClick={() => setInputValue("Help me optimize my portfolio")}
                >
                  <h3 className="font-medium mb-1">💼 Portfolio Help</h3>
                  <p className="text-sm text-muted-foreground">Get portfolio optimization advice</p>
                </button>
              </div>
              
              {/* Centered Input for New Chat */}
              <div className="w-full max-w-2xl">
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
        </div>
      </ScrollArea>

      {/* Input Area - Only show when there are messages */}
      {messages.length > 0 && (
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
      )}
    </div>
  );
}
