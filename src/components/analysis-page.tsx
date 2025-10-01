"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  DollarSign,
} from "lucide-react";

// Mock technical analysis data
const technicalIndicators = [
  { name: "RSI (14)", value: 65.4, signal: "neutral", description: "Relative Strength Index" },
  { name: "MACD", value: 2.34, signal: "bullish", description: "Moving Average Convergence Divergence" },
  { name: "SMA (50)", value: 172.45, signal: "bullish", description: "Simple Moving Average" },
  { name: "EMA (20)", value: 174.12, signal: "bullish", description: "Exponential Moving Average" },
  { name: "Bollinger Bands", value: "Upper", signal: "neutral", description: "Price near upper band" },
  { name: "Volume", value: "High", signal: "bullish", description: "Above average volume" },
];

const supportResistance = [
  { level: "Resistance 1", price: 178.50, strength: "Strong" },
  { level: "Resistance 2", price: 180.25, strength: "Medium" },
  { level: "Current Price", price: 175.43, strength: "Current" },
  { level: "Support 1", price: 172.80, strength: "Strong" },
  { level: "Support 2", price: 170.15, strength: "Medium" },
];

export function AnalysisPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technical Analysis</h1>
          <p className="text-muted-foreground">
            Advanced technical analysis and charting tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Export Analysis
          </Button>
          <Button>
            <Target className="w-4 h-4 mr-2" />
            Run Analysis
          </Button>
        </div>
      </div>

      {/* Stock Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Stock for Analysis</CardTitle>
          <CardDescription>
            Choose a stock symbol to perform technical analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Stock Symbol</Label>
              <Input
                id="symbol"
                placeholder="e.g., AAPL, MSFT, GOOGL"
                defaultValue="AAPL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select defaultValue="1d">
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="1w">1 Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select defaultValue="6m">
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Month</SelectItem>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="2y">2 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button className="w-full">
                Analyze
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="indicators">Technical Indicators</TabsTrigger>
          <TabsTrigger value="patterns">Chart Patterns</TabsTrigger>
          <TabsTrigger value="signals">Trading Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Signal</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">BUY</div>
                <p className="text-xs text-muted-foreground">
                  Strong bullish signals detected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">
                  High confidence level
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">MEDIUM</div>
                <p className="text-xs text-muted-foreground">
                  Moderate risk assessment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price Target</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$182.50</div>
                <p className="text-xs text-muted-foreground">
                  Next 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Price Chart</CardTitle>
              <CardDescription>
                Interactive chart with technical indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Interactive chart coming soon...</p>
                  <p className="text-sm">Advanced candlestick charts with technical overlays</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {technicalIndicators.map((indicator) => (
              <Card key={indicator.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{indicator.name}</CardTitle>
                    <Badge
                      variant={
                        indicator.signal === "bullish" ? "default" :
                        indicator.signal === "bearish" ? "destructive" : "secondary"
                      }
                      className="flex items-center gap-1"
                    >
                      {indicator.signal === "bullish" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : indicator.signal === "bearish" ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <Activity className="h-3 w-3" />
                      )}
                      {indicator.signal.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{indicator.value}</div>
                  <p className="text-xs text-muted-foreground">{indicator.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chart Patterns</CardTitle>
              <CardDescription>
                Identified chart patterns and formations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Ascending Triangle</p>
                      <p className="text-sm text-muted-foreground">Bullish continuation pattern</p>
                    </div>
                  </div>
                  <Badge variant="default">Strong</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Double Bottom</p>
                      <p className="text-sm text-muted-foreground">Potential reversal pattern</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Moderate</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Flag Pattern</p>
                      <p className="text-sm text-muted-foreground">Short-term consolidation</p>
                    </div>
                  </div>
                  <Badge variant="outline">Weak</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trading Signals</CardTitle>
              <CardDescription>
                AI-generated trading signals and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Entry Signals</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>MACD bullish crossover</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Price above 50-day SMA</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Volume confirmation</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Exit Signals</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>RSI approaching overbought</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>Price near resistance level</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Risk Management</h4>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Stop Loss:</span>
                      <span className="ml-2 font-medium">$168.50</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Take Profit:</span>
                      <span className="ml-2 font-medium">$182.50</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Risk/Reward:</span>
                      <span className="ml-2 font-medium">1:2.1</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
