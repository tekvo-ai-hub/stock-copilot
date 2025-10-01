"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

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

const sectorPerformance = [
  { sector: "Technology", change: 1.2, trend: "up" as const },
  { sector: "Healthcare", change: 0.8, trend: "up" as const },
  { sector: "Financials", change: -0.3, trend: "down" as const },
  { sector: "Energy", change: 2.1, trend: "up" as const },
  { sector: "Consumer Discretionary", change: 0.5, trend: "up" as const },
  { sector: "Industrials", change: -0.1, trend: "down" as const },
  { sector: "Materials", change: 0.9, trend: "up" as const },
  { sector: "Utilities", change: -0.4, trend: "down" as const },
];

export function MarketOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Market Indices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market Indices
          </CardTitle>
          <CardDescription>
            Major market indices performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketIndices.map((index) => (
              <div key={index.symbol} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{index.name}</p>
                  <p className="text-sm text-muted-foreground">{index.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{index.value.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    {index.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-sm ${index.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      {index.change > 0 ? "+" : ""}{index.change} ({index.changePercent > 0 ? "+" : ""}{index.changePercent}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sector Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Sector Performance
          </CardTitle>
          <CardDescription>
            Today's sector performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectorPerformance.map((sector) => (
                <TableRow key={sector.sector}>
                  <TableCell className="font-medium">{sector.sector}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={sector.trend === "up" ? "default" : "destructive"}
                      className="flex items-center gap-1 w-fit ml-auto"
                    >
                      {sector.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {sector.change > 0 ? "+" : ""}{sector.change}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
