"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";

// Mock market data
const marketIndices = [
  {
    name: "S&P 500",
    symbol: "SPX",
    value: 4567.89,
    change: 23.45,
    changePercent: 0.52,
    trend: "up" as const,
  },
  {
    name: "Dow Jones",
    symbol: "DJI",
    value: 34567.89,
    change: -123.45,
    changePercent: -0.36,
    trend: "down" as const,
  },
  {
    name: "NASDAQ",
    symbol: "IXIC",
    value: 14234.56,
    change: 89.12,
    changePercent: 0.63,
    trend: "up" as const,
  },
  {
    name: "Russell 2000",
    symbol: "RUT",
    value: 1987.65,
    change: 12.34,
    changePercent: 0.62,
    trend: "up" as const,
  },
];

const topGainers = [
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 875.28, change: 12.45, changePercent: 1.44 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.56, change: 3.21, changePercent: 2.31 },
  { symbol: "AAPL", name: "Apple Inc.", price: 175.43, change: 2.34, changePercent: 1.35 },
  { symbol: "META", name: "Meta Platforms Inc.", price: 312.45, change: 4.23, changePercent: 1.37 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 155.78, change: 0.89, changePercent: 0.57 },
];

const topLosers = [
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.12, change: -5.67, changePercent: -2.23 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", price: 156.78, change: -2.34, changePercent: -1.47 },
  { symbol: "WMT", name: "Walmart Inc.", price: 145.23, change: -1.89, changePercent: -1.28 },
  { symbol: "JNJ", name: "Johnson & Johnson", price: 156.45, change: -1.23, changePercent: -0.78 },
  { symbol: "PG", name: "Procter & Gamble", price: 145.67, change: -0.89, changePercent: -0.61 },
];

const mostActive = [
  { symbol: "AAPL", name: "Apple Inc.", price: 175.43, volume: "45.2M", change: 2.34, changePercent: 1.35 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.12, volume: "52.1M", change: -5.67, changePercent: -2.23 },
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 875.28, volume: "41.3M", change: 12.45, changePercent: 1.44 },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 378.85, volume: "28.7M", change: -1.23, changePercent: -0.32 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.56, volume: "32.1M", change: 3.21, changePercent: 2.31 },
];

const sectors = [
  { name: "Technology", change: 1.2, trend: "up" as const, marketCap: "12.5T" },
  { name: "Healthcare", change: 0.8, trend: "up" as const, marketCap: "4.2T" },
  { name: "Financials", change: -0.3, trend: "down" as const, marketCap: "3.8T" },
  { name: "Energy", change: 2.1, trend: "up" as const, marketCap: "2.1T" },
  { name: "Consumer Discretionary", change: 0.5, trend: "up" as const, marketCap: "3.2T" },
  { name: "Industrials", change: -0.1, trend: "down" as const, marketCap: "2.8T" },
  { name: "Materials", change: 0.9, trend: "up" as const, marketCap: "1.5T" },
  { name: "Utilities", change: -0.4, trend: "down" as const, marketCap: "1.2T" },
];

export function MarketPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Overview</h1>
          <p className="text-muted-foreground">
            Real-time market data and market movers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Globe className="w-4 h-4 mr-2" />
            Global Markets
          </Button>
        </div>
      </div>

      {/* Market Indices */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {marketIndices.map((index) => (
          <Card key={index.symbol}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{index.name}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {index.value.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {index.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                <span className={index.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {index.change > 0 ? "+" : ""}{index.change} ({index.changePercent > 0 ? "+" : ""}{index.changePercent}%)
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Market Movers</TabsTrigger>
          <TabsTrigger value="sectors">Sectors</TabsTrigger>
          <TabsTrigger value="global">Global Markets</TabsTrigger>
          <TabsTrigger value="news">Market News</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Top Gainers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Top Gainers
                </CardTitle>
                <CardDescription>
                  Biggest price increases today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topGainers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${stock.price}</p>
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                          <span className="text-green-600 text-sm">
                            +{stock.change} (+{stock.changePercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Losers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Top Losers
                </CardTitle>
                <CardDescription>
                  Biggest price decreases today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topLosers.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${stock.price}</p>
                        <div className="flex items-center gap-1">
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                          <span className="text-red-600 text-sm">
                            {stock.change} ({stock.changePercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Active */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Most Active
                </CardTitle>
                <CardDescription>
                  Highest volume stocks today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mostActive.map((stock) => (
                    <div key={stock.symbol} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{stock.volume}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${stock.price}</p>
                        <div className="flex items-center gap-1">
                          {stock.change > 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-500" />
                          )}
                          <span className={stock.change > 0 ? "text-green-600" : "text-red-600"} text-sm>
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
        </TabsContent>

        <TabsContent value="sectors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sector Performance</CardTitle>
              <CardDescription>
                Today's sector performance and market capitalization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sector</TableHead>
                    <TableHead>Market Cap</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectors.map((sector) => (
                    <TableRow key={sector.name}>
                      <TableCell className="font-medium">{sector.name}</TableCell>
                      <TableCell>{sector.marketCap}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sector.trend === "up" ? "default" : "destructive"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {sector.trend === "up" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {sector.change > 0 ? "+" : ""}{sector.change}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${sector.trend === "up" ? "bg-green-500" : "bg-red-500"}`}
                              style={{ width: `${Math.abs(sector.change) * 50}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {sector.trend === "up" ? "Outperforming" : "Underperforming"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Markets</CardTitle>
              <CardDescription>
                International market performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                <div className="text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4" />
                  <p>Global markets data coming soon...</p>
                  <p className="text-sm">International market indices and currencies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market News</CardTitle>
              <CardDescription>
                Latest financial news and market updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Market news feed coming soon...</p>
                  <p className="text-sm">Real-time financial news and analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
