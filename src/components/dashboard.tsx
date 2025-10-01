"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { StockChart } from "@/components/stock-chart";
import { PredictionCard } from "@/components/prediction-card";
import { MarketOverview } from "@/components/market-overview";

// Mock data for demonstration
const marketMetrics = {
  totalValue: 1250000,
  dayChange: 12500,
  dayChangePercent: 1.01,
  weekChange: -2500,
  weekChangePercent: -0.2,
  monthChange: 15000,
  monthChangePercent: 1.22,
};

const topStocks = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 175.43,
    change: 2.34,
    changePercent: 1.35,
    volume: "45.2M",
    marketCap: "2.8T",
    trend: "up" as const,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 378.85,
    change: -1.23,
    changePercent: -0.32,
    volume: "28.7M",
    marketCap: "2.8T",
    trend: "down" as const,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.56,
    change: 3.21,
    changePercent: 2.31,
    volume: "32.1M",
    marketCap: "1.8T",
    trend: "up" as const,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 155.78,
    change: 0.89,
    changePercent: 0.57,
    volume: "38.9M",
    marketCap: "1.6T",
    trend: "up" as const,
  },
];

const predictions = [
  {
    symbol: "AAPL",
    currentPrice: 175.43,
    predictedPrice: 182.50,
    confidence: 87,
    timeframe: "1 Week",
    trend: "bullish" as const,
  },
  {
    symbol: "TSLA",
    currentPrice: 248.12,
    predictedPrice: 235.80,
    confidence: 72,
    timeframe: "2 Weeks",
    trend: "bearish" as const,
  },
  {
    symbol: "NVDA",
    currentPrice: 875.28,
    predictedPrice: 920.15,
    confidence: 91,
    timeframe: "1 Month",
    trend: "bullish" as const,
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening in the markets today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button size="sm">
            <Target className="w-4 h-4 mr-2" />
            New Prediction
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${marketMetrics.totalValue.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {marketMetrics.dayChange > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={marketMetrics.dayChange > 0 ? "text-green-500" : "text-red-500"}>
                {marketMetrics.dayChange > 0 ? "+" : ""}${marketMetrics.dayChange.toLocaleString()} ({marketMetrics.dayChangePercent > 0 ? "+" : ""}{marketMetrics.dayChangePercent}%)
              </span>
              <span className="ml-1">today</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Week Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketMetrics.weekChange > 0 ? "+" : ""}${Math.abs(marketMetrics.weekChange).toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {marketMetrics.weekChange > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={marketMetrics.weekChange > 0 ? "text-green-500" : "text-red-500"}>
                {marketMetrics.weekChange > 0 ? "+" : ""}{marketMetrics.weekChangePercent}%
              </span>
              <span className="ml-1">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +${marketMetrics.monthChange.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">+{marketMetrics.monthChangePercent}%</span>
              <span className="ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Predictions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictions.length}</div>
            <p className="text-xs text-muted-foreground">
              {predictions.filter(p => p.confidence > 80).length} high confidence
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
          <TabsTrigger value="analysis">Technical Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Market Performance</CardTitle>
                <CardDescription>
                  Real-time market data and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StockChart />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Movers</CardTitle>
                <CardDescription>
                  Biggest price movements today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topStocks.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{stock.symbol[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{stock.symbol}</p>
                          <p className="text-xs text-muted-foreground">{stock.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${stock.price}</p>
                        <div className="flex items-center text-xs">
                          {stock.trend === "up" ? (
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span className={stock.trend === "up" ? "text-green-500" : "text-red-500"}>
                            {stock.change > 0 ? "+" : ""}{stock.change} ({stock.changePercent > 0 ? "+" : ""}{stock.changePercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <MarketOverview />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {predictions.map((prediction) => (
              <PredictionCard key={prediction.symbol} prediction={prediction} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Analysis</CardTitle>
              <CardDescription>
                Advanced charting and technical indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Technical analysis charts coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
