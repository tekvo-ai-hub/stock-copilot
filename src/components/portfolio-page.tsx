"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  DollarSign,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Mock portfolio data
const portfolioSummary = {
  totalValue: 125000,
  dayChange: 1250,
  dayChangePercent: 1.01,
  totalGain: 15000,
  totalGainPercent: 13.64,
  cash: 5000,
  invested: 120000,
};

const holdings = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    shares: 100,
    avgPrice: 150.00,
    currentPrice: 175.43,
    value: 17543,
    gain: 2543,
    gainPercent: 16.95,
    weight: 14.03,
    trend: "up" as const,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    shares: 50,
    avgPrice: 350.00,
    currentPrice: 378.85,
    value: 18942.50,
    gain: 1442.50,
    gainPercent: 8.24,
    weight: 15.15,
    trend: "up" as const,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    shares: 75,
    avgPrice: 130.00,
    currentPrice: 142.56,
    value: 10692,
    gain: 942,
    gainPercent: 9.65,
    weight: 8.55,
    trend: "up" as const,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    shares: 25,
    avgPrice: 280.00,
    currentPrice: 248.12,
    value: 6203,
    gain: -799,
    gainPercent: -11.41,
    weight: 4.96,
    trend: "down" as const,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    shares: 20,
    avgPrice: 800.00,
    currentPrice: 875.28,
    value: 17505.60,
    gain: 1505.60,
    gainPercent: 9.41,
    weight: 14.00,
    trend: "up" as const,
  },
];

const watchlist = [
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 155.78, change: 0.89, changePercent: 0.57 },
  { symbol: "META", name: "Meta Platforms Inc.", price: 312.45, change: 4.23, changePercent: 1.37 },
  { symbol: "NFLX", name: "Netflix Inc.", price: 425.67, change: -2.34, changePercent: -0.55 },
];

export function PortfolioPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground">
            Track your investments and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Minus className="w-4 h-4 mr-2" />
            Sell
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Buy
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolioSummary.totalValue.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {portfolioSummary.dayChange > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={portfolioSummary.dayChange > 0 ? "text-green-500" : "text-red-500"}>
                {portfolioSummary.dayChange > 0 ? "+" : ""}${portfolioSummary.dayChange.toLocaleString()} ({portfolioSummary.dayChangePercent > 0 ? "+" : ""}{portfolioSummary.dayChangePercent}%)
              </span>
              <span className="ml-1">today</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +${portfolioSummary.totalGain.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{portfolioSummary.totalGainPercent}% all time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invested Amount</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolioSummary.invested.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total invested capital
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolioSummary.cash.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for trading
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Tabs */}
      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Holdings</CardTitle>
              <CardDescription>
                Your current stock positions and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Avg Price</TableHead>
                    <TableHead>Current Price</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Gain/Loss</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((holding) => (
                    <TableRow key={holding.symbol}>
                      <TableCell className="font-medium">{holding.symbol}</TableCell>
                      <TableCell>{holding.name}</TableCell>
                      <TableCell>{holding.shares}</TableCell>
                      <TableCell>${holding.avgPrice.toFixed(2)}</TableCell>
                      <TableCell>${holding.currentPrice.toFixed(2)}</TableCell>
                      <TableCell>${holding.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {holding.trend === "up" ? (
                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-500" />
                          )}
                          <span className={holding.trend === "up" ? "text-green-600" : "text-red-600"}>
                            {holding.gain > 0 ? "+" : ""}${holding.gain.toLocaleString()} ({holding.gainPercent > 0 ? "+" : ""}{holding.gainPercent}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={holding.weight} className="w-16 h-2" />
                          <span className="text-sm">{holding.weight}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Watchlist</CardTitle>
              <CardDescription>
                Stocks you're monitoring for potential investment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {watchlist.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{stock.symbol[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground">{stock.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${stock.price}</p>
                      <div className="flex items-center gap-1">
                        {stock.change > 0 ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                        )}
                        <span className={stock.change > 0 ? "text-green-600" : "text-red-600"}>
                          {stock.change > 0 ? "+" : ""}{stock.change} ({stock.changePercent > 0 ? "+" : ""}{stock.changePercent}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Analyze
                      </Button>
                      <Button size="sm">
                        Buy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>
                Historical performance and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Performance charts coming soon...</p>
                  <p className="text-sm">Interactive performance analytics and benchmarking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>
                  Portfolio distribution by asset type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4" />
                    <p>Allocation chart coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sector Allocation</CardTitle>
                <CardDescription>
                  Portfolio distribution by sector
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Technology</span>
                    <div className="flex items-center gap-2">
                      <Progress value={65} className="w-20 h-2" />
                      <span className="text-sm font-medium">65%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Consumer Discretionary</span>
                    <div className="flex items-center gap-2">
                      <Progress value={20} className="w-20 h-2" />
                      <span className="text-sm font-medium">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Automotive</span>
                    <div className="flex items-center gap-2">
                      <Progress value={10} className="w-20 h-2" />
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cash</span>
                    <div className="flex items-center gap-2">
                      <Progress value={5} className="w-20 h-2" />
                      <span className="text-sm font-medium">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
